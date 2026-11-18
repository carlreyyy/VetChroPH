// Local mock store. Every screen reads data and calls actions through useApp().
// To connect a backend later, replace the bodies of these actions with API calls; screens do not need to change.
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { Appt, Bill, BillItem, DB, FollowUp, Notif, Owner, PayAccount, PayMethod, Pet, Role, Service, User, Visit } from '../types';
import { seedDB, DEFAULT_PREFS } from '../data/seed';
import { ACTIVE, D, diff, fmtD, money, normPhone, pad, parseD, t12, ymd } from '../utils/format';

// Ids stay unique across browser refreshes because the counter starts from the clock.
let _id = Math.floor(Date.now() / 1000);
const uid = (p: string) => `${p}${++_id}`;
/** Demo verification code for every SMS code check. No real message is sent. */
export const DEMO_CODE = '123456';

/* ----- browser session (web only): data lives in this browser's storage, nothing is sent anywhere ----- */
const KEY = 'vetchroph.session.v1';
const store = () => { try { return typeof window !== 'undefined' && window.localStorage ? window.localStorage : null; } catch { return null; } };
function loadSession(): { db: DB; user: User | null } | null {
  try {
    const raw = store()?.getItem(KEY); if (!raw) return null;
    const s = JSON.parse(raw) as { day: string; db: DB; userId: string | null };
    if (s.day !== ymd(new Date())) return null; // sample dates are relative to today, so start fresh each day
    return { db: s.db, user: s.db.users.find(u => u.id === s.userId) || null };
  } catch { return null; }
}
function saveSession(db: DB, user: User | null) {
  try { store()?.setItem(KEY, JSON.stringify({ day: ymd(new Date()), db, userId: user?.id || null })); } catch { /* storage full or blocked: keep working in memory */ }
}
/** Clears saved demo data and reloads the page with fresh sample data. */
export function resetDemoData() {
  try { store()?.removeItem(KEY); } catch { /* ignore */ }
  if (typeof window !== 'undefined' && window.location) window.location.assign('/');
}

export interface Slot { t: string; off: boolean }
type N = Omit<Notif, 'id' | 'at' | 'unread'>;

function buildActions(db: DB, getUser: () => User | null, setUser: (u: User | null) => void, bump: () => void, toast: (m: string, err?: boolean) => void) {
  const me = () => getUser()!;
  const owner = (id: string) => db.owners.find(o => o.id === id)!;
  const pet = (id: string) => db.pets.find(p => p.id === id)!;
  const appt = (id: string) => db.appts.find(x => x.id === id)!;
  const notify = (to: string, n: N) => { (db.notifs[to] ||= []).unshift({ id: uid('n'), at: Date.now(), unread: true, ...n }); };
  const notifyClinic = (n: N) => { notify('staff', n); notify('admin', { ...n }); };
  const tellOwner = (ownerId: string, n: N) => notify('owner:' + ownerId, n);
  const log = (text: string) => db.activity.unshift({ id: uid('l'), at: Date.now(), who: getUser()?.name || 'System', text });
  const done = (msg?: string) => { bump(); if (msg) toast(msg); };
  const userByPhone = (p: string) => db.users.find(u => normPhone(u.phone) === normPhone(p));

  const a = {
    /* ----- session (consultation D6: email + password, or mobile number + verification code) ----- */
    loginEmail(email: string, pw: string): string | null {
      const u = db.users.find(x => x.email.toLowerCase() === email.trim().toLowerCase());
      if (!u || u.pass !== pw) return 'The email or password is not correct.';
      if (u.status !== 'active') return 'This account is deactivated. Please contact the clinic.';
      u.lastActive = D(0); setUser(u); return null;
    },
    /** Step 1 of mobile login. Returns an error message, or null when a code was "sent". */
    requestCode(phone: string): string | null {
      const u = userByPhone(phone);
      if (!u) return 'No account uses this mobile number. Sign up first.';
      if (u.status !== 'active') return 'This account is deactivated. Please contact the clinic.';
      toast(`Code sent to ${normPhone(phone)} (demo code ${DEMO_CODE})`); return null;
    },
    loginCode(phone: string, code: string): string | null {
      if (code.trim() !== DEMO_CODE) return 'That code is not right. Check and try again.';
      const u = userByPhone(phone)!; u.lastActive = D(0); setUser(u); return null;
    },
    demoLogin(userId: string) { setUser(db.users.find(x => x.id === userId)!); },
    logout() { setUser(null); },
    /** Consultation D7: pet owners register through the app. Checked before the code step. */
    checkSignup(f: { phone: string; email: string }): { field?: string; error?: string } {
      if (userByPhone(f.phone)) return { field: 'phone', error: 'This number already has an account. Log in instead, or contact the clinic.' };
      if (db.users.some(u => u.email.toLowerCase() === f.email.trim().toLowerCase())) return { field: 'email', error: 'This email is already in use. Log in instead.' };
      return {};
    },
    signup(f: { name: string; phone: string; email: string; pw: string }) {
      const o: Owner = { id: uid('o'), name: f.name.trim(), phone: normPhone(f.phone), email: f.email.trim(), address: '', since: D(0), notes: [] };
      db.owners.push(o);
      const u: User = { id: uid('u'), name: o.name, role: 'owner', email: o.email, phone: o.phone, status: 'active', ownerId: o.id, pass: f.pw, lastActive: D(0), prefs: { ...DEFAULT_PREFS } };
      db.users.push(u); setUser(u); toast('Welcome! Add your first pet to get started.');
    },
    resetPassword(phone: string, pw: string): string | null {
      const u = userByPhone(phone); if (!u) return 'No account uses this mobile number.';
      u.pass = pw; toast('Password updated. You can log in now.'); return null;
    },
    updateProfile(f: { name: string; phone: string; email: string; address?: string }) {
      const u = me(); Object.assign(u, { name: f.name, phone: normPhone(f.phone), email: f.email });
      if (u.ownerId) Object.assign(owner(u.ownerId), { name: f.name, phone: normPhone(f.phone), email: f.email, address: f.address ?? owner(u.ownerId).address });
      done('Profile saved');
    },
    setPrefs(p: Partial<NonNullable<User['prefs']>>) { const u = me(); u.prefs = { ...(u.prefs || DEFAULT_PREFS), ...p }; done('Notification setting saved'); },
    changePassword(oldPw: string, newPw: string): string | null {
      if (me().pass !== oldPw) return 'Current password is not correct';
      me().pass = newPw; done('Password changed'); return null;
    },

    /* ----- notifications ----- */
    inboxKey(): string { const u = getUser(); return !u ? '' : u.role === 'owner' ? 'owner:' + u.ownerId : u.role; },
    markRead(id: string) { const n = (db.notifs[a.inboxKey()] || []).find(x => x.id === id); if (n && n.unread) { n.unread = false; bump(); } },
    markAllRead() { (db.notifs[a.inboxKey()] || []).forEach(n => (n.unread = false)); done('All notifications marked as read'); },

    /* ----- messaging (consultation D20). Real-time delivery needs the backend; here messages update instantly in memory. ----- */
    sendMessage(ownerId: string, text: string) {
      const u = me(); const fromOwner = u.role === 'owner';
      (db.messages[ownerId] ||= []).push({ id: uid('m'), at: Date.now(), from: fromOwner ? 'owner' : 'clinic', by: u.name, text: text.trim(), read: false });
      if (fromOwner) notifyClinic({ title: 'New message', body: `${u.name}: ${text.trim().slice(0, 80)}`, icon: 'chat', tone: '', link: { screen: 'Chat', params: { ownerId } } });
      else tellOwner(ownerId, { title: 'New message from the clinic', body: text.trim().slice(0, 90), icon: 'chat', tone: '', link: { screen: 'Chat' } });
      bump();
    },
    /** Marks the other side's messages in a thread as read. */
    readThread(ownerId: string) {
      const side = me().role === 'owner' ? 'clinic' : 'owner'; let changed = false;
      (db.messages[ownerId] || []).forEach(m => { if (m.from === side && !m.read) { m.read = true; changed = true; } });
      if (changed) bump();
    },

    /* ----- owners and pets ----- */
    savePet(p: Partial<Pet> & { ownerId: string }): Pet {
      if (p.id) { Object.assign(pet(p.id), p); log(`Updated pet profile: ${p.name}`); done('Pet profile saved'); return pet(p.id); }
      const np: Pet = { id: uid('p'), name: '', species: 'dog', breed: '', sex: 'Male', birth: D(-365), weight: 0, coat: '', status: 'active', ...p } as Pet;
      db.pets.push(np); log(`Registered pet ${np.name}`); done(`${np.name} added`); return np;
    },
    setPetStatus(id: string, status: Pet['status']) { pet(id).status = status; log(`Marked ${pet(id).name} as ${status}`); done(`${pet(id).name} marked ${status}`); },
    updateOwner(id: string, f: Partial<Owner>) { Object.assign(owner(id), f); log(`Updated owner ${owner(id).name}`); done('Owner details saved'); },
    addStaffNote(ownerId: string, text: string) { owner(ownerId).notes.unshift({ id: uid('sn'), at: Date.now(), by: me().name, text }); done('Note added'); },
    findOwnerByPhone: (p: string) => db.owners.find(o => normPhone(o.phone) === normPhone(p)),
    addDoc(petId: string, kind: string, name: string, size?: string) {
      db.docs.unshift({ id: uid('d'), petId, name, kind, size: size || `${(Math.random() * 1.5 + 0.2).toFixed(1)} MB`, date: D(0), by: me().name });
      if (me().role === 'owner') notifyClinic({ title: 'New file uploaded', body: `${me().name} added a ${kind.toLowerCase()} for ${pet(petId).name}.`, icon: 'file', tone: '', link: { screen: 'PetDetail', params: { id: petId, tab: 'docs' } } });
      done('File uploaded');
    },
    removeDoc(id: string) { db.docs = db.docs.filter(d => d.id !== id); done('File removed'); },

    /* ----- appointments ----- */
    slotsFor(date: string, exceptId?: string): Slot[] | null {
      const s = db.settings, dow = parseD(date).getDay(), day = s.days[dow];
      if (!day || !day.open) return null;
      const out: Slot[] = []; const now = new Date();
      for (let m = day.from * 60; m + s.slotMinutes <= day.to * 60; m += s.slotMinutes) {
        const h = m / 60;
        if (dow !== 0 && h >= s.lunch[0] && h < s.lunch[1]) continue;
        const t = `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
        const taken = db.appts.some(x => x.id !== exceptId && x.date === date && x.time === t && ACTIVE.includes(x.status));
        const past = date === ymd(new Date()) && m <= now.getHours() * 60 + now.getMinutes();
        out.push({ t, off: taken || past });
      }
      return out;
    },
    hasClash: (petId: string, date: string, time: string, exceptId?: string) =>
      db.appts.some(x => x.id !== exceptId && x.petId === petId && x.date === date && x.time === time && ACTIVE.includes(x.status)),
    /** Consultation D8: confirmed automatically when the time slot is still free. */
    book(f: { petId: string; service: string; date: string; time: string; reason: string }, byStaff: boolean): Appt | string {
      if (!a.slotsFor(f.date)?.some(s => s.t === f.time && !s.off)) return 'That time was just taken. Please choose another.';
      const p = pet(f.petId);
      const ap: Appt = { id: uid('a'), ownerId: p.ownerId, status: 'confirmed', by: byStaff ? 'staff' : 'owner', handledBy: byStaff ? me().name : undefined, ...f };
      db.appts.push(ap);
      const line = `${p.name} · ${f.service} · ${fmtD(f.date)} at ${t12(f.time)}`;
      tellOwner(p.ownerId, { title: byStaff ? 'Appointment booked by the clinic' : 'Booking confirmed', body: line, icon: 'calendar', tone: 'ok', link: { screen: 'ApptDetail', params: { id: ap.id } } });
      if (byStaff) log(`Booked ${p.name} for ${fmtD(f.date)} ${t12(f.time)}`);
      else notifyClinic({ title: 'New booking', body: `${p.name} (${owner(p.ownerId).name}) · ${f.service} · ${fmtD(f.date)} ${t12(f.time)}`, icon: 'calendar', tone: 'ok', link: { screen: 'ApptDetail', params: { id: ap.id } } });
      bump(); return ap;
    },
    /** Consultation D9: owners may cancel or reschedule up to 24 hours before (changeable in Setup). */
    canOwnerChange(ap: Appt) {
      const at = parseD(ap.date); const [h, m] = ap.time.split(':').map(Number); at.setHours(h, m);
      return (at.getTime() - Date.now()) / 36e5 >= db.settings.cancelCutoffHours;
    },
    cancelByOwner(id: string) {
      const ap = appt(id); ap.status = 'cancelled'; ap.note = 'Cancelled by owner';
      notifyClinic({ title: 'Appointment cancelled', body: `${pet(ap.petId).name} · ${fmtD(ap.date)} ${t12(ap.time)}`, icon: 'calendar', tone: '', link: { screen: 'ApptDetail', params: { id } } });
      done('Appointment cancelled');
    },
    rescheduleByOwner(id: string, date: string, time: string) {
      const ap = appt(id); Object.assign(ap, { date, time, status: 'confirmed', offer: undefined });
      notifyClinic({ title: 'Appointment moved', body: `${pet(ap.petId).name} moved to ${fmtD(date)} ${t12(time)}`, icon: 'calendar', tone: '', link: { screen: 'ApptDetail', params: { id } } });
      done('Appointment moved and confirmed');
    },
    respondOffer(id: string, accept: boolean) {
      const ap = appt(id);
      if (accept && ap.offer) Object.assign(ap, { date: ap.offer.date, time: ap.offer.time, status: 'confirmed', offer: undefined });
      else Object.assign(ap, { status: 'cancelled', note: 'Owner declined the suggested time', offer: undefined });
      notifyClinic({ title: accept ? 'Suggested time accepted' : 'Suggested time declined', body: `${pet(ap.petId).name} · ${owner(ap.ownerId).name}`, icon: 'calendar', tone: accept ? 'ok' : '', link: { screen: 'ApptDetail', params: { id } } });
      done(accept ? 'Appointment confirmed' : 'Appointment cancelled');
    },
    setApptStatus(id: string, status: Appt['status'], extra: Partial<Appt> = {}) {
      const ap = appt(id); Object.assign(ap, { status, handledBy: me().name }, extra);
      const p = pet(ap.petId), when = `${fmtD(ap.date)} at ${t12(ap.time)}`;
      const msg: Partial<Record<Appt['status'], [string, string, Notif['tone']]>> = {
        cancelled: ['Appointment cancelled by the clinic', `${p.name}'s visit on ${when} was cancelled. Reason: ${extra.note || 'not given'}.`, 'bad'],
        resched: ['New time suggested', `The clinic suggests ${ap.offer ? fmtD(ap.offer.date) + ' at ' + t12(ap.offer.time) : ''} for ${p.name}. Please accept or decline.`, 'warn'],
        missed: ['Appointment marked as missed', `${p.name}'s visit on ${when} was marked as missed. Book again anytime.`, ''],
      };
      const m = msg[status];
      if (m) tellOwner(ap.ownerId, { title: m[0], body: m[1], icon: 'calendar', tone: m[2], link: { screen: 'ApptDetail', params: { id } } });
      // Consultation D10: a missed visit adds a note to the owner's record.
      if (status === 'missed') owner(ap.ownerId).notes.unshift({ id: uid('sn'), at: Date.now(), by: me().name, text: `Missed visit (${fmtD(ap.date)}, ${p.name}, ${ap.service})${extra.note ? `: ${extra.note}` : ''}` });
      const verbs: Partial<Record<Appt['status'], string>> = { cancelled: 'Cancelled', resched: 'Suggested a new time for', checked_in: 'Checked in', missed: 'Marked as missed', completed: 'Completed' };
      log(`${verbs[status] || 'Updated'} ${p.name}’s appointment`);
      done(({ cancelled: 'Appointment cancelled. Owner notified.', resched: 'New time sent to the owner', checked_in: `${p.name} checked in`, missed: 'Marked as missed. Note added to the owner record.', completed: 'Visit completed' } as Record<string, string>)[status]);
    },

    /* ----- medical records ----- */
    saveVisit(v: Partial<Visit> & { petId: string }, apptId?: string): Visit {
      let visit: Visit;
      if (v.id) { visit = db.visits.find(x => x.id === v.id)!; Object.assign(visit, v); visit.edits.push({ at: Date.now(), by: me().name }); }
      else { visit = { id: uid('v'), date: D(0), complaint: '', findings: '', diagnosis: '', treatment: '', medication: '', weight: 0, vet: me().name, edits: [], ...v } as Visit; db.visits.push(visit); }
      if (visit.weight) pet(v.petId).weight = visit.weight;
      if (apptId) { const ap = appt(apptId); if (ap && ap.status !== 'completed') ap.status = 'completed'; }
      log(`${v.id ? 'Edited' : 'Saved'} ${me().role === 'staff' ? 'visit details' : 'a consultation record'} for ${pet(v.petId).name}`);
      done(v.id ? 'Record updated. The edit was logged.' : 'Record saved'); return visit;
    },
    addNote(petId: string, text: string) { db.notes.push({ id: uid('pn'), petId, date: D(0), text, by: me().name }); log(`Added a progress note for ${pet(petId).name}`); done('Progress note added'); },
    addFollowUp(f: Omit<FollowUp, 'id' | 'status' | 'setBy'>, quiet = false) {
      db.followups.push({ id: uid('f'), status: 'open', setBy: me().name, ...f });
      tellOwner(pet(f.petId).ownerId, { title: f.kind === 'Recheck' ? 'Follow-up visit set' : `${f.kind} due date set`, body: `${pet(f.petId).name}: ${f.reason} on ${fmtD(f.date)}. You will get a reminder.`, icon: f.kind === 'Recheck' ? 'repeat' : f.kind === 'Vaccination' ? 'syringe' : 'pill', tone: '', link: { screen: 'PetDetail', params: { id: f.petId, tab: 'follow' } } });
      log(`Set ${f.kind.toLowerCase()} for ${pet(f.petId).name} on ${fmtD(f.date)}`);
      done(quiet ? undefined : 'Saved. The owner will be reminded.');
    },
    setFollowUpDone(id: string) { const f = db.followups.find(x => x.id === id)!; f.status = 'done'; log(`Marked ${f.reason} done for ${pet(f.petId).name}`); done('Marked done'); },
    remindOwner(petId: string, what: string) {
      const p = pet(petId); tellOwner(p.ownerId, { title: 'Reminder from the clinic', body: `${p.name}: ${what}. Book a visit in the app or call us.`, icon: 'bell', tone: 'warn', link: { screen: 'PetDetail', params: { id: petId, tab: 'follow' } } });
      log(`Sent a reminder to ${owner(p.ownerId).name} about ${p.name}`); done(`Reminder sent to ${owner(p.ownerId).name}`);
    },

    /* ----- billing and payments (consultation D12, D14: full payment only) ----- */
    createBill(petId: string, items: BillItem[], apptId: string | null): Bill {
      const p = pet(petId);
      const b: Bill = { id: uid('b'), petId, ownerId: p.ownerId, apptId, date: D(0), items, payments: [] };
      db.bills.unshift(b);
      const total = items.reduce((s, i) => s + i.price * i.qty, 0);
      tellOwner(p.ownerId, { title: 'Bill ready', body: `${p.name}'s bill is ${money(total)}. Pay by GCash, e-wallet, bank transfer or at the clinic.`, icon: 'receipt', tone: '', link: { screen: 'BillDetail', params: { id: b.id } } });
      log(`Created a ${money(total)} bill for ${p.name}`); done('Bill created. Owner notified.'); return b;
    },
    recordCash(billId: string) {
      const b = db.bills.find(x => x.id === billId)!; const amount = b.items.reduce((s, i) => s + i.price * i.qty, 0);
      b.payments.push({ id: uid('y'), method: 'Cash', amount, ref: '', proof: '', status: 'confirmed', date: D(0), by: me().name, verifiedBy: me().name });
      tellOwner(b.ownerId, { title: 'Payment recorded', body: `${money(amount)} cash payment for ${pet(b.petId).name}. Receipt issued.`, icon: 'check', tone: 'ok', link: { screen: 'Receipt', params: { id: b.id } } });
      log(`Recorded ${money(amount)} cash for ${pet(b.petId).name}`); done('Cash payment recorded. Receipt issued.');
    },
    submitProof(billId: string, method: PayMethod, ref: string, proof: string) {
      const b = db.bills.find(x => x.id === billId)!; const amount = b.items.reduce((s, i) => s + i.price * i.qty, 0);
      b.payments.push({ id: uid('y'), method, amount, ref, proof, status: 'pending', date: D(0), by: me().name });
      notifyClinic({ title: 'Payment proof submitted', body: `${pet(b.petId).name} (${me().name}) sent ${money(amount)} by ${method}. Check the clinic account.`, icon: 'banknote', tone: 'warn', link: { screen: 'BillDetail', params: { id: b.id } } });
      done('Proof sent. The clinic will check it.');
    },
    verifyPayment(billId: string, payId: string, ok: boolean, reason?: string) {
      const b = db.bills.find(x => x.id === billId)!; const y = b.payments.find(x => x.id === payId)!;
      Object.assign(y, { status: ok ? 'confirmed' : 'rejected', verifiedBy: me().name, reason });
      tellOwner(b.ownerId, ok
        ? { title: 'Payment confirmed', body: `Your ${money(y.amount)} payment for ${pet(b.petId).name} was confirmed. Receipt issued.`, icon: 'check', tone: 'ok', link: { screen: 'Receipt', params: { id: b.id } } }
        : { title: 'Payment not confirmed', body: `We could not match your ${money(y.amount)} payment. Reason: ${reason}. You can submit again.`, icon: 'alert', tone: 'bad', link: { screen: 'BillDetail', params: { id: b.id } } });
      log(`${ok ? 'Confirmed' : 'Rejected'} a ${money(y.amount)} ${y.method} payment for ${pet(b.petId).name}`);
      done(ok ? 'Payment confirmed. Receipt issued.' : 'Payment rejected. Owner notified.');
    },

    /* ----- administrator ----- */
    saveUser(f: { id?: string; name: string; role: Role; email: string; phone: string }) {
      if (f.id) { Object.assign(db.users.find(u => u.id === f.id)!, { ...f, phone: normPhone(f.phone) }); log(`Edited account: ${f.name}`); done('Account saved'); return; }
      db.users.push({ id: uid('u'), status: 'active', pass: 'temp1234', lastActive: '', ...f, phone: normPhone(f.phone) });
      log(`Created ${f.role} account: ${f.name}`); done('Account created. Temporary password: temp1234');
    },
    setUserStatus(id: string, status: User['status']) {
      const u = db.users.find(x => x.id === id)!; u.status = status;
      log(`${status === 'active' ? 'Reactivated' : 'Deactivated'} account: ${u.name}`);
      done(status === 'active' ? `${u.name} can sign in again` : `${u.name} can no longer sign in. Records stay on file.`);
    },
    resetUserPassword(id: string) { const u = db.users.find(x => x.id === id)!; u.pass = 'temp1234'; log(`Reset password: ${u.name}`); done('Password reset. Temporary password: temp1234'); },
    saveClinic(f: Partial<DB['clinic']>) { Object.assign(db.clinic, f); log('Updated clinic profile'); done('Clinic profile saved'); },
    saveAccount(acc: PayAccount) {
      Object.assign(db.clinic.accounts.find(x => x.id === acc.id)!, acc); db.clinic.payUpdated = D(0);
      log(`Updated payment account: ${acc.provider}`); done('Payment account saved');
    },
    saveService(s: Partial<Service> & { name: string }) {
      if (s.id) Object.assign(db.services.find(x => x.id === s.id)!, s);
      else db.services.push({ id: uid('s'), category: 'Consultation', price: 0, minutes: 30, active: true, ...s } as Service);
      log(`${s.id ? 'Updated' : 'Added'} service: ${s.name}`); done('Service saved');
    },
    saveHours(days: DB['settings']['days'], slotMinutes: number, cutoff: number) {
      Object.assign(db.settings, { days, slotMinutes, cancelCutoffHours: cutoff }); log('Updated clinic hours and time slots'); done('Clinic hours saved');
    },
    toggleReminder(id: string) { const r = db.settings.reminders.find(x => x.id === id)!; r.on = !r.on; log(`${r.on ? 'Turned on' : 'Turned off'} reminder: ${r.name}`); bump(); },
    setReminderTiming(id: string, when: string[]) { db.settings.reminders.find(x => x.id === id)!.when = when; log('Changed reminder timing'); done('Reminder timing saved'); },
    toggleChannel(k: keyof DB['settings']['channels']) { db.settings.channels[k] = !db.settings.channels[k]; log(`Turned ${db.settings.channels[k] ? 'on' : 'off'} ${k.toUpperCase()} reminders`); bump(); },
  };
  return a;
}

type Actions = ReturnType<typeof buildActions>;
interface Ctx {
  db: DB; user: User | null; v: number; act: Actions;
  toastMsg: { text: string; err: boolean; key: number } | null; toast: (m: string, err?: boolean) => void;
}
const AppCtx = createContext<Ctx | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const dbRef = useRef<DB>(null as unknown as DB);
  const userRef = useRef<User | null>(null);
  if (!dbRef.current) { const saved = loadSession(); dbRef.current = saved?.db || seedDB(); userRef.current = saved?.user || null; }
  const [v, setV] = useState(0);
  const [user, setUserState] = useState<User | null>(userRef.current);
  // Keep the demo data and the signed-in account when the browser is refreshed.
  useEffect(() => { saveSession(dbRef.current, user); }, [v, user]);
  const [toastMsg, setToast] = useState<Ctx['toastMsg']>(null);
  const toast = useCallback((text: string, err = false) => setToast({ text, err, key: Date.now() }), []);
  const bump = useCallback(() => setV(x => x + 1), []);
  const setUser = useCallback((u: User | null) => { userRef.current = u; setUserState(u); }, []);
  const act = useMemo(() => buildActions(dbRef.current, () => userRef.current, setUser, bump, toast), [bump, setUser, toast]);
  const value = useMemo(() => ({ db: dbRef.current, user, v, act, toastMsg, toast }), [user, v, act, toastMsg, toast]);
  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export function useApp() {
  const c = useContext(AppCtx); if (!c) throw new Error('useApp outside AppProvider'); return c;
}

/* ----- small selectors shared by screens ----- */
export const sel = {
  owner: (db: DB, id: string) => db.owners.find(o => o.id === id),
  pet: (db: DB, id: string) => db.pets.find(p => p.id === id),
  appt: (db: DB, id: string) => db.appts.find(a => a.id === id),
  bill: (db: DB, id: string) => db.bills.find(b => b.id === id),
  petsOf: (db: DB, ownerId: string) => db.pets.filter(p => p.ownerId === ownerId),
  /** Unread messages for the signed-in side. Clinic: all threads. Owner: their thread. */
  unreadMsgs: (db: DB, u: User) => u.role === 'owner'
    ? (db.messages[u.ownerId!] || []).filter(m => m.from === 'clinic' && !m.read).length
    : Object.values(db.messages).flat().filter(m => m.from === 'owner' && !m.read).length,
  /** Open follow-ups (rechecks, vaccines, deworming) for active pets, soonest first. */
  openFollowUps: (db: DB) => db.followups.filter(f => f.status === 'open' && db.pets.some(p => p.id === f.petId && p.status === 'active')).sort((a, b) => a.date.localeCompare(b.date)),
  overdueCount: (db: DB) => sel.openFollowUps(db).filter(f => diff(f.date) < 0).length,
};
