// Administrator screens. Consultation D2: three roles only, with the Administrator being the clinic owner, so this
// role covers clinic oversight (dashboard, monitoring, payments, reports, payment accounts) and setup
// (accounts, clinic profile, services and prices, hours, reminders, activity log).
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon } from '../components/Icon';
import { Avatar, Banner, Btn, Card, Check, Chips, Empty, Field, Group, LinkBtn, Pill, Row, Screen, Section, Seg, SegControl, Stack, T, Tabs, Toggle, useFirstLoad } from '../components/ui';
import { CollectionBars, HealthRing, LedgerRow } from '../components/care';
import { Sheet, useConfirm } from '../components/overlays';
import { ClinicQr } from '../components/PetArt';
import { PetAvatar } from '../components/PetArt';
import { HomeHeader, ROLE_LABEL } from './common';
import { DashSkeleton, ScheduleTable, useDueList } from './clinic';
import { Cell, Cols, DataTable, useBP } from '../components/responsive';
import { pickFile } from '../utils/files';
import { useApp, sel } from '../store/AppStore';
import { useNav, useParams } from '../navigation/nav';
import { colors, radius, shadow, type, FONT, DISPLAY } from '../theme';
import type { DayHours, PayAccount, Role, Service } from '../types';
import { APPT, D, DOW, DOWL, MON, ago, billBalance, billState, billTotal, byDateTime, diff, fmtD, fmtDS, hourLabel, isEmail, isPhone, money, parseD, t12 } from '../utils/format';

const paidIn = (db: ReturnType<typeof useApp>['db'], test: (d: string) => boolean) =>
  db.bills.flatMap(b => b.payments).filter(p => p.status === 'confirmed' && test(p.date)).reduce((s2, p) => s2 + p.amount, 0);
const sameMonth = (d: string, ref = D(0)) => d.slice(0, 7) === ref.slice(0, 7);

/** Administrator overview: a quiet control room. Money first, then what needs the owner's eye, then the team. */
export function AdminHome() {
  const nav = useNav(); const { db, user } = useApp(); const due = useDueList();
  const today = db.appts.filter(a => diff(a.date) === 0 && a.status !== 'cancelled').sort(byDateTime);
  const verify = db.bills.filter(b => billState(b) === 'pending');
  const unread = sel.unreadMsgs(db, user!);
  const unpaidBills = db.bills.filter(b => billState(b) === 'unpaid');
  const unpaid = unpaidBills.reduce((s2, b) => s2 + billBalance(b), 0);
  const staffActs = db.activity.filter(a => db.users.some(u => u.name === a.who && u.role === 'staff')).slice(0, 4);
  const staff = db.users.filter(u => u.role === 'staff' && u.status === 'active');
  const loading = useFirstLoad('adminHome'); const { desktop, mobile } = useBP();
  const days = Array.from({ length: 7 }, (_, i) => D(i - 6));
  const week = days.map(d => paidIn(db, x => x === d));
  const todayIn = week[6]; const month = paidIn(db, d => sameMonth(d));
  const avg = week.slice(0, 6).reduce((a, b) => a + b, 0) / 6;
  const trend = avg === 0 ? '' : todayIn >= avg ? `That's above the past week's daily average of ${money(Math.round(avg))}.` : `The past week averaged ${money(Math.round(avg))} a day.`;
  const doneN = today.filter(a => a.status === 'completed').length;
  const d0 = parseD(D(0));

  const header = (
    <View style={[{ gap: 20 }, desktop && { flexDirection: 'row', alignItems: 'flex-end', gap: 32 }]}>
      <View style={{ flex: desktop ? 1 : undefined, minWidth: 0, gap: 10 }}>
        <Text style={ad.date}>{DOWL[d0.getDay()]}, {MON[d0.getMonth()]} {d0.getDate()}</Text>
        <Text style={[ad.headline, mobile && { fontSize: 36, lineHeight: 38, letterSpacing: -1.3 }]} accessibilityRole="header">
          {money(todayIn)} collected today.{'\n'}<Text style={{ color: unpaid ? colors.ink : colors.ink3 }}>{money(unpaid)} still unpaid.</Text>
        </Text>
        <Text style={[type.body, { color: colors.ink2 }]}>{today.length} visits on today's schedule, {doneN} done. {month ? `${money(month)} collected this month.` : ''}</Text>
      </View>
      <Btn label="Open reports" icon="chart" kind="line" onPress={() => nav.navigate('Main', { screen: 'Reports' } as never)} style={mobile ? { alignSelf: 'flex-start' } : undefined} />
    </View>
  );

  const chart = (
    <View style={ad.panel}>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <Text style={ad.h2} accessibilityRole="header">Collections, last 7 days</Text>
        <Text style={type.small}>Confirmed payments only</Text>
      </View>
      <CollectionBars values={week} labels={days.map((d, i) => i === 6 ? 'Today' : DOW[parseD(d).getDay()])} format={v => `₱${(v / 1000).toFixed(1)}k`} height={mobile ? 90 : 110} />
      {!!trend && <Text style={type.small}>{trend}</Text>}
    </View>
  );

  const needs = (
    <View style={{ gap: 4 }}>
      <Text style={ad.h2} accessibilityRole="header">Needs your eye</Text>
      <LedgerRow alert n={verify.length} label={verify.length === 1 ? 'payment waiting for verification' : 'payments waiting for verification'} icon="wallet" onPress={() => nav.navigate('BillingList')} />
      <LedgerRow alert n={due.overdue.length} label={due.overdue.length === 1 ? 'pet overdue for care' : 'pets overdue for care'} icon="bell" onPress={() => nav.navigate('CareMonitor')} />
      <LedgerRow alert n={unread} label={unread === 1 ? 'unread message from an owner' : 'unread messages from owners'} icon="chat" onPress={() => nav.navigate('Inbox')} />
      <LedgerRow n={unpaidBills.length} label={unpaidBills.length === 1 ? 'bill still unpaid' : 'bills still unpaid'} icon="receipt" onPress={() => nav.navigate('BillingList')} />
    </View>
  );

  const team = (
    <View style={{ gap: 4 }}>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <Text style={ad.h2} accessibilityRole="header">The team today</Text>
        <LinkBtn label="Activity log" onPress={() => nav.navigate('ActivityLog')} />
      </View>
      {staff.map(u => {
        const handled = db.appts.filter(a => diff(a.date) === 0 && a.handledBy === u.name).length;
        const checked = db.bills.flatMap(b => b.payments).filter(p => diff(p.date) === 0 && p.verifiedBy === u.name).length;
        return (
          <View key={u.id} style={ad.person}>
            <Avatar name={u.name} size={36} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={type.h3} numberOfLines={1}>{u.name}</Text>
              <Text style={type.small} numberOfLines={1}>{handled} {handled === 1 ? 'visit' : 'visits'} handled, {checked} {checked === 1 ? 'payment' : 'payments'} checked</Text>
            </View>
          </View>
        );
      })}
      {staffActs.length > 0 && <View style={{ marginTop: 12, gap: 10 }}>
        {staffActs.map(a => (
          <View key={a.id} style={{ flexDirection: 'row', gap: 10 }}>
            <View style={ad.tick} />
            <Text style={[type.small, { flex: 1 }]}><Text style={{ color: colors.ink, fontWeight: '500' }}>{a.who.split(' ')[0]}</Text> {a.text.charAt(0).toLowerCase() + a.text.slice(1)}, {ago(a.at)}</Text>
          </View>
        ))}
      </View>}
    </View>
  );

  const schedule = (
    <Section title="Today's schedule" action="Full schedule" onAction={() => nav.navigate('Main', { screen: 'Appointments' } as never)}>
      {today.length === 0 ? <Empty icon="calendar" title="No appointments today" /> : mobile ? (
        <Group>{today.map(a => { const p = sel.pet(db, a.petId)!; return (
          <Row key={a.id} left={<PetAvatar pet={p} size={40} />} title={`${t12(a.time)}  ${p.name}`} sub={`${a.service}${a.handledBy ? `, ${a.handledBy}` : ''}`} right={<Pill text={APPT[a.status][0]} tone={APPT[a.status][1]} />} onPress={() => nav.navigate('ApptDetail', { id: a.id })} />
        ); })}</Group>
      ) : <ScheduleTable list={today} showStaff />}
    </Section>
  );

  if (loading) return <Screen hideHeader tabbed>{mobile && <HomeHeader />}<DashSkeleton /></Screen>;
  return (
    <Screen hideHeader tabbed>
      {mobile && <HomeHeader />}
      {header}
      {desktop ? (
        <Cols ratio={[1.9, 1]} gap={48}>
          <>{chart}{schedule}</>
          <View style={ad.side}>{needs}{team}</View>
        </Cols>
      ) : <>{chart}{needs}{schedule}{team}</>}
    </Screen>
  );
}

/** Consultation D21: daily and monthly collections, due and overdue vaccines (and other follow-ups), unpaid bills. */
export function Reports() {
  const nav = useNav(); const { db } = useApp(); const due = useDueList(); const { mobile } = useBP();
  const [range, setRange] = useState<'daily' | 'monthly'>('daily');
  const daily = range === 'daily';
  const days = Array.from({ length: 7 }, (_, i) => D(i - 6));
  const months = Array.from({ length: 6 }, (_, i) => { const d = parseD(D(0)); d.setDate(1); d.setMonth(d.getMonth() - (5 - i)); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; });
  const bars = daily ? days.map(d => paidIn(db, x => x === d)) : months.map(m => paidIn(db, x => x.slice(0, 7) === m));
  const labels = daily ? days.map((d, i) => i === 6 ? 'Today' : DOW[parseD(d).getDay()]) : months.map((m, i) => i === 5 ? 'This month' : MON[Number(m.slice(5)) - 1]);
  const headline = daily ? paidIn(db, d => diff(d) === 0) : paidIn(db, d => sameMonth(d));
  const inRange = (d: string) => daily ? diff(d) === 0 : sameMonth(d);
  const appts = db.appts.filter(a => inRange(a.date) && diff(a.date) <= 0);
  const unpaidBills = db.bills.filter(b => billState(b) === 'unpaid');
  const staff = db.users.filter(u => u.role === 'staff' && u.status === 'active');
  const vax = [...due.overdue, ...due.soon].filter(x => x.f.kind !== 'Recheck');
  const completed = appts.filter(a => a.status === 'completed').length;
  const lost = appts.filter(a => ['cancelled', 'missed'].includes(a.status)).length;
  return (
    <Screen title="Reports" back={false} big tabbed sub="Collections, visits, due vaccines and unpaid bills.">
      <SegControl options={[['daily', 'Daily'], ['monthly', 'Monthly']]} value={range} onChange={setRange} />
      <View style={ad.panel}>
        <View style={{ gap: 4 }}>
          <Text style={type.small}>{daily ? 'Collected today' : `Collected in ${MON[parseD(D(0)).getMonth()]}`}</Text>
          <Text style={[ad.big, mobile && { fontSize: 40, lineHeight: 42 }]}>{money(headline)}</Text>
        </View>
        <CollectionBars values={bars} labels={labels} format={v => `₱${(v / 1000).toFixed(1)}k`} height={mobile ? 100 : 140} />
        <Text style={type.small}>{daily ? 'Last 7 days' : 'Last 6 months'}, confirmed payments only.</Text>
      </View>
      <Cols ratio={[1, 1]} stackBelow="desktop" gap={40}>
        <View style={{ gap: 4 }}>
          <Text style={ad.h2} accessibilityRole="header">{daily ? 'Today' : 'This month'} in numbers</Text>
          <LedgerRow n={completed} label={completed === 1 ? 'visit completed' : 'visits completed'} tone={colors.ok} />
          <LedgerRow n={lost} label="cancelled or missed" />
          <LedgerRow alert n={vax.length} label="vaccines and deworming due or overdue" icon="syringe" onPress={() => nav.navigate('CareMonitor')} />
          <LedgerRow n={money(unpaidBills.reduce((s2, b) => s2 + billBalance(b), 0))} label={`unpaid in ${unpaidBills.length} bill${unpaidBills.length === 1 ? '' : 's'}`} icon="receipt" onPress={() => nav.navigate('BillingList')} />
        </View>
        <View style={{ gap: 4 }}>
          <Text style={ad.h2} accessibilityRole="header">Staff oversight</Text>
          {staff.map(u => {
            const handled = db.appts.filter(a => inRange(a.date) && a.handledBy === u.name).length;
            const verified = db.bills.flatMap(b => b.payments).filter(p => inRange(p.date) && p.verifiedBy === u.name).length;
            return (
              <View key={u.id} style={ad.person}>
                <Avatar name={u.name} size={36} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={type.h3}>{u.name}</Text>
                  <Text style={type.small}>{handled} appointments handled, {verified} payments recorded or checked</Text>
                </View>
              </View>
            );
          })}
        </View>
      </Cols>
      <Cols ratio={[1, 1]} stackBelow="desktop" gap={40}>
        <Section title="Vaccines and deworming due" action="All follow-ups" onAction={() => nav.navigate('CareMonitor')}>
          {vax.length === 0 ? <T.Small>Nothing due in the next 7 days.</T.Small> : <Group>{vax.map(({ f, pet, s: st }) => <Row key={f.id} left={<HealthRing pet={pet} health={st.key === 'overdue' ? 'overdue' : 'soon'} size={40} ring={2.5} />} title={`${pet.name}, ${f.reason}`} sub={`${sel.owner(db, pet.ownerId)!.name}, due ${fmtD(f.date)}`} right={<Pill text={st.label} tone={st.tone} />} onPress={() => nav.navigate('PetDetail', { id: pet.id, tab: 'follow' })} />)}</Group>}
        </Section>
        <Section title="Unpaid bills" action="Billing" onAction={() => nav.navigate('BillingList')}>
          {unpaidBills.length === 0 ? <T.Small>No unpaid bills.</T.Small> : <Group>{unpaidBills.map(b => <Row key={b.id} left={<PetAvatar pet={sel.pet(db, b.petId)!} size={40} />} title={`${sel.pet(db, b.petId)!.name}, ${sel.owner(db, b.ownerId)!.name}`} sub={`${fmtD(b.date)}, total ${money(billTotal(b))}`} right={<Text style={[type.h3, { color: colors.bad, fontVariant: ['tabular-nums'] }]}>{money(billBalance(b))}</Text>} onPress={() => nav.navigate('BillDetail', { id: b.id })} />)}</Group>}
        </Section>
      </Cols>
    </Screen>
  );
}

export function Setup() {
  const nav = useNav(); const { user, db, act } = useApp(); const confirm = useConfirm();
  const unread = (db.notifs[act.inboxKey()] || []).filter(n => n.unread).length;
  const go = (s: string) => () => nav.navigate(s);
  return (
    <Screen title="Setup" back={false} big tabbed sub="Accounts, clinic details, services, hours, reminders and payment accounts.">
      <Cols ratio={[1, 1]} stackBelow="desktop"><>
      <Group><Row left={<Avatar name={user!.name} />} title={user!.name} sub={`${ROLE_LABEL[user!.role]} · ${user!.email}`} onPress={go('Profile')} /></Group>
      <Section title="Accounts">
        <Group>
          <Row icon="users" title="Users and staff" sub={`${db.users.filter(u => u.role !== 'owner').length} clinic accounts · ${db.users.filter(u => u.role === 'owner').length} owners`} onPress={go('Users')} />
          <Row icon="history" title="Activity log" sub="Who created or changed what" onPress={go('ActivityLog')} />
        </Group>
      </Section>
      <Section title="Clinic">
        <Group>
          <Row icon="building" title="Clinic profile" sub="Name, address, map location, contact" onPress={go('ClinicProfile')} />
          <Row icon="tag" title="Services and prices" sub={`${db.services.filter(s => s.active).length} active services`} onPress={go('Services')} />
          <Row icon="clock" title="Clinic hours and time slots" sub={`${db.settings.slotMinutes}-minute slots · cancel up to ${db.settings.cancelCutoffHours} h before`} onPress={go('Hours')} />
          <Row icon="bell" title="Reminder settings" sub="Timing and channels (phone alert, SMS, email)" onPress={go('Reminders')} />
          <Row icon="qr" title="Payment accounts" sub={`${db.clinic.accounts.filter(a => a.on).map(a => a.provider).join(', ')} · updated ${fmtD(db.clinic.payUpdated)}`} onPress={go('PaymentSetup')} />
        </Group>
      </Section>
      </><>
      <Section title="Clinic work">
        <Group>
          <Row icon="chat" title="Messages" sub={sel.unreadMsgs(db, user!) ? `${sel.unreadMsgs(db, user!)} unread` : 'All read'} onPress={go('Inbox')} />
          <Row icon="wallet" title="Billing and payment verification" onPress={go('BillingList')} />
          <Row icon="bell" title="Due and overdue follow-ups" onPress={go('CareMonitor')} />
          <Row icon="info" title="Notifications" sub={unread ? `${unread} unread` : 'All read'} onPress={go('Notifications')} />
        </Group>
      </Section>
      <Group><Row icon="logout" title="Log out" onPress={() => confirm({ title: 'Log out?', ok: 'Log out', icon: 'logout', onOk: act.logout })} /></Group>
      </></Cols>
    </Screen>
  );
}

export function Users() {
  const nav = useNav(); const { db } = useApp();
  const [tab, setTab] = useState<'clinic' | 'owner'>('clinic'); const [q, setQ] = useState('');
  const list = db.users.filter(u => (tab === 'owner' ? u.role === 'owner' : u.role !== 'owner') && (!q || u.name.toLowerCase().includes(q.toLowerCase()) || u.phone.replace(/\s/g, '').includes(q.replace(/\D/g, '') || '¤')));
  const { wide } = useBP();
  return (
    <Screen title="Users and staff" wide sub="Clinic accounts and pet owner accounts." right={tab === 'clinic' ? <Btn label={wide ? 'Add account' : 'Add'} icon="plus" small={!wide} onPress={() => nav.navigate('UserForm', { role: 'staff' })} /> : undefined}>
      <View style={wide ? { flexDirection: 'row', alignItems: 'flex-end', gap: 20 } : { gap: 16 }}>
        <View style={wide ? { width: 360 } : undefined}><Tabs options={[['clinic', 'Clinic accounts'], ['owner', 'Pet owners']]} value={tab} onChange={setTab} /></View>
        <Field icon="search" placeholder="Search name or mobile" value={q} onChangeText={setQ} style={wide ? { flex: 1, maxWidth: 420, marginLeft: 'auto' } : undefined} />
      </View>
      {wide ? <DataTable rows={list} keyOf={u => u.id} onRowPress={u => nav.navigate('UserForm', { id: u.id })} rowLabel={u => u.name}
          columns={[
            { key: 'n', label: 'Name', flex: 2, render: u => <Cell left={<Avatar name={u.name} size={34} />} title={u.name} sub={u.email} /> },
            { key: 'r', label: 'Role', flex: 1, render: u => ROLE_LABEL[u.role] },
            { key: 'm', label: 'Mobile', flex: 1.2, render: u => u.phone },
            { key: 'l', label: 'Last active', flex: 1, wideOnly: true, render: u => u.lastActive ? fmtD(u.lastActive) : '—' },
            { key: 's', label: 'Status', width: 110, render: u => <Pill text={u.status === 'active' ? 'Active' : 'Inactive'} tone={u.status === 'active' ? 'ok' : ''} /> },
          ]} />
      : <Group>{list.map(u => (
        <Row key={u.id} left={<Avatar name={u.name} />} title={u.name} sub={`${ROLE_LABEL[u.role]} · ${u.phone}`} right={<Pill text={u.status === 'active' ? 'Active' : 'Inactive'} tone={u.status === 'active' ? 'ok' : ''} />} onPress={() => nav.navigate('UserForm', { id: u.id })} />
      ))}</Group>}
      {tab === 'owner' && <T.Small>Pet owners create their own accounts in the app. You can deactivate or reset them here.</T.Small>}
    </Screen>
  );
}

export function UserForm() {
  const nav = useNav(); const confirm = useConfirm(); const { db, act, user: me } = useApp(); const p = useParams<{ id: string; role: Role }>();
  const u = p.id ? db.users.find(x => x.id === p.id) : undefined;
  const [f, setF] = useState({ name: u?.name || '', role: (u?.role || (p.role === 'owner' ? 'staff' : p.role) || 'staff') as Role, email: u?.email || '', phone: u?.phone || '' });
  const [err, setErr] = useState<Record<string, string>>({});
  const save = () => {
    const e: Record<string, string> = {};
    if (!f.name.trim()) e.name = 'Enter the name';
    if (!isPhone(f.phone)) e.phone = 'Use a PH mobile number';
    else if (db.users.some(x => x.id !== u?.id && x.phone.replace(/\s/g, '') === f.phone.replace(/\s/g, ''))) e.phone = 'This number already has an account';
    if (!isEmail(f.email)) e.email = 'Enter a valid email (used to log in)';
    if (Object.keys(e).length) return setErr(e);
    act.saveUser({ id: u?.id, ...f }); nav.goBack();
  };
  const self = u?.id === me!.id;
  return (
    <Screen title={u ? 'Edit account' : 'New account'} footer={<Btn label={u ? 'Save changes' : 'Create account'} style={{ flex: 1 }} onPress={save} />}>
      {u && <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}><Avatar name={u.name} size={52} /><View style={{ flex: 1 }}><T.H2>{u.name}</T.H2><T.Small>Last active {u.lastActive ? fmtD(u.lastActive) : 'never'}</T.Small></View><Pill text={u.status === 'active' ? 'Active' : 'Inactive'} tone={u.status === 'active' ? 'ok' : ''} /></View>}
      {(!u || u.role !== 'owner') ? <Seg label="Role" options={[['staff', 'Staff'], ['admin', 'Administrator']]} value={f.role} onChange={v => setF({ ...f, role: v })} /> : <Banner icon="paw" title="Pet owner account" sub="Created by the owner in the app." />}
      <Field label="Full name" value={f.name} onChangeText={v => { setF({ ...f, name: v }); setErr({ ...err, name: '' }); }} error={err.name} />
       <Field label="Mobile number" keyboardType="phone-pad" value={f.phone} onChangeText={v => { setF({ ...f, phone: v }); setErr({ ...err, phone: '' }); }} error={err.phone} hint="Used for code login." />
      <Field label="Email" autoCapitalize="none" keyboardType="email-address" value={f.email} onChangeText={v => { setF({ ...f, email: v }); setErr({ ...err, email: '' }); }} error={err.email} />
      {!u && <T.Small>The new user gets a temporary password and is asked to change it on first login.</T.Small>}
      {u && !self && <Group>
        <Row icon="key" title="Reset password" sub="Sets a temporary password" onPress={() => confirm({ title: `Reset ${u.name}'s password?`, ok: 'Reset', icon: 'key', onOk: () => act.resetUserPassword(u.id) })} />
        <Row icon={u.status === 'active' ? 'lock' : 'check'} title={u.status === 'active' ? 'Deactivate account' : 'Reactivate account'} sub={u.status === 'active' ? 'Access stops at once. Records they made stay.' : 'Allow this user to sign in again'}
          onPress={() => confirm({ title: u.status === 'active' ? `Deactivate ${u.name}?` : `Reactivate ${u.name}?`, body: u.status === 'active' ? 'They will no longer be able to sign in. Their records stay on file.' : undefined, ok: u.status === 'active' ? 'Deactivate' : 'Reactivate', tone: u.status === 'active' ? 'bad' : 'ok', icon: 'users', onOk: () => { act.setUserStatus(u.id, u.status === 'active' ? 'inactive' : 'active'); nav.goBack(); } })} />
      </Group>}
    </Screen>
  );
}

export function ClinicProfile() {
  const nav = useNav(); const { db, act } = useApp(); const c = db.clinic;
  const [f, setF] = useState({ name: c.name, address: c.address, phone: c.phone, mobile: c.mobile, email: c.email, about: c.about, lat: String(c.lat), lng: String(c.lng) });
  const [err, setErr] = useState<Record<string, string>>({});
  const set = (k: keyof typeof f, v: string) => { setF({ ...f, [k]: v }); setErr({ ...err, [k]: '' }); };
  const save = () => {
    const e: Record<string, string> = {};
    if (!f.name.trim()) e.name = 'Enter the clinic name'; if (!f.address.trim()) e.address = 'Enter the address';
    if (!isPhone(f.mobile)) e.mobile = 'Use a PH mobile number'; if (f.email && !isEmail(f.email)) e.email = 'Enter a valid email';
    if (isNaN(Number(f.lat)) || isNaN(Number(f.lng))) e.lat = 'Enter numbers, e.g. 10.3157 and 123.8854';
    if (Object.keys(e).length) return setErr(e);
    act.saveClinic({ ...f, lat: Number(f.lat), lng: Number(f.lng) }); nav.goBack();
  };
  return (
    <Screen title="Clinic profile" footer={<Btn label="Save profile" style={{ flex: 1 }} onPress={save} />}>
      <Field label="Clinic name" value={f.name} onChangeText={v => set('name', v)} error={err.name} />
      <Field label="Address" multiline value={f.address} onChangeText={v => set('address', v)} error={err.address} />
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Field style={{ flex: 1 }} label="Map latitude" keyboardType="decimal-pad" value={f.lat} onChangeText={v => set('lat', v)} error={err.lat} />
        <Field style={{ flex: 1 }} label="Map longitude" keyboardType="decimal-pad" value={f.lng} onChangeText={v => set('lng', v)} />
      </View>
      <T.Small>Owners see this location on the clinic information screen.</T.Small>
      <Field label="Landline" keyboardType="phone-pad" value={f.phone} onChangeText={v => set('phone', v)} />
      <Field label="Mobile (used for the Call clinic button)" keyboardType="phone-pad" value={f.mobile} onChangeText={v => set('mobile', v)} error={err.mobile} />
      <Field label="Email" autoCapitalize="none" value={f.email} onChangeText={v => set('email', v)} error={err.email} />
      <Field label="About the clinic" multiline value={f.about} onChangeText={v => set('about', v)} />
      <Btn label="Preview what owners see" kind="line" onPress={() => nav.navigate('ClinicInfo')} />
    </Screen>
  );
}

export function Services() {
  const { db, act } = useApp();
  const [edit, setEdit] = useState<Partial<Service> | null>(null); const [err, setErr] = useState<Record<string, string>>({});
  const cats = ['Consultation', 'Preventive care', 'Procedures'];
  const save = () => {
    const e: Record<string, string> = {};
    if (!edit!.name?.trim()) e.name = 'Enter the service name'; if (!(Number(edit!.price) > 0)) e.price = 'Enter the price';
    if (!(Number(edit!.minutes) > 0)) e.minutes = 'Enter the time needed';
    if (Object.keys(e).length) return setErr(e);
    act.saveService({ ...edit!, name: edit!.name!.trim(), price: Number(edit!.price), minutes: Number(edit!.minutes) }); setEdit(null);
  };
  return (
    <Screen title="Services and prices" right={<Btn label="Add" icon="plus" small onPress={() => { setErr({}); setEdit({ category: 'Consultation', minutes: 30, active: true }); }} />}>
      <T.Small>Used for booking and for building bills. Turn a service off to hide it from booking.</T.Small>
      {cats.map(c => (
        <Section key={c} title={c}>
          <Group>{db.services.filter(s => s.category === c).map(s => (
            <Row key={s.id} title={s.name} sub={`${money(s.price)} · ${s.minutes} min${s.active ? '' : ' · Hidden'}`} onPress={() => { setErr({}); setEdit({ ...s }); }}
              right={<Toggle label={`${s.name} active`} value={s.active} onChange={() => act.saveService({ ...s, active: !s.active })} />} />
          ))}</Group>
        </Section>
      ))}
      <Sheet visible={!!edit} onClose={() => setEdit(null)} title={edit?.id ? 'Edit service' : 'New service'} footer={<Btn label="Save service" style={{ flex: 1 }} onPress={save} />}>
        {edit && <>
          <Field label="Service name" value={edit.name || ''} onChangeText={v => setEdit({ ...edit, name: v })} error={err.name} />
          <Seg label="Category" wrap options={cats.map(c => [c, c] as [string, string])} value={edit.category} onChange={v => setEdit({ ...edit, category: v })} />
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Field style={{ flex: 1 }} label="Price (₱)" keyboardType="decimal-pad" value={edit.price != null ? String(edit.price) : ''} onChangeText={v => setEdit({ ...edit, price: v as never })} error={err.price} />
            <Field style={{ flex: 1 }} label="Minutes" keyboardType="number-pad" value={edit.minutes != null ? String(edit.minutes) : ''} onChangeText={v => setEdit({ ...edit, minutes: v as never })} error={err.minutes} />
          </View>
        </>}
      </Sheet>
    </Screen>
  );
}

export function Hours() {
  const nav = useNav(); const { db, act } = useApp();
  const [days, setDays] = useState<Record<number, DayHours>>(() => JSON.parse(JSON.stringify(db.settings.days)));
  const [slot, setSlot] = useState(String(db.settings.slotMinutes)); const [cutoff, setCutoff] = useState(String(db.settings.cancelCutoffHours));
  const bump = (d: number, k: 'from' | 'to', n: number) => { const h = { ...days[d] }; h[k] = Math.min(22, Math.max(6, h[k] + n)); if (h.from >= h.to) return; setDays({ ...days, [d]: h }); };
  const stepper = (d: number, k: 'from' | 'to') => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <Pressable accessibilityLabel={`Earlier ${k}`} hitSlop={6} onPress={() => bump(d, k, -1)} style={hs.step}><Icon name="chevL" size={16} /></Pressable>
      <Text style={[type.h3, { minWidth: 58, textAlign: 'center', fontSize: 13.5 }]}>{hourLabel(days[d][k])}</Text>
      <Pressable accessibilityLabel={`Later ${k}`} hitSlop={6} onPress={() => bump(d, k, 1)} style={hs.step}><Icon name="chevR" size={16} /></Pressable>
    </View>
  );
  return (
    <Screen title="Hours and time slots" footer={<Btn label="Save" style={{ flex: 1 }} onPress={() => { act.saveHours(days, Number(slot), Number(cutoff)); nav.goBack(); }} />}>
      <Seg label="Appointment slot length" options={[['15', '15 min'], ['20', '20 min'], ['30', '30 min'], ['60', '1 hour']]} value={slot} onChange={setSlot} />
      <Seg label="Owners can cancel or move a booking up to" options={[['2', '2 hours'], ['12', '12 hours'], ['24', '24 hours']]} value={cutoff} onChange={setCutoff} />
      <T.Small>The client chose 24 hours. Bookings are confirmed automatically when the slot is free.</T.Small>
      <Section title="Opening hours">
        <Stack gap={10}>
          {[1, 2, 3, 4, 5, 6, 0].map(d => (
            <Card key={d} style={{ padding: 12, gap: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={[type.h3, { flex: 1 }]}>{DOWL[d]}</Text>
                <T.Small>{days[d].open ? 'Open' : 'Closed'}</T.Small><View style={{ width: 10 }} />
                <Toggle label={`${DOWL[d]} open`} value={days[d].open} onChange={() => setDays({ ...days, [d]: { ...days[d], open: !days[d].open } })} />
              </View>
              {days[d].open && <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 4 }}>{stepper(d, 'from')}<T.Small>to</T.Small>{stepper(d, 'to')}</View>}
            </Card>
          ))}
        </Stack>
      </Section>
      <T.Small>Lunch break {hourLabel(db.settings.lunch[0])} – {hourLabel(db.settings.lunch[1])} is blocked on weekdays and Saturday.</T.Small>
    </Screen>
  );
}

const TIMING: Record<string, string[]> = {
  r1: ['1 day before', '2 hours before'], r2: ['1 week before', '3 days before', 'On the due date', 'When overdue'], r3: ['Immediately'], r4: ['Immediately'],
};
export function Reminders() {
  const { db, act } = useApp(); const [edit, setEdit] = useState<string | null>(null); const [pick, setPick] = useState<string[]>([]);
  const r = db.settings.reminders.find(x => x.id === edit); const ch = db.settings.channels;
  return (
    <Screen title="Reminder settings">
      <Section title="Send reminders by">
        <Group>
          {([['push', 'Phone alerts', 'Free. Needs the app installed.', 'phoneapp'], ['sms', 'SMS', 'Each message has a cost.', 'chat'], ['email', 'Email', 'Needs an email service.', 'mail']] as const).map(([k, l, d, i]) => (
            <Row key={k} icon={i} title={l} sub={d} right={<Toggle label={l} value={ch[k]} onChange={() => act.toggleChannel(k)} />} />
          ))}
        </Group>
        <T.Small>Every reminder is also kept in the owner's in-app notification list. Owners can turn channels off for themselves.</T.Small>
      </Section>
      <Section title="Reminders">
        <Group>{db.settings.reminders.map(x => (
          <Row key={x.id} title={x.name} sub={`${x.desc}\n${x.when.join(' and ')}`} subLines={2} onPress={TIMING[x.id].length > 1 ? () => { setPick(x.when); setEdit(x.id); } : undefined} right={<Toggle label={x.name} value={x.on} onChange={() => act.toggleReminder(x.id)} />} />
        ))}</Group>
        <T.Small>Tap a reminder to change when it is sent.</T.Small>
      </Section>
      <Sheet visible={!!r} onClose={() => setEdit(null)} title={r?.name || ''} footer={<Btn label="Save timing" style={{ flex: 1 }} disabled={!pick.length} onPress={() => { act.setReminderTiming(r!.id, pick); setEdit(null); }} />}>
        <T.Small>Choose one or more.</T.Small>
        {r && TIMING[r.id].map(o => <Check key={o} label={o} value={pick.includes(o)} onChange={() => setPick(pick.includes(o) ? pick.filter(x => x !== o) : [...pick, o])} />)}
      </Sheet>
    </Screen>
  );
}

/** Consultation D12/D13: GCash QR, another e-wallet QR, and bank transfer, on the clinic's business accounts. Administrator only. */
export function PaymentSetup() {
  const { db, act } = useApp(); const [edit, setEdit] = useState<PayAccount | null>(null); const [err, setErr] = useState<Record<string, string>>({});
  const save = () => {
    const e: Record<string, string> = {}; if (!edit!.accountName.trim()) e.accountName = 'Enter the account name'; if (edit!.number.replace(/\D/g, '').length < 8) e.number = 'Enter the account or mobile number';
    if (Object.keys(e).length) return setErr(e);
    act.saveAccount(edit!); setEdit(null);
  };
  return (
    <Screen title="Payment accounts">
      <Banner tone="warn" icon="shield" title="Only the administrator can change these" sub="Owners pay to these accounts. Double-check them so the wrong QR or number is never shown." />
      <Group>{db.clinic.accounts.map(a => (
        <Row key={a.id} icon={a.kind === 'Bank transfer' ? 'bank' : 'qr'} title={`${a.provider} · ${a.kind === 'Bank transfer' ? 'Bank transfer' : 'QR'}`} sub={`${a.accountName}\n${a.number}`} subLines={2}
          onPress={() => { setErr({}); setEdit({ ...a }); }} right={<Toggle label={`${a.provider} on`} value={a.on} onChange={() => act.saveAccount({ ...a, on: !a.on })} />} />
      ))}</Group>
      <T.Small>Payments are checked by the administrator or staff against these accounts. Turn an account off to hide it from owners.</T.Small>
      <Sheet visible={!!edit} onClose={() => setEdit(null)} title={edit ? `Edit ${edit.provider}` : ''} footer={<Btn label="Save account" style={{ flex: 1 }} onPress={save} />}>
        {edit && <>
          {edit.kind !== 'Bank transfer' && <Card style={{ alignItems: 'center', gap: 10, shadowOpacity: 0 }}>
            <View style={{ padding: 10, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line }}><ClinicQr acc={edit} size={140} /></View>
            <Btn label={edit.qrUri ? 'Replace QR image' : 'Upload QR image'} icon="upload" small kind="soft" onPress={async () => {
              const r = await pickFile({ imagesOnly: true });
              if (typeof r === 'string') setErr({ ...err, qr: r }); else if (r?.uri) { setEdit({ ...edit, qrUri: r.uri }); setErr({ ...err, qr: '' }); }
            }} />
            {err.qr ? <T.Small color={colors.bad}>{err.qr}</T.Small> : <T.Small>{`Download the QR from your ${edit.provider} business account and upload it here (JPEG or PNG). Owners see it when they pay.`}</T.Small>}
          </Card>}
          <Field label={edit.kind === 'Bank transfer' ? 'Bank' : 'E-wallet'} value={edit.provider} onChangeText={v => setEdit({ ...edit, provider: v })} />
          <Field label="Account name" value={edit.accountName} onChangeText={v => setEdit({ ...edit, accountName: v })} error={err.accountName} />
          <Field label="Account or mobile number" keyboardType="phone-pad" value={edit.number} onChangeText={v => setEdit({ ...edit, number: v })} error={err.number} />
        </>}
      </Sheet>
    </Screen>
  );
}

export function ActivityLog() {
  const { db } = useApp(); const [who, setWho] = useState('all');
  const people = useMemo(() => Array.from(new Set(db.activity.map(a => a.who))), [db.activity.length]); // eslint-disable-line react-hooks/exhaustive-deps
  const list = db.activity.filter(a => who === 'all' || a.who === who);
  return (
    <Screen title="Activity log">
      <Chips options={[['all', 'Everyone'], ...people.map(p => [p, p] as [string, string])]} value={who} onChange={setWho} />
      {list.length === 0 ? <Empty icon="history" title="No activity yet" /> : <Group>{list.map(a => <Row key={a.id} left={<Avatar name={a.who} size={38} />} title={a.text} sub={`${a.who} · ${ago(a.at)}`} subLines={2} />)}</Group>}
    </Screen>
  );
}

const hs = StyleSheet.create({ step: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' } });

const ad = StyleSheet.create({
  date:     { fontFamily: FONT, fontSize: 15, fontWeight: '500', color: colors.accent },
  headline: { fontFamily: DISPLAY, fontSize: 52, lineHeight: 54, fontWeight: '600', color: colors.ink, letterSpacing: -2, fontVariant: ['tabular-nums'] },
  big:      { fontFamily: DISPLAY, fontSize: 56, lineHeight: 58, fontWeight: '600', color: colors.ink, letterSpacing: -2, fontVariant: ['tabular-nums'] },
  h2:       { fontFamily: DISPLAY, fontSize: 21, lineHeight: 26, fontWeight: '600', color: colors.ink, letterSpacing: -0.4, marginBottom: 4 },
  panel:    { gap: 16, paddingVertical: 20, borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.line },
  side:     { gap: 36, paddingLeft: 32, borderLeftWidth: 1, borderLeftColor: colors.line },
  person:   { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56, borderBottomWidth: 1, borderBottomColor: colors.line },
  tick:     { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.blue, marginTop: 7 },
});
