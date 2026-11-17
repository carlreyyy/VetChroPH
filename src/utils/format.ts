import type { Appt, ApptStatus, Bill, FollowKind, FollowUp } from '../types';
import type { Tone } from '../theme';

export const pad = (n: number) => String(n).padStart(2, '0');
export const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const DOWL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const today0 = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
export const TODAY = today0();
export const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
/** Date string n days from today. All mock data is relative to the day the app is opened. */
export const D = (n: number) => { const d = new Date(TODAY); d.setDate(d.getDate() + n); return ymd(d); };
export const parseD = (s: string) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
export const diff = (s: string) => Math.round((parseD(s).getTime() - TODAY.getTime()) / 864e5);
export const fmtD = (s: string) => { const d = parseD(s); return `${DOW[d.getDay()]}, ${MON[d.getMonth()]} ${d.getDate()}`; };
export const fmtDS = (s: string) => { const d = parseD(s); return `${MON[d.getMonth()]} ${d.getDate()}`; };
export const fmtDY = (s: string) => { const d = parseD(s); return `${MON[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`; };
export const rel = (s: string) => { const n = diff(s); return n === 0 ? 'Today' : n === 1 ? 'Tomorrow' : n === -1 ? 'Yesterday' : n > 0 ? `In ${n} days` : `${-n} days ago`; };
export const t12 = (t: string) => { const [h, m] = t.split(':').map(Number); return `${((h + 11) % 12) + 1}:${pad(m)} ${h >= 12 ? 'PM' : 'AM'}`; };
export const greeting = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'; };
export const firstName = (n: string) => n.startsWith('Dr.') ? n.split(' ').slice(0, 2).join(' ') : n.split(' ')[0];
export const hourLabel = (h: number) => t12(`${pad(h)}:00`);
export const money = (n: number) => '₱' + Number(n || 0).toLocaleString('en-PH', { maximumFractionDigits: 2 });
export const ago = (ms: number) => {
  const m = Math.round((Date.now() - ms) / 60000);
  if (m < 1) return 'Just now'; if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60); if (h < 24) return `${h} hr ago`;
  const d = Math.round(h / 24); return d === 1 ? 'Yesterday' : `${d} days ago`;
};
export const clock = (ms: number) => { const d = new Date(ms); return t12(`${pad(d.getHours())}:${pad(d.getMinutes())}`); };
export const ageOf = (b: string) => {
  const d = parseD(b); let m = (TODAY.getFullYear() - d.getFullYear()) * 12 + TODAY.getMonth() - d.getMonth();
  if (TODAY.getDate() < d.getDate()) m--;
  if (m < 12) return `${Math.max(m, 1)} mo`;
  const y = Math.floor(m / 12); return `${y} yr${y > 1 ? 's' : ''}`;
};
export const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : '');
export const initials = (n: string) => n.replace(/^(Dr|Mr|Ms|Mrs)\.?\s+/i, '').split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();
export const normPhone = (p: string) => {
  const d = String(p || '').replace(/\D/g, ''); const n = d.startsWith('63') ? '0' + d.slice(2) : d;
  return n.replace(/^(\d{4})(\d{3})(\d{4})$/, '$1 $2 $3');
};
export const isPhone = (v: string) => /^(\+?63|0)9\d{2}[\s-]?\d{3}[\s-]?\d{4}$/.test(String(v || '').trim());
export const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || '').trim());

/* ----- status helpers ----- */
export const APPT: Record<ApptStatus, [string, Tone]> = {
  confirmed: ['Confirmed', 'ok'], resched: ['New time offered', 'info'], checked_in: ['Checked in', 'info'],
  completed: ['Completed', 'ok'], cancelled: ['Cancelled', ''], missed: ['Missed', 'bad'],
};
export const ACTIVE: ApptStatus[] = ['confirmed', 'resched', 'checked_in'];
export const isUpcoming = (a: Appt) => ACTIVE.includes(a.status);
export const byDateTime = (a: Appt, b: Appt) => (a.date + a.time).localeCompare(b.date + b.time);

export type FollowKey = 'overdue' | 'soon' | 'later' | 'done';
/** Due soon = within 7 days. Matches the Due soon / Overdue / Done statuses in the consultation workflow. */
export function followStatus(f: FollowUp): { key: FollowKey; tone: Tone; label: string } {
  if (f.status === 'done') return { key: 'done', tone: 'ok', label: 'Done' };
  const n = diff(f.date);
  if (n < 0) return { key: 'overdue', tone: 'bad', label: `Overdue ${-n}d` };
  if (n <= 7) return { key: 'soon', tone: 'warn', label: n === 0 ? 'Due today' : `Due in ${n}d` };
  return { key: 'later', tone: '', label: `In ${n}d` };
}
export const FOLLOW_ICON = { Recheck: 'repeat', Vaccination: 'syringe', Deworming: 'pill' } as const satisfies Record<FollowKind, string>;

export const billTotal = (b: Bill) => b.items.reduce((s, i) => s + i.qty * i.price, 0);
export const billPaid = (b: Bill) => b.payments.filter(p => p.status === 'confirmed').reduce((s, p) => s + p.amount, 0);
export const billBalance = (b: Bill) => Math.max(0, billTotal(b) - billPaid(b));
/** Consultation D14: bills are paid in full, so there is no partially-paid state. */
export type BillState = 'paid' | 'pending' | 'unpaid';
export function billState(b: Bill): BillState {
  if (billPaid(b) >= billTotal(b)) return 'paid';
  return b.payments.some(p => p.status === 'pending') ? 'pending' : 'unpaid';
}
export const BILL: Record<BillState, [string, Tone]> = {
  paid: ['Paid', 'ok'], pending: ['Checking payment', 'warn'], unpaid: ['Unpaid', 'bad'],
};
