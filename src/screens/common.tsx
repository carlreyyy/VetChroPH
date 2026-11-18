// Screens every role shares: home header, notification center, profile and settings.
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Avatar, Btn, Empty, Field, Group, IconBtn, Row, Screen, Section, Stack, T, Tabs, Toggle } from '../components/ui';
import { Sheet, useConfirm } from '../components/overlays';
import { BrandTile, Logo } from '../components/Brand';
import { Icon } from '../components/Icon';
import { useApp } from '../store/AppStore';
import { useNav } from '../navigation/nav';
import { colors, type } from '../theme';
import { ago, fmtD, D, firstName, greeting, isEmail, isPhone, parseD } from '../utils/format';
import { DEFAULT_PREFS } from '../data/seed';
import { useBP } from '../components/responsive';

export const ROLE_LABEL = { owner: 'Pet Owner', staff: 'Clinic Staff', admin: 'Administrator (Owner)' } as const;

/** Top of every role's home tab. Owners: big greeting with the avatar (badge = unread notifications). Clinic roles also get a bell. */
export function HomeHeader({ owner, sub, action }: { sub?: string; owner?: boolean; action?: React.ReactNode }) {
  const nav = useNav(); const { user, db, act } = useApp(); const { wide } = useBP();
  const unread = (db.notifs[act.inboxKey()] || []).filter(n => n.unread).length;
  // Tablets and desktops: the sidebar already has the logo, notifications and profile, so the page header is just a title.
  if (wide) return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, paddingTop: 12 }}>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ fontSize: 26, lineHeight: 32, fontWeight: '700', color: colors.ink, letterSpacing: -0.5 }} numberOfLines={1} accessibilityRole="header">{greeting()}, {firstName(user!.name)}</Text>
        <Text style={[type.small, { fontSize: 14, marginTop: 4 }]}>{sub || fmtD(D(0))}</Text>
      </View>
      {action}
    </View>
  );
  if (owner) return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingTop: 12 }}>
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ marginBottom: 10 }}><Logo size={24} /></View>
        <Text style={{ fontSize: 17, lineHeight: 22, fontWeight: '600', color: colors.ink }}>Welcome back,</Text>
        <Text style={{ fontSize: 26, lineHeight: 32, fontWeight: '800', color: colors.ink, letterSpacing: -0.6 }} numberOfLines={1}>{firstName(user!.name)}! 👋</Text>
        <Text style={[type.small, { marginTop: 2 }]}>Your pets are in good hands ♡</Text>
      </View>
      <Pressable onPress={() => nav.navigate('Profile')} accessibilityLabel="Profile and settings" accessibilityRole="button">
        <View style={{ padding: 2, borderRadius: 26, borderWidth: 1.5, borderColor: colors.accentSoft }}><Avatar name={user!.name} size={46} /></View>
        {unread > 0 && <View style={hh.badge}><Text style={hh.badgeText}>{unread}</Text></View>}
      </Pressable>
    </View>
  );
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 10 }}>
      <BrandTile size={42} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[type.small, { fontSize: 14 }]} numberOfLines={1}>{greeting()},</Text>
        <Text style={{ fontSize: 22, lineHeight: 28, fontWeight: '700', color: colors.ink, letterSpacing: -0.4 }} numberOfLines={1}>{firstName(user!.name)}</Text>
      </View>
      <IconBtn name="bell" label="Notifications" badge={unread > 0} framed onPress={() => nav.navigate('Notifications')} />
      <Pressable onPress={() => nav.navigate('Profile')} accessibilityLabel="Profile and settings" accessibilityRole="button"><Avatar name={user!.name} size={40} /></Pressable>
    </View>
  );
}
const hh = StyleSheet.create({
  badge: { position: 'absolute', top: -2, right: -2, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: colors.dot, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4, borderWidth: 2, borderColor: '#fff' },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
});

/** Small context line under the header (role and date). */
export function Greeting({ sub }: { sub?: string }) {
  const { wide } = useBP();
  return sub && !wide ? <Text style={[type.small, { marginTop: -8 }]}>{sub}</Text> : null;
}
export const todayLine = () => fmtD(D(0));

export function Notifications() {
  const nav = useNav(); const { db, act, user } = useApp();
  const list = db.notifs[act.inboxKey()] || [];
  const [tab, setTab] = useState<'all' | 'unread'>('all');
  const shown = tab === 'all' ? list : list.filter(n => n.unread);
  const tone = (t: string) => t === 'ok' ? colors.ok : t === 'warn' ? colors.warn : t === 'bad' ? colors.bad : colors.ink2;
  const go = (screen: string, params?: Record<string, string>) => {
    if (screen === 'Chat' && user!.role === 'owner') return nav.navigate('Main', { screen: 'Messages' } as never);
    nav.navigate(screen, params);
  };
  const today = shown.filter(n => Date.now() - n.at < 864e5), earlier = shown.filter(n => Date.now() - n.at >= 864e5);
  const block = (title: string, items: typeof list) => items.length > 0 && (
    <Section title={title}>
      <Group>
        {items.map(n => (
          <Row key={n.id} unread={n.unread} title={n.title} sub={`${n.body}\n${ago(n.at)}`} subLines={3}
            left={<View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.subtle, alignItems: 'center', justifyContent: 'center' }}><Icon name={n.icon} size={17} color={tone(n.tone)} /></View>}
            onPress={() => { act.markRead(n.id); if (n.link) go(n.link.screen, n.link.params); }} />
        ))}
      </Group>
    </Section>
  );
  return (
    <Screen title="Notifications" right={list.some(n => n.unread) ? <Btn label="Mark all read" kind="ghost" small onPress={act.markAllRead} style={{ paddingHorizontal: 0 }} /> : undefined}>
      <Tabs options={[['all', 'All'], ['unread', 'Unread', list.filter(n => n.unread).length]]} value={tab} onChange={setTab} />
      {shown.length === 0 ? <Empty icon="bell" title="You're all caught up" sub="Booking, reminder, message and payment updates appear here." /> : <>
        {block('Today', today)}
        {block('Earlier', earlier)}
      </>}
      <T.Small>In the real app these also arrive as phone alerts, and reminders can go out by SMS or email.</T.Small>
    </Screen>
  );
}

export function NotifSettings() {
  const { user, act } = useApp(); const prefs = user!.prefs || DEFAULT_PREFS;
  return (
    <Screen title="Notification Settings">
      <Section title="Send notifications by">
        <Group>
          {([['push', 'Phone alerts', 'phoneapp'], ['sms', 'SMS', 'chat'], ['email', 'Email', 'mail']] as const).map(([k, l, i]) => (
            <Row key={k} icon={i} title={l} right={<Toggle label={l} value={prefs[k]} onChange={() => act.setPrefs({ [k]: !prefs[k] })} />} />
          ))}
        </Group>
      </Section>
      <Section title="Notify me about">
        <Group>
          {([['appt', 'Appointments', 'calendar'], ['care', 'Follow-ups, vaccines and deworming', 'syringe'], ['pay', 'Bills and payments', 'receipt'], ['chat', 'Messages from the clinic', 'chat']] as const).map(([k, l, i]) => (
            <Row key={k} icon={i} title={l} right={<Toggle label={l} value={prefs[k]} onChange={() => act.setPrefs({ [k]: !prefs[k] })} />} />
          ))}
        </Group>
        <T.Small>Every update is also kept in your notification list. SMS and email depend on clinic setup.</T.Small>
      </Section>
    </Screen>
  );
}

export function Profile() {
  const { user, db, act } = useApp(); const confirm = useConfirm(); const nav = useNav();
  const ownerRec = user!.ownerId ? db.owners.find(o => o.id === user!.ownerId) : undefined;
  const [f, setF] = useState({ name: user!.name, phone: user!.phone, email: user!.email, address: ownerRec?.address || '' });
  const [err, setErr] = useState<Record<string, string>>({});
  const prefs = user!.prefs || DEFAULT_PREFS;
  const [editOpen, setEditOpen] = useState(false);
  const [pwOpen, setPwOpen] = useState(false); const [pw, setPw] = useState({ old: '', next: '' }); const [pwErr, setPwErr] = useState<Record<string, string>>({});
  const save = () => {
    const e: Record<string, string> = {};
    if (!f.name.trim()) e.name = 'Enter your name';
    if (!isPhone(f.phone)) e.phone = 'Use a PH mobile number';
    if (!isEmail(f.email)) e.email = 'Enter a valid email';
    if (Object.keys(e).length) return setErr(e);
    act.updateProfile(f); setEditOpen(false);
  };
  const savePw = () => {
    if (pw.next.length < 8) return setPwErr({ next: 'Use at least 8 characters' });
    const m = act.changePassword(pw.old, pw.next); if (m) return setPwErr({ old: m });
    setPwOpen(false); setPw({ old: '', next: '' });
  };
  const owner = user!.role === 'owner';
  const myPets = owner ? db.pets.filter(p => p.ownerId === user!.ownerId && p.status === 'active').length : 0;
  const myAppts = owner ? db.appts.filter(a => a.ownerId === user!.ownerId).length : 0;
  const years = ownerRec ? Math.max(1, new Date().getFullYear() - parseD(ownerRec.since).getFullYear()) : 0;
  const unread = (db.notifs[act.inboxKey()] || []).filter(n => n.unread).length;
  type Item = [icon: Parameters<typeof Icon>[0]['name'], label: string, go: () => void, badge?: number];
  const items: Item[] = [
    ...(owner ? [
      ['paw', 'My Pets', () => nav.navigate('Main', { screen: 'Pets' } as never)],
      ['calendar', 'Appointment History', () => nav.navigate('Main', { screen: 'Appointments' } as never)],
      ['file', 'Medical Records', () => nav.navigate('Main', { screen: 'Pets' } as never)],
    ] as Item[] : []),
    ['bell', 'Notifications', () => nav.navigate('Notifications'), unread],
    ...(owner ? [['receipt', 'Bills and Payments', () => nav.navigate('OwnerBills')]] as Item[] : []),
    ...(owner ? [['gear', 'Notification Settings', () => nav.navigate('NotifSettings')]] as Item[] : []),
    ['pin', 'Clinic Information', () => nav.navigate('ClinicInfo')],
    ['lock', 'Change Password', () => setPwOpen(true)],
  ];
  return (
    <Screen title="Profile & Settings" right={owner ? <IconBtn name="gear" label="Notification settings" onPress={() => nav.navigate('NotifSettings')} /> : undefined}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
        <Avatar name={user!.name} size={80} />
        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <Text style={{ fontSize: 20, fontWeight: '700', color: colors.ink, letterSpacing: -0.3 }} numberOfLines={1}>{user!.name}</Text>
          <T.Small numberOfLines={1}>{user!.email}</T.Small>
          <View style={{ marginTop: 8, alignSelf: 'flex-start' }}><Btn label="Edit Profile" kind="soft" small onPress={() => { setErr({}); setEditOpen(true); }} /></View>
        </View>
      </View>
      {owner && (
        <View style={pf.strip}>
          {([['paw', String(myPets), myPets === 1 ? 'Pet' : 'Pets'], ['calendar', String(myAppts), 'Appointments'], ['heart', `${years}`, years === 1 ? 'Year+' : 'Years+']] as const).map(([i, v, l], k) => (
            <View key={l} style={[pf.cell, k > 0 && { borderLeftWidth: 1, borderLeftColor: '#C4D8EF' }]}>
              <Icon name={i} size={18} color={colors.accentDeep} strokeWidth={2.2} />
              <Text style={pf.val}>{v}</Text><Text style={pf.lab}>{l}</Text>
            </View>
          ))}
        </View>
      )}
      <View>
        {items.map(([i, l, go, n], k) => (
          <Pressable key={l} onPress={go} accessibilityRole="button" style={({ pressed }) => [pf.item, k > 0 && { borderTopWidth: 1, borderTopColor: colors.line }, pressed && { backgroundColor: colors.subtle }]}>
            <Icon name={i} size={21} color={colors.accentDeep} strokeWidth={2.1} />
            <Text style={pf.itemText}>{l}</Text>
            {!!n && <View style={pf.badge}><Text style={pf.badgeText}>{n}</Text></View>}
            <Icon name="chevR" size={18} color={colors.ink3} />
          </Pressable>
        ))}
        <Pressable onPress={() => confirm({ title: 'Log out?', body: 'You can log back in with your email and password, or a code sent to your mobile number.', ok: 'Log out', icon: 'logout', onOk: act.logout })} accessibilityRole="button" style={({ pressed }) => [pf.item, { borderTopWidth: 1, borderTopColor: colors.line }, pressed && { backgroundColor: colors.subtle }]}>
          <Icon name="logout" size={21} color={colors.bad} strokeWidth={2.1} />
          <Text style={[pf.itemText, { color: colors.bad }]}>Log Out</Text>
        </Pressable>
      </View>
      <View style={{ alignItems: 'center', paddingVertical: 8, opacity: 0.9 }}><Logo size={26} tagline /></View>
      <Sheet visible={editOpen} onClose={() => setEditOpen(false)} title="Edit profile" footer={<Btn label="Save changes" style={{ flex: 1 }} onPress={save} />}>
        <Stack gap={14}>
          <Field label="Full name" value={f.name} onChangeText={v => setF({ ...f, name: v })} error={err.name} />
          <Field label="Mobile number" keyboardType="phone-pad" value={f.phone} onChangeText={v => setF({ ...f, phone: v })} error={err.phone} />
          <Field label="Email" keyboardType="email-address" autoCapitalize="none" value={f.email} onChangeText={v => setF({ ...f, email: v })} error={err.email} />
          {owner && <Field label="Address" value={f.address} onChangeText={v => setF({ ...f, address: v })} />}
        </Stack>
      </Sheet>
      <Sheet visible={pwOpen} onClose={() => setPwOpen(false)} title="Change password" footer={<Btn label="Save password" style={{ flex: 1 }} onPress={savePw} />}>
        <Field label="Current password" secure value={pw.old} onChangeText={v => { setPw({ ...pw, old: v }); setPwErr({}); }} error={pwErr.old} />
        <Field label="New password" secure value={pw.next} onChangeText={v => { setPw({ ...pw, next: v }); setPwErr({}); }} error={pwErr.next} hint="At least 8 characters" />
      </Sheet>
    </Screen>
  );
}

const pf = StyleSheet.create({
  strip: { flexDirection: 'row', backgroundColor: colors.accentSoft, borderRadius: 18, paddingVertical: 14 },
  cell: { flex: 1, alignItems: 'center', gap: 2 },
  val: { color: colors.accentDeep, fontSize: 17, fontWeight: '800', marginTop: 4 },
  lab: { color: colors.accentDeep, fontSize: 12, opacity: 0.8 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 15, paddingHorizontal: 4 },
  itemText: { flex: 1, fontSize: 15.5, fontWeight: '500', color: colors.ink },
  badge: { minWidth: 22, height: 22, borderRadius: 11, backgroundColor: colors.dot, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  badgeText: { color: '#fff', fontSize: 11.5, fontWeight: '700' },
});
