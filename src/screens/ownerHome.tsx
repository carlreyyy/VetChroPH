// Pet Owner home: a personal pet health companion.
// One sentence says the most important thing today. Each pet gets a portrait "spread" with its care line (what
// happened, today, what's next). The side column holds what's coming up, what to pay, and the clinic.
import { useState } from 'react';
import { Image, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Btn, Empty, LinkBtn, Screen, Skeleton, Stack, useFirstLoad } from '../components/ui';
import { Icon } from '../components/Icon';
import { PetAvatar } from '../components/PetArt';
import { CareLine, careNodes, HealthRing, HEALTH_COLOR, petHealth, RingGlyph } from '../components/care';
import { Cols, PState, useBP } from '../components/responsive';
import { useApp, sel } from '../store/AppStore';
import { useNav } from '../navigation/nav';
import { petPhoto } from '../data/photos';
import { colors, type, FONT, DISPLAY } from '../theme';
import type { Clinic, Pet } from '../types';
import { ageOf, billBalance, billState, isOwing, byDateTime, DOW, diff, firstName, followStatus, greeting, hourLabel, isUpcoming, money, MON, parseD, rel, t12, TODAY } from '../utils/format';

export const callClinic = (mobile: string) => Linking.openURL(`tel:${mobile.replace(/\s/g, '')}`);
export const openDirections = (c: Clinic) => {
  const q = encodeURIComponent(`${c.name}, ${c.address}`);
  Linking.openURL(Platform.OS === 'android' ? `geo:${c.lat},${c.lng}?q=${c.lat},${c.lng}(${encodeURIComponent(c.name)})` : `https://www.google.com/maps/search/?api=1&query=${q}`);
};

const HEALTH_RANK = { overdue: 0, soon: 1, ok: 2, off: 3 } as const;

/** Pet picker: portraits in their status rings. */
function PetChooser({ pets, value, onChange, onAdd }: { pets: Pet[]; value: string; onChange: (id: string) => void; onAdd: () => void }) {
  const { db } = useApp(); const { mobile } = useBP();
  const size = mobile ? 60 : 68;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: mobile ? 14 : 20, paddingRight: 8 }}
      accessibilityRole={'tablist' as never}>
      {pets.map(p => {
        const on = p.id === value; const h = petHealth(db, p);
        return (
          <Pressable key={p.id} onPress={() => onChange(p.id)} accessibilityRole="tab" accessibilityState={{ selected: on }} accessibilityLabel={`${p.name}, ${h.label}`}
            style={(st: PState) => [hm.chip, st.hovered && !on && { opacity: 0.85 }]}>
            <HealthRing pet={p} health={h.key} size={size} />
            <Text style={[hm.chipName, on && { color: colors.ink, fontWeight: '600' }]} numberOfLines={1}>{p.name}</Text>
            <View style={[hm.chipMark, on && { backgroundColor: colors.accentDeep }]} />
          </Pressable>
        );
      })}
      <Pressable onPress={onAdd} accessibilityRole="button" accessibilityLabel="Add a pet" style={(st: PState) => [hm.chip, st.hovered && { opacity: 0.8 }]}>
        <View style={[hm.add, { width: size, height: size, borderRadius: size / 2 }]}><Icon name="plus" size={22} color={colors.accent} /></View>
        <Text style={hm.chipName}>Add a pet</Text>
        <View style={hm.chipMark} />
      </Pressable>
    </ScrollView>
  );
}

/** The selected pet as a portrait with its care line. */
function PetSpread({ pet }: { pet: Pet }) {
  const nav = useNav(); const { db } = useApp(); const { mobile, desktop } = useBP();
  const h = petHealth(db, pet); const src = petPhoto(pet);
  const photo = (
    <View style={[hm.photo, mobile ? { width: '100%', aspectRatio: 16 / 11 } : { width: desktop ? 300 : 240, height: desktop ? 340 : 280 }]}>
      {src ? <Image source={src} resizeMode="cover" style={{ width: '100%', height: '100%' }} accessibilityLabel={`Photo of ${pet.name}`} />
        : <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><Icon name="paw" size={48} color={colors.blue} /></View>}
    </View>
  );
  const facts = [pet.breed, ageOf(pet.birth), pet.sex, `${pet.weight} kg`];
  const body = (
    <View style={{ flex: 1, minWidth: 0, gap: mobile ? 14 : 18, justifyContent: 'center' }}>
      <View style={{ gap: 6 }}>
        <Text style={[hm.petName, mobile && { fontSize: 38, lineHeight: 40 }]} accessibilityRole="header">{pet.name}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: 14, rowGap: 2 }}>
          {facts.map(f => <Text key={f} style={hm.fact}>{f}</Text>)}
        </View>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <RingGlyph health={h.key} size={16} />
        <Text style={[hm.status, { color: h.key === 'ok' ? colors.ok : HEALTH_COLOR[h.key] }]}>{h.label}</Text>
      </View>
      <View style={hm.lineWrap}>
        <CareLine nodes={careNodes(db, pet.id, { past: mobile ? 1 : 2, future: 2 })} />
      </View>
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <Btn label={`Book for ${pet.name}`} icon="calendar" kind="line" onPress={() => nav.navigate('Book', { petId: pet.id })} />
        <LinkBtn label="Open health record" onPress={() => nav.navigate('PetDetail', { id: pet.id })} />
      </View>
    </View>
  );
  return mobile ? <View style={{ gap: 18 }}>{photo}{body}</View> : <View style={{ flexDirection: 'row', gap: desktop ? 40 : 28 }}>{photo}{body}</View>;
}

function SideHeading({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
      <Text style={hm.sideTitle} accessibilityRole="header">{title}</Text>
      {action && onAction && <LinkBtn label={action} onPress={onAction} />}
    </View>
  );
}

export function OwnerHome() {
  const nav = useNav(); const { db, user } = useApp(); const loading = useFirstLoad('ownerHome'); const { desktop, mobile } = useBP();
  const oid = user!.ownerId!; const c = db.clinic;
  const tab = (screen: string) => nav.navigate('Main', { screen } as never);
  const pets = sel.petsOf(db, oid).filter(p => p.status === 'active')
    .sort((a, b) => HEALTH_RANK[petHealth(db, a).key] - HEALTH_RANK[petHealth(db, b).key]);
  const [picked, setPicked] = useState<string>('');
  const current = pets.find(p => p.id === picked) || pets[0];
  const upcoming = db.appts.filter(a => a.ownerId === oid && isUpcoming(a)).sort(byDateTime);
  const offers = upcoming.filter(a => a.status === 'resched');
  const unpaid = db.bills.filter(b => b.ownerId === oid && isOwing(billState(b)));
  const due = unpaid.reduce((s, b) => s + billBalance(b), 0);
  const unread = sel.unreadMsgs(db, user!);
  const today = db.settings.days[TODAY.getDay()];
  const overdue = sel.openFollowUps(db).filter(f => pets.some(p => p.id === f.petId) && followStatus(f).key === 'overdue');

  // The one sentence that matters most right now.
  const next = upcoming.find(a => a.status !== 'resched');
  const lead = offers[0] ? `The clinic suggested a new time for ${sel.pet(db, offers[0].petId)!.name}'s visit. Please review it.`
    : overdue[0] ? `${sel.pet(db, overdue[0].petId)!.name}'s ${overdue[0].reason} is ${-diff(overdue[0].date)} days overdue.`
    : next ? `${sel.pet(db, next.petId)!.name}'s ${next.service} is ${rel(next.date).toLowerCase()}, at ${t12(next.time)}.`
    : pets.length ? 'Every pet is up to date. Nothing needs you today.' : 'Add your first pet to start their health record.';

  const header = (
    <View style={[{ gap: 14 }, !mobile && { flexDirection: 'row', alignItems: 'flex-end', gap: 32 }]}>
      <View style={{ flex: mobile ? undefined : 1, minWidth: 0, gap: 10 }}>
        <Text style={[hm.hello, mobile && { fontSize: 34, lineHeight: 36, letterSpacing: -1.2 }]} accessibilityRole="header">{greeting()}, {firstName(user!.name)}.</Text>
        <Text style={[hm.lead, mobile && { fontSize: 17, lineHeight: 25 }]}>{lead}</Text>
      </View>
      <Btn label="Book a visit" icon="plus" onPress={() => nav.navigate('Book')} style={mobile ? { alignSelf: 'flex-start' } : { height: 50, paddingHorizontal: 24 }} />
    </View>
  );

  const petsBlock = pets.length === 0 ? (
    <Empty icon="paw" title="No pets yet" sub="Add a dog or cat to keep their vaccines, visits and reminders in one place." action={<Btn label="Add a pet" icon="plus" onPress={() => nav.navigate('PetForm', { ownerId: oid })} />} />
  ) : (
    <View style={{ gap: mobile ? 20 : 28 }}>
      <PetChooser pets={pets} value={current!.id} onChange={setPicked} onAdd={() => nav.navigate('PetForm', { ownerId: oid })} />
      <PetSpread pet={current!} />
    </View>
  );

  const comingUp = (
    <View style={{ gap: 4 }}>
      <SideHeading title="Coming up" action={upcoming.length > 0 ? 'All visits' : undefined} onAction={() => tab('Appointments')} />
      {upcoming.length === 0 ? <Text style={[type.small, { paddingVertical: 12 }]}>No visits booked. Open times are confirmed right away.</Text>
        : upcoming.slice(0, 3).map((a, i) => {
          const p = sel.pet(db, a.petId)!; const d = parseD(a.date);
          return (
            <Pressable key={a.id} onPress={() => nav.navigate('ApptDetail', { id: a.id })} accessibilityRole="button"
              accessibilityLabel={`${a.service} for ${p.name}, ${rel(a.date)} at ${t12(a.time)}`}
              style={(st: PState) => [hm.visit, i > 0 && hm.rule, st.hovered && { backgroundColor: colors.hover }]}>
              <View style={hm.date}>
                <Text style={hm.dateDay}>{d.getDate()}</Text>
                <Text style={hm.dateMon}>{MON[d.getMonth()]}, {DOW[d.getDay()]}</Text>
              </View>
              <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                <Text style={type.h3} numberOfLines={1}>{a.service}</Text>
                <Text style={type.small} numberOfLines={1}>{p.name}, {t12(a.time)}</Text>
                {a.status === 'resched' && <Text style={[type.small, { color: colors.warn, fontWeight: '600' }]}>New time suggested. Review it.</Text>}
              </View>
              <PetAvatar pet={p} size={36} />
            </Pressable>
          );
        })}
    </View>
  );

  const toPay = (
    <View style={{ gap: 10 }}>
      <SideHeading title="To pay" action={unpaid.length ? 'Bills' : undefined} onAction={() => tab('Bills')} />
      {unpaid.length ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <View style={{ flex: 1, minWidth: 140 }}>
            <Text style={hm.amount}>{money(due)}</Text>
            <Text style={type.small}>{unpaid.length === 1 ? 'One bill' : `${unpaid.length} bills`} waiting. GCash, bank or cash at the clinic.</Text>
          </View>
          <Btn label="Pay now" icon="wallet" onPress={() => unpaid.length === 1 ? nav.navigate('PayBill', { id: unpaid[0].id }) : tab('Bills')} />
        </View>
      ) : <Text style={type.small}>Nothing to pay right now.</Text>}
    </View>
  );

  const clinic = (
    <View style={{ gap: 12 }}>
      <SideHeading title="Your clinic" action="Details" onAction={() => nav.navigate('ClinicInfo')} />
      <View style={{ gap: 4 }}>
        <Text style={type.h3}>{c.name}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={[hm.openDot, { backgroundColor: today?.open ? colors.ok : colors.lineStrong }]} />
          <Text style={type.small}>{today?.open ? `Open today until ${hourLabel(today.to)}` : 'Closed today'}</Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        <Btn label={unread ? `Messages (${unread})` : 'Message'} icon="chat" kind="line" small onPress={() => tab('Messages')} />
        <Btn label="Call" icon="phone" kind="line" small onPress={() => callClinic(c.mobile)} />
        <Btn label="Directions" icon="nav" kind="line" small onPress={() => openDirections(c)} />
      </View>
    </View>
  );

  if (loading) return (
    <Screen hideHeader tabbed>
      <Stack gap={24}>
        <Skeleton h={44} w={320} r={8} /><Skeleton h={20} w={260} r={6} />
        <View style={{ flexDirection: 'row', gap: 16 }}>{[0, 1, 2].map(i => <Skeleton key={i} h={64} w={64} r={32} />)}</View>
        <Skeleton h={300} r={14} />
      </Stack>
    </Screen>
  );

  const side = <View style={[hm.side, mobile && hm.sideMobile]}>{comingUp}<View style={hm.sideRule} />{toPay}<View style={hm.sideRule} />{clinic}</View>;
  return (
    <Screen hideHeader tabbed>
      {header}
      {desktop ? (
        <Cols ratio={[1.9, 1]} gap={56}>
          {petsBlock}
          {side}
        </Cols>
      ) : <>{petsBlock}{side}</>}
    </Screen>
  );
}

const hm = StyleSheet.create({
  hello:     { fontFamily: DISPLAY, fontSize: 52, lineHeight: 54, fontWeight: '600', color: colors.ink, letterSpacing: -2 },
  lead:      { fontFamily: FONT, fontSize: 19, lineHeight: 28, color: colors.ink2, maxWidth: 640 },

  chip:      { alignItems: 'center', gap: 6, width: 76 },
  chipName:  { fontFamily: FONT, fontSize: 13.5, color: colors.ink2, maxWidth: 76 },
  chipMark:  { width: 18, height: 3, borderRadius: 2, backgroundColor: 'transparent' },
  add:       { borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.lineStrong, alignItems: 'center', justifyContent: 'center' },

  photo:     { borderRadius: 14, overflow: 'hidden', backgroundColor: colors.subtle },
  petName:   { fontFamily: DISPLAY, fontSize: 56, lineHeight: 56, fontWeight: '600', color: colors.ink, letterSpacing: -2 },
  fact:      { fontFamily: FONT, fontSize: 15, color: colors.ink2 },
  status:    { fontFamily: FONT, fontSize: 15, fontWeight: '600' },
  lineWrap:  { borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.line, paddingTop: 16, paddingBottom: 14 },

  side:      { gap: 24, paddingLeft: 32, borderLeftWidth: 1, borderLeftColor: colors.line },
  sideMobile:{ paddingLeft: 0, borderLeftWidth: 0, borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 24 },
  sideRule:  { height: 1, backgroundColor: colors.line },
  sideTitle: { fontFamily: DISPLAY, fontSize: 21, lineHeight: 26, fontWeight: '600', color: colors.ink, letterSpacing: -0.4 },
  visit:     { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, marginHorizontal: -8, paddingHorizontal: 8, borderRadius: 8 },
  rule:      { borderTopWidth: 1, borderTopColor: colors.line, borderRadius: 0 },
  date:      { width: 64 },
  dateDay:   { fontFamily: DISPLAY, fontSize: 30, lineHeight: 32, fontWeight: '600', color: colors.ink, letterSpacing: -1, fontVariant: ['tabular-nums'] },
  dateMon:   { fontFamily: FONT, fontSize: 12, color: colors.ink2 },
  amount:    { fontFamily: DISPLAY, fontSize: 36, lineHeight: 40, fontWeight: '600', color: colors.ink, letterSpacing: -1.2, fontVariant: ['tabular-nums'] },
  openDot:   { width: 8, height: 8, borderRadius: 4 },
});
