// Pet Owner tabs: home, pets, visits, more, plus bills and clinic information.
import { useState } from 'react';
import { Image, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Avatar, Banner, Btn, Card, Divider, Empty, Group, Pill, QuickActions, Row, Screen, Section, Skeleton, Stack, T, Tabs, useFirstLoad } from '../components/ui';
import { useConfirm } from '../components/overlays';
import { BrandMark } from '../components/Brand';
import { Icon } from '../components/Icon';
import { PetAvatar } from '../components/PetArt';
import { HomeHeader } from './common';
import { Cell, Cols, DataTable, useBP } from '../components/responsive';
import { useApp, sel } from '../store/AppStore';
import { useNav } from '../navigation/nav';
import { PET_PHOTOS, SCENES } from '../data/photos';
import { colors, radius, shadow, space, type } from '../theme';
import {
  APPT, BILL, ageOf, billBalance, billState, billTotal, byDateTime, DOWL, fmtD, fmtDS, fmtDY, followStatus, hourLabel, parseD, isUpcoming, money, rel, t12, TODAY,
} from '../utils/format';

function HomeSkeleton() {
  return (
    <Stack gap={22}>
      <View style={{ flexDirection: 'row', gap: 12 }}>{[0, 1].map(i => <Skeleton key={i} h={164} w={150} r={radius.xl} />)}</View>
      <Skeleton h={74} r={radius.xl} />
      <Skeleton h={150} r={radius.xl} />
      <Skeleton h={68} r={radius.xl} />
    </Stack>
  );
}

export const SexMark = ({ sex, size = 16 }: { sex: 'Male' | 'Female'; size?: number }) =>
  <View accessible accessibilityLabel={sex}><Icon name={sex === 'Male' ? 'male' : 'female'} size={size} color={sex === 'Male' ? '#3D6CA8' : '#C2577C'} strokeWidth={2.6} /></View>;

export function OwnerHome() {
  const nav = useNav(); const { db, user } = useApp(); const loading = useFirstLoad('ownerHome');
  const oid = user!.ownerId!;
  const pets = sel.petsOf(db, oid).filter(p => p.status === 'active');
  const upcoming = db.appts.filter(a => a.ownerId === oid && isUpcoming(a)).sort(byDateTime);
  const offer = upcoming.find(a => a.status === 'resched');
  const follows = sel.openFollowUps(db).filter(f => pets.some(p => p.id === f.petId) && ['overdue', 'soon'].includes(followStatus(f).key));
  const unpaid = db.bills.filter(b => b.ownerId === oid && billState(b) === 'unpaid');
  const unread = sel.unreadMsgs(db, user!); const { wide } = useBP();
  return (
    <Screen hideHeader tabbed>
      <HomeHeader owner sub="Your pets are in good hands." action={<Btn label="Book a visit" icon="calendar" onPress={() => nav.navigate('Book')} />} />
      {loading ? <HomeSkeleton /> : <>
        {offer && <Banner tone="info" icon="calendar" title="The clinic suggested a new time" sub={`${sel.pet(db, offer.petId)!.name}: ${fmtD(offer.offer!.date)} at ${t12(offer.offer!.time)}`} action={<Btn label="Review" small kind="line" onPress={() => nav.navigate('ApptDetail', { id: offer.id })} />} />}

        {wide ? (
          <Cols ratio={[3, 2]} stackBelow="desktop">
            <>
        <Pressable onPress={() => nav.navigate('Book')} accessibilityRole="button" accessibilityLabel="Book an appointment" style={({ pressed }) => [o.hero, pressed && { opacity: 0.94 }]}>
          <View style={o.heroBlob} />
          <Image source={SCENES.heroDog} style={o.heroDog} resizeMode="contain" />
          <View style={{ gap: 12, maxWidth: '58%' }}>
            <View style={o.heroBadge}><BrandMark size={17} /></View>
            <Text style={o.heroTitle}>Healthy pets.{'\n'}Happier you.</Text>
            <View style={o.heroBtn}><Text style={o.heroBtnText}>Book a visit</Text><Icon name="chevR" size={15} color="#fff" /></View>
          </View>
        </Pressable>

        <Section title="Your Pets" action="See all" onAction={() => nav.navigate('Main', { screen: 'Pets' } as never)}>
          <ScrollView horizontal={!wide} scrollEnabled={!wide} showsHorizontalScrollIndicator={false} style={!wide ? { marginHorizontal: -space.lg, flexGrow: 0 } : undefined} contentContainerStyle={wide ? { flexDirection: 'row', flexWrap: 'wrap', gap: 16 } : { paddingHorizontal: space.lg, paddingBottom: 4, gap: 12 }}>
            {pets.map(p => (
              <Pressable key={p.id} onPress={() => nav.navigate('PetDetail', { id: p.id })} accessibilityRole="button" accessibilityLabel={p.name} style={({ pressed }) => [o.petCard, pressed && { opacity: 0.85 }]}>
                {PET_PHOTOS[p.id] ? <Image source={PET_PHOTOS[p.id]} style={o.petImg} resizeMode="cover" /> : <View style={[o.petImg, { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.subtle }]}><Icon name="paw" size={30} color={colors.accent} /></View>}
                <View style={{ paddingHorizontal: 4, paddingTop: 8, gap: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}><Text style={[type.h3, { fontWeight: '700', flexShrink: 1 }]} numberOfLines={1}>{p.name}</Text><SexMark sex={p.sex} /></View>
                  <Text style={[type.small, { fontSize: 11.5 }]} numberOfLines={1}>{ageOf(p.birth)} · {p.breed}</Text>
                </View>
              </Pressable>
            ))}
            <Pressable onPress={() => nav.navigate('PetForm', { ownerId: oid })} accessibilityRole="button" accessibilityLabel="Add pet" style={({ pressed }) => [o.addCard, pressed && { opacity: 0.7 }]}>
              <View style={o.addCircle}><Icon name="plus" size={20} color={colors.accentDeep} /></View>
              <Text style={[type.small, { color: colors.accentDeep, fontWeight: '600' }]}>Add a pet</Text>
            </Pressable>
          </ScrollView>
        </Section>

            </>
            <>
        <Section title="Upcoming Appointment" action={upcoming.length ? 'See all' : undefined} onAction={() => nav.navigate('Main', { screen: 'Appointments' } as never)}>
          {upcoming[0] ? (() => { const a = upcoming[0]; const p = sel.pet(db, a.petId)!; return (
            <Pressable onPress={() => nav.navigate('ApptDetail', { id: a.id })} accessibilityRole="button" style={({ pressed }) => [o.appt, pressed && { backgroundColor: colors.accentSoft }]}>
              <View style={o.apptIcon}><Icon name="calendar" size={22} color={colors.accentDeep} /></View>
              <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                <Text style={[type.h3, { fontWeight: '700' }]} numberOfLines={1}>{fmtDY(a.date)} · {t12(a.time)}</Text>
                <Text style={type.small} numberOfLines={1}>{a.service} · {p.name}</Text>
              </View>
              <Icon name="chevR" size={20} color={colors.ink} />
            </Pressable>
          ); })() : (
            <View style={o.appt}>
              <View style={o.apptIcon}><Icon name="calendar" size={22} color={colors.accentDeep} /></View>
              <View style={{ flex: 1 }}><Text style={[type.h3, { fontWeight: '700' }]}>No upcoming visits</Text><T.Small>Open times are confirmed right away.</T.Small></View>
            </View>
          )}
        </Section>

        {(follows.length > 0 || unpaid.length > 0) && (
          <Section title="Reminders">
            <Group>
              {follows.slice(0, 3).map(f => { const p = sel.pet(db, f.petId)!; const st = followStatus(f); return (
                <Row key={f.id} left={<PetAvatar pet={p} size={38} />} title={f.reason} sub={`${p.name} · ${st.key === 'overdue' ? 'was due' : 'due'} ${fmtDS(f.date)}`} right={<Pill text={st.label} tone={st.tone} />} onPress={() => nav.navigate('PetDetail', { id: p.id, tab: 'follow' })} />
              ); })}
              {unpaid.map(b => <Row key={b.id} icon="receipt" title={`Bill ${money(billBalance(b))}`} sub={`${sel.pet(db, b.petId)!.name} · tap to pay`} right={<Pill text="Unpaid" tone="bad" />} onPress={() => nav.navigate('BillDetail', { id: b.id })} />)}
            </Group>
          </Section>
        )}
            </>
          </Cols>
        ) : <>
        <Pressable onPress={() => nav.navigate('Book')} accessibilityRole="button" accessibilityLabel="Book an appointment" style={({ pressed }) => [o.hero, pressed && { opacity: 0.94 }]}>
          <View style={o.heroBlob} />
          <Image source={SCENES.heroDog} style={o.heroDog} resizeMode="contain" />
          <View style={{ gap: 12, maxWidth: '58%' }}>
            <View style={o.heroBadge}><BrandMark size={17} /></View>
            <Text style={o.heroTitle}>Healthy pets.{'\n'}Happier you.</Text>
            <View style={o.heroBtn}><Text style={o.heroBtnText}>Book a visit</Text><Icon name="chevR" size={15} color="#fff" /></View>
          </View>
        </Pressable>

        <Section title="Your Pets" action="See all" onAction={() => nav.navigate('Main', { screen: 'Pets' } as never)}>
          <ScrollView horizontal={!wide} scrollEnabled={!wide} showsHorizontalScrollIndicator={false} style={!wide ? { marginHorizontal: -space.lg, flexGrow: 0 } : undefined} contentContainerStyle={wide ? { flexDirection: 'row', flexWrap: 'wrap', gap: 16 } : { paddingHorizontal: space.lg, paddingBottom: 4, gap: 12 }}>
            {pets.map(p => (
              <Pressable key={p.id} onPress={() => nav.navigate('PetDetail', { id: p.id })} accessibilityRole="button" accessibilityLabel={p.name} style={({ pressed }) => [o.petCard, pressed && { opacity: 0.85 }]}>
                {PET_PHOTOS[p.id] ? <Image source={PET_PHOTOS[p.id]} style={o.petImg} resizeMode="cover" /> : <View style={[o.petImg, { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.subtle }]}><Icon name="paw" size={30} color={colors.accent} /></View>}
                <View style={{ paddingHorizontal: 4, paddingTop: 8, gap: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}><Text style={[type.h3, { fontWeight: '700', flexShrink: 1 }]} numberOfLines={1}>{p.name}</Text><SexMark sex={p.sex} /></View>
                  <Text style={[type.small, { fontSize: 11.5 }]} numberOfLines={1}>{ageOf(p.birth)} · {p.breed}</Text>
                </View>
              </Pressable>
            ))}
            <Pressable onPress={() => nav.navigate('PetForm', { ownerId: oid })} accessibilityRole="button" accessibilityLabel="Add pet" style={({ pressed }) => [o.addCard, pressed && { opacity: 0.7 }]}>
              <View style={o.addCircle}><Icon name="plus" size={20} color={colors.accentDeep} /></View>
              <Text style={[type.small, { color: colors.accentDeep, fontWeight: '600' }]}>Add a pet</Text>
            </Pressable>
          </ScrollView>
        </Section>

        <Section title="Upcoming Appointment" action={upcoming.length ? 'See all' : undefined} onAction={() => nav.navigate('Main', { screen: 'Appointments' } as never)}>
          {upcoming[0] ? (() => { const a = upcoming[0]; const p = sel.pet(db, a.petId)!; return (
            <Pressable onPress={() => nav.navigate('ApptDetail', { id: a.id })} accessibilityRole="button" style={({ pressed }) => [o.appt, pressed && { backgroundColor: colors.accentSoft }]}>
              <View style={o.apptIcon}><Icon name="calendar" size={22} color={colors.accentDeep} /></View>
              <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                <Text style={[type.h3, { fontWeight: '700' }]} numberOfLines={1}>{fmtDY(a.date)} · {t12(a.time)}</Text>
                <Text style={type.small} numberOfLines={1}>{a.service} · {p.name}</Text>
              </View>
              <Icon name="chevR" size={20} color={colors.ink} />
            </Pressable>
          ); })() : (
            <View style={o.appt}>
              <View style={o.apptIcon}><Icon name="calendar" size={22} color={colors.accentDeep} /></View>
              <View style={{ flex: 1 }}><Text style={[type.h3, { fontWeight: '700' }]}>No upcoming visits</Text><T.Small>Open times are confirmed right away.</T.Small></View>
            </View>
          )}
        </Section>

        <Section title="Quick Actions">
          <QuickActions items={[
            ['Book Visit', 'calendar', () => nav.navigate('Book')],
            ['Pet Records', 'file', () => nav.navigate('Main', { screen: 'Pets' } as never)],
            ['Messages', 'chat', () => nav.navigate('Main', { screen: 'Messages' } as never), unread],
            ['Clinic Info', 'pin', () => nav.navigate('ClinicInfo')],
          ]} />
        </Section>

        {(follows.length > 0 || unpaid.length > 0) && (
          <Section title="Reminders">
            <Group>
              {follows.slice(0, 3).map(f => { const p = sel.pet(db, f.petId)!; const st = followStatus(f); return (
                <Row key={f.id} left={<PetAvatar pet={p} size={38} />} title={f.reason} sub={`${p.name} · ${st.key === 'overdue' ? 'was due' : 'due'} ${fmtDS(f.date)}`} right={<Pill text={st.label} tone={st.tone} />} onPress={() => nav.navigate('PetDetail', { id: p.id, tab: 'follow' })} />
              ); })}
              {unpaid.map(b => <Row key={b.id} icon="receipt" title={`Bill ${money(billBalance(b))}`} sub={`${sel.pet(db, b.petId)!.name} · tap to pay`} right={<Pill text="Unpaid" tone="bad" />} onPress={() => nav.navigate('BillDetail', { id: b.id })} />)}
            </Group>
          </Section>
        )}
        </>}
      </>}
    </Screen>
  );
}

export function OwnerPets() {
  const nav = useNav(); const { db, user } = useApp();
  const all = sel.petsOf(db, user!.ownerId!);
  const active = all.filter(p => p.status === 'active'), past = all.filter(p => p.status !== 'active');
  const row = (p: typeof all[0]) => {
    const open = db.followups.filter(f => f.petId === p.id && f.status === 'open').sort((x, y) => x.date.localeCompare(y.date)).map(followStatus);
    const worst = open.find(x => x.key === 'overdue') || open.find(x => x.key === 'soon');
    return (
      <Pressable key={p.id} onPress={() => nav.navigate('PetDetail', { id: p.id })} accessibilityRole="button" style={({ pressed }) => [o.petRow, pressed && { backgroundColor: colors.subtle }]}>
        <PetAvatar pet={p} size={72} square />
        <View style={{ flex: 1, gap: 3 }}>
          <Text style={type.h2}>{p.name}</Text>
          <T.Small>{p.breed} · {p.sex} · {ageOf(p.birth)}</T.Small>
          <View style={{ marginTop: 4 }}>{p.status !== 'active' ? <Pill text={p.status === 'deceased' ? 'Deceased' : 'Inactive'} /> : worst ? <Pill text={worst.label} tone={worst.tone} /> : <Pill text="Nothing due" tone="ok" />}</View>
        </View>
        <Icon name="chevR" size={18} color={colors.ink3} />
      </Pressable>
    );
  };
  const { wide } = useBP();
  const card = (p: typeof all[0]) => (
    <Pressable key={p.id} onPress={() => nav.navigate('PetDetail', { id: p.id })} accessibilityRole="button" accessibilityLabel={p.name}
      style={(st: { pressed: boolean; hovered?: boolean }) => [o.gridCard, st.hovered && { borderColor: colors.lineStrong }, st.pressed && { opacity: 0.9 }]}>
      {PET_PHOTOS[p.id] ? <Image source={PET_PHOTOS[p.id]} style={o.gridImg} resizeMode="cover" /> : <View style={[o.gridImg, { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.subtle }]}><Icon name="paw" size={34} color={colors.accent} /></View>}
      <View style={{ padding: 14, gap: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}><Text style={type.h2}>{p.name}</Text><SexMark sex={p.sex} /></View>
        <T.Small numberOfLines={1}>{p.breed} · {ageOf(p.birth)}</T.Small>
        <View style={{ marginTop: 4 }}>{p.status !== 'active' ? <Pill text={p.status === 'deceased' ? 'Deceased' : 'Inactive'} /> : (() => { const open = db.followups.filter(f => f.petId === p.id && f.status === 'open').map(followStatus); const w = open.find(x => x.key === 'overdue') || open.find(x => x.key === 'soon'); return w ? <Pill text={w.label} tone={w.tone} /> : <Pill text="Nothing due" tone="ok" />; })()}</View>
      </View>
    </Pressable>
  );
  if (wide) return (
    <Screen title="My pets" back={false} big tabbed sub="Profiles, medical history, reminders and files for each pet." right={<Btn label="Add a pet" icon="plus" onPress={() => nav.navigate('PetForm', { ownerId: user!.ownerId })} />}>
      {active.length === 0 ? <Empty icon="paw" title="No pets yet" sub="Add your first pet to book visits and see records." /> : <View style={o.grid}>{active.map(card)}</View>}
      {past.length > 0 && <Section title="Inactive or deceased"><View style={o.grid}>{past.map(card)}</View></Section>}
    </Screen>
  );
  return (
    <Screen title="Pets" back={false} big tabbed right={<Btn label="Add pet" icon="plus" small kind="line" onPress={() => nav.navigate('PetForm', { ownerId: user!.ownerId })} />}>
      {active.length === 0 ? <Empty icon="paw" title="No pets yet" sub="Add your first pet to book visits and see records." action={<Btn label="Add a pet" small onPress={() => nav.navigate('PetForm', { ownerId: user!.ownerId })} />} /> : <Group>{active.map(row)}</Group>}
      {past.length > 0 && <Section title="Inactive or deceased"><Group>{past.map(row)}</Group></Section>}
    </Screen>
  );
}

export function OwnerAppts() {
  const nav = useNav(); const { db, user } = useApp();
  const [tab, setTab] = useState<'up' | 'past'>('up');
  const mine = db.appts.filter(a => a.ownerId === user!.ownerId);
  const up = mine.filter(isUpcoming).sort(byDateTime), past = mine.filter(a => !isUpcoming(a)).sort(byDateTime).reverse();
  const list = tab === 'up' ? up : past; const { wide } = useBP();
  return (
    <Screen title={wide ? 'Appointments' : 'Visits'} back={false} big tabbed sub="Your upcoming and past clinic visits." right={<Btn label={wide ? 'Book a visit' : 'Book'} icon="plus" small={!wide} onPress={() => nav.navigate('Book')} />}>
      <View style={wide ? { width: 360 } : undefined}><Tabs options={[['up', 'Upcoming'], ['past', 'Past']]} value={tab} onChange={setTab} /></View>
      {wide && list.length > 0 ? <DataTable rows={list} keyOf={a => a.id} onRowPress={a => nav.navigate('ApptDetail', { id: a.id })} rowLabel={a => `${a.service} on ${fmtD(a.date)}`}
          columns={[
            { key: 'd', label: 'Date', flex: 1.4, render: a => <Cell title={fmtDS(a.date)} sub={t12(a.time)} /> },
            { key: 's', label: 'Service', flex: 2, render: a => a.service },
            { key: 'p', label: 'Pet', flex: 1.5, render: a => { const p = sel.pet(db, a.petId)!; return <Cell left={<PetAvatar pet={p} size={34} />} title={p.name} />; } },
            { key: 'st', label: 'Status', width: 140, render: a => <Pill text={APPT[a.status][0]} tone={APPT[a.status][1]} /> },
          ]} />
      : list.length === 0 ? <Empty icon="calendar" title={tab === 'up' ? 'No upcoming visits' : 'No past visits'} sub={tab === 'up' ? 'Open times are confirmed right away.' : undefined} action={tab === 'up' ? <Btn label="Book an appointment" small onPress={() => nav.navigate('Book')} /> : undefined} /> : (
        <Group>
          {list.map(a => { const p = sel.pet(db, a.petId)!; const d = parseD(a.date); return (
            <Pressable key={a.id} onPress={() => nav.navigate('ApptDetail', { id: a.id })} accessibilityRole="button" style={({ pressed }) => [o.visit, pressed && { backgroundColor: colors.subtle }]}>
              <View style={o.dateBox}><Text style={o.dateMon}>{fmtDS(a.date).split(' ')[0]}</Text><Text style={o.dateDay}>{d.getDate()}</Text></View>
              <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                <Text style={type.h3} numberOfLines={1}>{a.service}</Text>
                <T.Small numberOfLines={1}>{p.name} · {t12(a.time)}</T.Small>
                <View style={{ marginTop: 3 }}><Pill text={APPT[a.status][0]} tone={APPT[a.status][1]} /></View>
              </View>
              <PetAvatar pet={p} size={40} />
            </Pressable>
          ); })}
        </Group>
      )}
      {tab === 'up' && <T.Small>You can cancel or change the time up to {db.settings.cancelCutoffHours} hours before a visit.</T.Small>}
    </Screen>
  );
}

export function OwnerBills() {
  const nav = useNav(); const { db, user } = useApp();
  const bills = db.bills.filter(b => b.ownerId === user!.ownerId).sort((a, b) => b.date.localeCompare(a.date));
  const due = bills.reduce((s, b) => s + billBalance(b), 0);
  const open = bills.filter(b => billState(b) !== 'paid'), paid = bills.filter(b => billState(b) === 'paid').slice(0, 20);
  const row = (b: typeof bills[0]) => { const st = billState(b); return (
    <Row key={b.id} left={<PetAvatar pet={sel.pet(db, b.petId)!} size={40} />} title={money(billTotal(b))} sub={`${sel.pet(db, b.petId)!.name} · ${fmtD(b.date)}`} right={<Pill text={BILL[st][0]} tone={BILL[st][1]} />} onPress={() => nav.navigate('BillDetail', { id: b.id })} />
  ); };
  return (
    <Screen title="Bills and receipts">
      <View style={o.balance}>
        <Text style={[type.small, { color: 'rgba(255,255,255,0.7)' }]}>Balance due</Text>
        <Text style={{ color: '#fff', fontSize: 30, fontWeight: '700', letterSpacing: -0.8, marginTop: 2 }}>{money(due)}</Text>
        <Text style={[type.small, { color: 'rgba(255,255,255,0.7)', marginTop: 6 }]}>Pay in full by GCash, another e-wallet, bank transfer, or cash at the clinic.</Text>
      </View>
      <Section title="To pay">{open.length ? <Group>{open.map(row)}</Group> : <Empty icon="check" title="Nothing to pay" sub="New bills appear here after a visit." />}</Section>
      {paid.length > 0 && <Section title="Paid"><Group>{paid.map(row)}</Group></Section>}
    </Screen>
  );
}

export function OwnerMore() {
  const nav = useNav(); const { db, user, act } = useApp(); const confirm = useConfirm();
  const unpaid = db.bills.filter(b => b.ownerId === user!.ownerId && billState(b) === 'unpaid');
  const unread = (db.notifs[act.inboxKey()] || []).filter(n => n.unread).length;
  return (
    <Screen title="More" back={false} big tabbed>
      <Pressable onPress={() => nav.navigate('Profile')} accessibilityRole="button" style={({ pressed }) => [{ flexDirection: 'row', alignItems: 'center', gap: 14 }, pressed && { opacity: 0.7 }]}>
        <Avatar name={user!.name} size={56} />
        <View style={{ flex: 1 }}><T.H2>{user!.name}</T.H2><T.Small>View profile and settings</T.Small></View>
        <Icon name="chevR" size={18} color={colors.ink3} />
      </Pressable>
      <Group>
        <Row icon="receipt" title="Bills and receipts" sub={unpaid.length ? `${unpaid.length} to pay · ${money(unpaid.reduce((s2, b) => s2 + billBalance(b), 0))}` : 'All paid'} onPress={() => nav.navigate('OwnerBills')} />
        <Row icon="bell" title="Notifications" sub={unread ? `${unread} unread` : 'All read'} onPress={() => nav.navigate('Notifications')} />
        <Row icon="pin" title="Clinic location and hours" sub={db.clinic.address} onPress={() => nav.navigate('ClinicInfo')} />
        <Row icon="phone" title="Call the clinic" sub={db.clinic.mobile} onPress={() => Linking.openURL(`tel:${db.clinic.mobile.replace(/\s/g, '')}`)} />
      </Group>
      <Group>
        <Row icon="gear" title="Profile and settings" onPress={() => nav.navigate('Profile')} />
        <Row icon="logout" title="Log out" danger chevron={false} onPress={() => confirm({ title: 'Log out?', ok: 'Log out', icon: 'logout', onOk: act.logout })} />
      </Group>
    </Screen>
  );
}

/** Clinic location, hours and contact. */
export function ClinicInfo() {
  const { db } = useApp(); const c = db.clinic; const todayDow = TODAY.getDay();
  const directions = () => {
    const q = encodeURIComponent(`${c.name}, ${c.address}`);
    Linking.openURL(Platform.OS === 'android' ? `geo:${c.lat},${c.lng}?q=${c.lat},${c.lng}(${encodeURIComponent(c.name)})` : `https://www.google.com/maps/search/?api=1&query=${q}`);
  };
  const h = db.settings.days[todayDow];
  return (
    <Screen title="Clinic">
      <Image source={SCENES.clinic} style={o.clinicImg} resizeMode="cover" accessibilityLabel="Clinic examination room" />
      <View style={{ gap: 4 }}>
        <T.H1>{c.name}</T.H1>
        <T.Small>{c.address}</T.Small>
        <View style={{ marginTop: 4 }}><Pill text={h.open ? `Open today ${hourLabel(h.from)} – ${hourLabel(h.to)}` : 'Closed today'} tone={h.open ? 'ok' : ''} /></View>
      </View>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Btn label="Directions" icon="nav" style={{ flex: 1 }} onPress={directions} />
        <Btn label="Call" icon="phone" kind="line" style={{ flex: 1 }} onPress={() => Linking.openURL(`tel:${c.mobile.replace(/\s/g, '')}`)} />
      </View>
      <Section title="Opening hours">
        <Group>
          {[1, 2, 3, 4, 5, 6, 0].map(d => { const x = db.settings.days[d]; const on = d === todayDow; return (
            <Row key={d} title={on ? `${DOWL[d]} (today)` : DOWL[d]} right={<Text style={[type.body, { fontSize: 14, fontWeight: on ? '600' : '400', color: x.open ? colors.ink : colors.ink3 }]}>{x.open ? `${hourLabel(x.from)} – ${hourLabel(x.to)}` : 'Closed'}</Text>} />
          ); })}
        </Group>
      </Section>
      <Section title="Contact">
        <Group>
          <Row icon="phone" title={c.mobile} sub="Mobile" onPress={() => Linking.openURL(`tel:${c.mobile.replace(/\s/g, '')}`)} />
          <Row icon="phone" title={c.phone} sub="Landline" onPress={() => Linking.openURL(`tel:${c.phone.replace(/\D/g, '')}`)} />
          <Row icon="mail" title={c.email} sub="Email" onPress={() => Linking.openURL(`mailto:${c.email}`)} />
        </Group>
      </Section>
      <Section title="Services and prices">
        <Group>{db.services.filter(s => s.active).map(s => <Row key={s.id} title={s.name} sub={`About ${s.minutes} min`} right={<Text style={[type.h3, { fontSize: 14 }]}>{money(s.price)}</Text>} />)}</Group>
        <T.Small>Prices are a guide. The final bill depends on the care given.</T.Small>
      </Section>
    </Screen>
  );
}

const o = StyleSheet.create({
  hero: { height: 176, borderRadius: 22, backgroundColor: colors.accentSoft, overflow: 'hidden', padding: 20, justifyContent: 'center' },
  heroBlob: { position: 'absolute', right: -50, top: -40, width: 230, height: 230, borderRadius: 115, backgroundColor: '#C9DDF4' },
  heroDog: { position: 'absolute', right: -6, bottom: -14, width: 176, height: 190 },
  heroBadge: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  heroTitle: { fontSize: 21, lineHeight: 27, fontWeight: '700', color: colors.accentDeep, letterSpacing: -0.3 },
  heroBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', backgroundColor: colors.accentDeep, paddingHorizontal: 14, height: 36, borderRadius: 18 },
  heroBtnText: { color: '#fff', fontWeight: '600', fontSize: 13.5 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 20 },
  gridCard: { width: 260, backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.line, overflow: 'hidden' },
  gridImg: { width: '100%', height: 180 },
  petCard: { width: 164, backgroundColor: colors.surface, borderRadius: 18, borderWidth: 1, borderColor: colors.line, padding: 8, paddingBottom: 12, ...shadow },
  petImg: { width: '100%', height: 116, borderRadius: 13, backgroundColor: colors.subtle },
  addCard: { width: 110, alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 18, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.lineStrong },
  appt: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, paddingHorizontal: 14, borderRadius: 16, backgroundColor: colors.subtle, borderWidth: 1, borderColor: colors.accentSoft },
  apptIcon: { width: 46, height: 46, borderRadius: 13, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  addCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
  meta: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  metaText: { color: colors.ink, fontSize: 14, fontWeight: '500' },
  petRow: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14 },
  visit: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12, paddingHorizontal: 16 },
  dateBox: { width: 48, height: 52, borderRadius: radius.md, backgroundColor: colors.subtle, alignItems: 'center', justifyContent: 'center' },
  dateMon: { fontSize: 11, fontWeight: '600', color: colors.ink2, textTransform: 'uppercase', letterSpacing: 0.4 },
  dateDay: { fontSize: 19, fontWeight: '700', color: colors.ink, marginTop: -1 },
  balance: { backgroundColor: colors.accentDeep, borderRadius: radius.xl, padding: 18 },
  clinicImg: { width: '100%', height: 190, borderRadius: radius.xl, backgroundColor: colors.subtle },
});
