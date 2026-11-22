// Pet Owner pages: home, pets, appointments, bills and clinic information.
// One responsive layout per page: tablets and desktops get grids and tables, phones get stacked lists.
import { useState } from 'react';
import { Image, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Btn, Card, CountBadge, Empty, Group, Hint, IconTile, Pill, Row, Screen, Section, SegControl, Skeleton, Stack, T, useFirstLoad } from '../components/ui';
import { BrandTile } from '../components/Brand';
import { Icon, IconName } from '../components/Icon';
import { PetAvatar } from '../components/PetArt';
import { AutoGrid, Cell, Cols, DataTable, PState, useBP } from '../components/responsive';
import { useApp, sel } from '../store/AppStore';
import { useNav } from '../navigation/nav';
import { callClinic, openDirections } from './ownerHome';
import { careNodes, HEALTH_COLOR, petHealth, RingGlyph } from '../components/care';
import { PET_PHOTOS, SCENES } from '../data/photos';
import { colors, radius, shadow, space, type, Tone, FONT, DISPLAY } from '../theme';
import type { Clinic, DB, Pet } from '../types';
import {
  APPT, BILL, ageOf, billBalance, billState, billTotal, byDateTime, D, DOWL, firstName, fmtD, fmtDS, followStatus, greeting, hourLabel, isUpcoming, money, MON, parseD, rel, t12, TODAY,
} from '../utils/format';

/* ---------- shared bits ---------- */
export const SexMark = ({ sex, size = 16 }: { sex: 'Male' | 'Female'; size?: number }) =>
  <View accessible accessibilityLabel={sex}><Icon name={sex === 'Male' ? 'male' : 'female'} size={size} color={sex === 'Male' ? '#3D6CA8' : '#C2577C'} strokeWidth={2.6} /></View>;

/** The most urgent thing about a pet, as a status line. */
function petStatus(db: DB, p: Pet): { label: string; tone: Tone } {
  if (p.status !== 'active') return { label: p.status === 'deceased' ? 'Deceased' : 'Inactive', tone: '' };
  const open = db.followups.filter(f => f.petId === p.id && f.status === 'open').sort((x, y) => x.date.localeCompare(y.date)).map(followStatus);
  const w = open.find(x => x.key === 'overdue') || open.find(x => x.key === 'soon');
  return w ? { label: w.label, tone: w.tone } : { label: 'Up to date', tone: 'ok' };
}

const useTab = () => { const nav = useNav(); return (screen: string) => nav.navigate('Main', { screen } as never); };

/** Calendar-page style date: month above, day below. */
function DateTile({ date, size = 'md' }: { date: string; size?: 'sm' | 'md' }) {
  const d = parseD(date); const sm = size === 'sm';
  return (
    <View style={[o.dateTile, sm && { width: 46, height: 50, borderRadius: 10 }]} accessible accessibilityLabel={fmtD(date)}>
      <Text style={o.dateMon}>{MON[d.getMonth()]}</Text>
      <Text style={[o.dateDay, sm && { fontSize: 18, lineHeight: 22 }]}>{d.getDate()}</Text>
    </View>
  );
}

function PetPhoto({ pet, h }: { pet: Pet; h: number }) {
  const src = PET_PHOTOS[pet.id];
  return src
    ? <Image source={src} style={{ width: '100%', height: h, backgroundColor: colors.subtle }} resizeMode="cover" accessibilityLabel={`Photo of ${pet.name}`} />
    : <View style={{ width: '100%', height: h, backgroundColor: colors.subtle, alignItems: 'center', justifyContent: 'center' }}><Icon name="paw" size={32} color={colors.accent} /></View>;
}

function PetCard({ pet, compact }: { pet: Pet; compact?: boolean }) {
  const nav = useNav(); const { db } = useApp(); const h = petHealth(db, pet);
  const next = careNodes(db, pet.id, { past: 0, future: 1 }).find(n => n.state === 'next');
  return (
    <Pressable onPress={() => nav.navigate('PetDetail', { id: pet.id })} accessibilityRole="button" accessibilityLabel={`${pet.name}, ${h.label}`}
      style={(s: PState) => [o.petCard, compact && { width: 160 }, s.hovered && { borderColor: colors.lineStrong }, s.pressed && { opacity: 0.9 }]}>
      <View style={pet.status !== 'active' ? { opacity: 0.5 } : undefined}>
        <PetPhoto pet={pet} h={compact ? 116 : 200} />
      </View>
      <View style={{ padding: compact ? 12 : 16, gap: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={[o.petName, compact && { fontSize: 17 }]} numberOfLines={1}>{pet.name}</Text>
          <SexMark sex={pet.sex} size={13} />
        </View>
        <Text style={[type.small, { fontSize: compact ? 12 : 13 }]} numberOfLines={1}>{pet.breed}, {ageOf(pet.birth)}</Text>
        {!compact && <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}>
          <RingGlyph health={h.key} size={13} />
          <Text style={{ fontFamily: FONT, fontSize: 13, fontWeight: '600', color: HEALTH_COLOR[h.key], flexShrink: 1 }} numberOfLines={1}>{h.label}</Text>
        </View>}
        {!compact && next && <Text style={[type.small, { fontSize: 12.5 }]} numberOfLines={1}>Next: {next.label}, {fmtD(next.date)}</Text>}
      </View>
    </Pressable>
  );
}

function AddPetCard({ onPress, compact }: { onPress: () => void; compact?: boolean }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel="Add a pet"
      style={(s: PState) => [o.addCard, compact ? { width: 120 } : { flex: 1, minHeight: 240 }, s.hovered && { borderColor: colors.accent, backgroundColor: colors.surface }]}>
      <IconTile name="plus" size={compact ? 40 : 44} />
      <Text style={[type.h3, { color: colors.teal, fontSize: 14 }]}>Add a pet</Text>
      {!compact && <Text style={[type.small, { textAlign: 'center' }]}>Dogs and cats</Text>}
    </Pressable>
  );
}

/* ---------- home: see ownerHome.tsx ---------- */
export { OwnerHome } from './ownerHome';

/* ---------- pets ---------- */
export function OwnerPets() {
  const nav = useNav(); const { db, user } = useApp(); const { wide } = useBP();
  const all = sel.petsOf(db, user!.ownerId!);
  const active = all.filter(p => p.status === 'active'), past = all.filter(p => p.status !== 'active');
  const add = () => nav.navigate('PetForm', { ownerId: user!.ownerId });
  const row = (p: Pet) => { const st = petStatus(db, p); return (
    <Pressable key={p.id} onPress={() => nav.navigate('PetDetail', { id: p.id })} accessibilityRole="button" accessibilityLabel={`${p.name}, ${st.label}`}
      style={(s: PState) => [o.petRow, { backgroundColor: s.pressed ? colors.subtle : colors.surface }]}>
      <View style={p.status !== 'active' ? { opacity: 0.6 } : undefined}><PetAvatar pet={p} size={60} square /></View>
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}><Text style={type.h2} numberOfLines={1}>{p.name}</Text><SexMark sex={p.sex} size={14} /></View>
        <T.Small numberOfLines={1}>{p.breed} · {ageOf(p.birth)}</T.Small>
        <View style={{ marginTop: 4 }}><Pill text={st.label} tone={st.tone} /></View>
      </View>
      <Icon name="chevR" size={18} color={colors.ink3} />
    </Pressable>
  ); };
  return (
    <Screen title="My pets" back={false} big tabbed sub="Profiles, health records, reminders and files for each pet."
      right={<Btn label={wide ? 'Add a pet' : 'Add'} icon="plus" small={!wide} kind={wide ? 'primary' : 'line'} onPress={add} />}>
      {active.length === 0
        ? <Card><Empty icon="paw" title="No pets yet" sub="Add your first pet to book visits and keep their records in one place." action={<Btn label="Add a pet" icon="plus" small onPress={add} />} /></Card>
        : wide ? <AutoGrid min={230}>{[...active.map(p => <PetCard key={p.id} pet={p} />), <AddPetCard key="add" onPress={add} />]}</AutoGrid>
        : <Group>{active.map(row)}</Group>}
      {past.length > 0 && (
        <Section title="Inactive or deceased" sub="Records stay on file. These pets are hidden from booking and reminders.">
          {wide ? <AutoGrid min={230}>{past.map(p => <PetCard key={p.id} pet={p} />)}</AutoGrid> : <Group>{past.map(row)}</Group>}
        </Section>
      )}
    </Screen>
  );
}

/* ---------- appointments ---------- */
export function OwnerAppts() {
  const nav = useNav(); const { db, user } = useApp(); const { wide } = useBP();
  const [tab, setTab] = useState<'up' | 'past'>('up');
  const mine = db.appts.filter(a => a.ownerId === user!.ownerId);
  const up = mine.filter(isUpcoming).sort(byDateTime), past = mine.filter(a => !isUpcoming(a)).sort(byDateTime).reverse();
  const list = tab === 'up' ? up : past;
  return (
    <Screen title="Appointments" back={false} big tabbed sub="Your upcoming and past clinic visits."
      right={<Btn label={wide ? 'Book a visit' : 'Book'} icon="plus" small={!wide} onPress={() => nav.navigate('Book')} />}>
      <SegControl options={[['up', 'Upcoming', up.length], ['past', 'Past']]} value={tab} onChange={setTab} />
      {list.length === 0 ? (
        <Card><Empty icon="calendar" title={tab === 'up' ? 'No upcoming visits' : 'No past visits'} sub={tab === 'up' ? 'Open times are confirmed right away.' : 'Completed and cancelled visits appear here.'}
          action={tab === 'up' ? <Btn label="Book a visit" icon="plus" small onPress={() => nav.navigate('Book')} /> : undefined} /></Card>
      ) : wide ? (
        <DataTable rows={list} keyOf={a => a.id} onRowPress={a => nav.navigate('ApptDetail', { id: a.id })} rowLabel={a => `${a.service} on ${fmtD(a.date)}`}
          columns={[
            { key: 'd', label: 'Date', flex: 1.5, render: a => <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}><DateTile date={a.date} size="sm" /><Cell title={fmtD(a.date)} sub={`${t12(a.time)} · ${rel(a.date)}`} /></View> },
            { key: 's', label: 'Service', flex: 1.6, render: a => a.service },
            { key: 'p', label: 'Pet', flex: 1.2, render: a => { const p = sel.pet(db, a.petId)!; return <Cell left={<PetAvatar pet={p} size={32} />} title={p.name} />; } },
            { key: 'st', label: 'Status', width: 160, render: a => <Pill text={APPT[a.status][0]} tone={APPT[a.status][1]} badge /> },
          ]} />
      ) : (
        <Group>
          {list.map(a => { const p = sel.pet(db, a.petId)!; return (
            <Pressable key={a.id} onPress={() => nav.navigate('ApptDetail', { id: a.id })} accessibilityRole="button" accessibilityLabel={`${a.service} for ${p.name} on ${fmtD(a.date)}`}
              style={({ pressed }) => [o.visit, pressed && { backgroundColor: colors.subtle }]}>
              <DateTile date={a.date} size="sm" />
              <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                <Text style={type.h3} numberOfLines={1}>{a.service}</Text>
                <T.Small numberOfLines={1}>{p.name} · {t12(a.time)}</T.Small>
                <View style={{ marginTop: 3 }}><Pill text={APPT[a.status][0]} tone={APPT[a.status][1]} badge /></View>
              </View>
              <PetAvatar pet={p} size={40} />
            </Pressable>
          ); })}
        </Group>
      )}
      {tab === 'up' && <Hint icon="clock">You can cancel or change a visit up to {db.settings.cancelCutoffHours} hours before it starts. After that, please call or message the clinic.</Hint>}
    </Screen>
  );
}

/* ---------- bills ---------- */
export function OwnerBills() {
  const nav = useNav(); const { db, user } = useApp(); const { wide } = useBP();
  const bills = db.bills.filter(b => b.ownerId === user!.ownerId).sort((a, b) => b.date.localeCompare(a.date));
  const unpaid = bills.filter(b => billState(b) === 'unpaid'), pending = bills.filter(b => billState(b) === 'pending');
  const paid = bills.filter(b => billState(b) === 'paid').slice(0, 20);
  const open = [...unpaid, ...pending];
  const sum = (list: typeof bills, f: (b: typeof bills[0]) => number) => list.reduce((s, b) => s + f(b), 0);
  const due = sum(unpaid, billBalance), checking = sum(pending, billBalance), paidTotal = sum(bills.filter(b => billState(b) === 'paid'), billTotal);
  const pet = (b: typeof bills[0]) => sel.pet(db, b.petId)!;

  return (
    <Screen title="Bills" back={false} big tabbed sub="Bills from your visits, payments and receipts.">
      <View style={{ borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface }}>
        <View style={{ backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.line, padding: wide ? 20 : 18, flexDirection: wide ? 'row' : 'column', gap: wide ? 32 : 4, alignItems: wide ? 'center' : 'flex-start' }}>
          <View style={{ flex: wide ? 1 : undefined, gap: 2 }}>
            <Text style={{ fontFamily: FONT, fontSize: 11.5, fontWeight: '600', color: colors.ink2 }}>Balance due</Text>
            <Text style={{ fontFamily: DISPLAY, fontSize: 40, fontWeight: '600', color: colors.ink, letterSpacing: -1 }}>{money(due)}</Text>
          </View>
          <View style={wide ? { flexDirection: 'row', gap: 32, paddingLeft: 32, borderLeftWidth: 1, borderLeftColor: colors.line } : { flexDirection: 'row', gap: 32, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.line, width: '100%' }}>
            <View style={{ gap: 1 }}><Text style={{ fontFamily: FONT, fontSize: 11, color: colors.ink2 }}>Being checked</Text><Text style={{ fontFamily: FONT, fontSize: 15, fontWeight: '700', color: colors.ink }}>{money(checking)}</Text></View>
            <View style={{ gap: 1 }}><Text style={{ fontFamily: FONT, fontSize: 11, color: colors.ink2 }}>Paid so far</Text><Text style={{ fontFamily: FONT, fontSize: 15, fontWeight: '700', color: colors.ink }}>{money(paidTotal)}</Text></View>
          </View>
        </View>
        <View style={{ backgroundColor: colors.surface, paddingHorizontal: 18, paddingVertical: 12 }}>
          <Text style={[type.small, { fontSize: 12.5 }]}>Pay by GCash, e-wallet, bank transfer, or cash at the clinic.</Text>
        </View>
      </View>

      <Section title="To pay">
        {open.length ? (
          <Group>
            {open.map(b => { const st = billState(b); return (
              <Row key={b.id} left={<PetAvatar pet={pet(b)} size={40} />} title={money(billBalance(b))} sub={`${pet(b).name} · visit on ${fmtD(b.date)}`}
                right={st === 'unpaid' ? undefined : <Pill text={BILL[st][0]} tone={BILL[st][1]} badge />}
                action={st === 'unpaid' ? <Btn label="Pay now" small onPress={() => nav.navigate('PayBill', { id: b.id })} /> : undefined}
                onPress={() => nav.navigate('BillDetail', { id: b.id })} />
            ); })}
          </Group>
        ) : <Card><Empty icon="check" title="Nothing to pay" sub="New bills appear here after a visit." /></Card>}
      </Section>

      {paid.length > 0 && (
        <Section title="Payment history">
          {wide ? (
            <DataTable rows={paid} keyOf={b => b.id} onRowPress={b => nav.navigate('BillDetail', { id: b.id })} rowLabel={b => `Bill for ${pet(b).name} on ${fmtD(b.date)}`}
              columns={[
                { key: 'd', label: 'Visit date', flex: 1.2, render: b => fmtD(b.date) },
                { key: 'p', label: 'Pet', flex: 1.4, render: b => <Cell left={<PetAvatar pet={pet(b)} size={32} />} title={pet(b).name} /> },
                { key: 'a', label: 'Amount', flex: 1, align: 'right', render: b => <Text style={[type.h3, { fontSize: 14 }]}>{money(billTotal(b))}</Text> },
                { key: 's', label: 'Status', width: 120, render: b => <Pill text={BILL[billState(b)][0]} tone={BILL[billState(b)][1]} badge /> },
              ]} />
          ) : (
            <Group>{paid.map(b => <Row key={b.id} left={<PetAvatar pet={pet(b)} size={40} />} title={money(billTotal(b))} sub={`${pet(b).name} · ${fmtD(b.date)}`} right={<Pill text="Paid" tone="ok" />} onPress={() => nav.navigate('BillDetail', { id: b.id })} />)}</Group>
          )}
        </Section>
      )}
      <Hint icon="shield">Bills are paid in full. E-wallet and bank payments are confirmed after the clinic checks its own account, then a receipt is issued.</Hint>
    </Screen>
  );
}

/* ---------- clinic ---------- */
/** Clinic location, hours and contact. */
export function ClinicInfo() {
  const { db, user } = useApp(); const nav = useNav(); const { desktop, wide } = useBP();
  const c = db.clinic; const todayDow = TODAY.getDay(); const h = db.settings.days[todayDow];
  const owner = user!.role === 'owner';
  const hero = (
    <Card style={{ padding: 0, overflow: 'hidden' }}>
      <Image source={SCENES.clinic} style={[o.clinicImg, desktop && { height: 240 }]} resizeMode="cover" accessibilityLabel="Clinic examination room" />
      <View style={{ padding: wide ? 20 : 16, gap: 14 }}>
        <View style={{ gap: 4 }}>
          <T.H1>{c.name}</T.H1>
          <T.Small>{c.address}</T.Small>
        </View>
        <Pill chip text={h.open ? `Open today · ${hourLabel(h.from)} – ${hourLabel(h.to)}` : 'Closed today'} tone={h.open ? 'ok' : ''} />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Btn label="Directions" icon="nav" small style={{ flex: 1 }} onPress={() => openDirections(c)} />
          <Btn label="Call" icon="phone" kind="line" small style={{ flex: 1 }} onPress={() => callClinic(c.mobile)} />
          {owner && <Btn label="Message" icon="chat" kind="line" small style={{ flex: 1 }} onPress={() => nav.navigate('Main', { screen: 'Messages' } as never)} />}
        </View>
      </View>
    </Card>
  );
  const hours = (
    <Section title="Opening hours">
      <Group>
        {[1, 2, 3, 4, 5, 6, 0].map(d => { const x = db.settings.days[d]; const on = d === todayDow; return (
          <Row key={d} title={on ? `${DOWL[d]} (today)` : DOWL[d]} right={<Text style={[type.body, { fontSize: 14, fontWeight: on ? '600' : '400', color: x.open ? colors.ink : colors.ink3 }]}>{x.open ? `${hourLabel(x.from)} – ${hourLabel(x.to)}` : 'Closed'}</Text>} />
        ); })}
      </Group>
    </Section>
  );
  const contact = (
    <Section title="Contact">
      <Group>
        <Row icon="phone" title={c.mobile} sub="Mobile" onPress={() => callClinic(c.mobile)} />
        <Row icon="phone" title={c.phone} sub="Landline" onPress={() => Linking.openURL(`tel:${c.phone.replace(/\D/g, '')}`)} />
        <Row icon="mail" title={c.email} sub="Email" onPress={() => Linking.openURL(`mailto:${c.email}`)} />
      </Group>
    </Section>
  );
  const services = (
    <Section title="Services and prices" sub="Prices are a guide. The final bill depends on the care given.">
      <Group>{db.services.filter(s => s.active).map(s => <Row key={s.id} title={s.name} sub={`About ${s.minutes} min`} right={<Text style={[type.h3, { fontSize: 14 }]}>{money(s.price)}</Text>} />)}</Group>
    </Section>
  );
  return (
    <Screen title="Clinic information" wide={desktop} sub="Location, opening hours, contact details and services.">
      {desktop ? <Cols ratio={[3, 2]} gap={32}><>{hero}{services}</><>{hours}{contact}</></Cols> : <>{hero}{hours}{contact}{services}</>}
    </Screen>
  );
}

const o = StyleSheet.create({
  // Date tile
  dateTile: { width: 54, height: 58, borderRadius: 8, backgroundColor: colors.accentDeep, alignItems: 'center', justifyContent: 'center' },
  dateMon: { fontFamily: FONT, fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.75)' },
  dateDay: { fontFamily: FONT, fontSize: 22, lineHeight: 26, fontWeight: '700', color: '#fff' },

  // Pet cards
  petCard: { backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.line, overflow: 'hidden' },
  addCard: { alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16, borderRadius: radius.lg, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.lineStrong, backgroundColor: 'transparent' },
  petName: { fontFamily: DISPLAY, fontSize: 21, lineHeight: 25, fontWeight: '600', color: colors.ink, letterSpacing: -0.4, flexShrink: 1 },
  petRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, paddingHorizontal: 16 },
  visit: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12, paddingHorizontal: 16 },
  balance: { fontFamily: FONT, fontSize: 30, lineHeight: 36, fontWeight: '700', color: colors.ink, letterSpacing: -0.8 },
  clinicImg: { width: '100%', height: 190, backgroundColor: colors.subtle },
});
