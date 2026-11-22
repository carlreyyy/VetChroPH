// Screens every role shares: home header, notification center, profile and settings.
import { useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Avatar, Btn, Card, CountBadge, Empty, Field, Group, Hint, IconBtn, IconTile, Row, Screen, Section, SegControl, Stack, T, Toggle } from '../components/ui';
import { Sheet, useConfirm } from '../components/overlays';
import { BrandTile } from '../components/Brand';
import { Icon, IconName } from '../components/Icon';
import { useApp } from '../store/AppStore';
import { useNav } from '../navigation/nav';
import { colors, shadow, type, Tone, FONT, DISPLAY } from '../theme';
import { ago, fmtD, D, firstName, greeting, isEmail, isPhone, parseD } from '../utils/format';
import { DEFAULT_PREFS } from '../data/seed';
import { Cols, useBP } from '../components/responsive';

export const ROLE_LABEL = { owner: 'Pet Owner', staff: 'Clinic Staff', admin: 'Administrator (Owner)' } as const;

/** Top of the clinic roles' home tab (staff and administrator). Pet owners have their own greeting on OwnerHome. */
export function HomeHeader({ sub, action }: { sub?: string; action?: React.ReactNode }) {
  const nav = useNav(); const { user, db, act } = useApp(); const { wide } = useBP();
  const unread = (db.notifs[act.inboxKey()] || []).filter(n => n.unread).length;
  // Tablets and desktops: the sidebar already has the logo, so the page header is just a greeting + date.
  if (wide) return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 16 }}>
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.teal }} />
          <Text style={{ fontFamily: FONT, fontSize: 15, fontWeight: '500', color: colors.accent }}>{fmtD(D(0))}</Text>
        </View>
        <Text style={{ fontFamily: FONT, fontSize: 28, lineHeight: 34, fontWeight: '700', color: colors.ink, letterSpacing: -0.6 }} numberOfLines={1} accessibilityRole="header">{greeting()}, {firstName(user!.name)}</Text>
        {sub && <Text style={[type.small, { fontSize: 14, marginTop: 4, color: colors.ink2 }]}>{sub}</Text>}
      </View>
      {action}
    </View>
  );
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 8 }}>
      <BrandTile size={40} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ fontFamily: FONT, fontSize: 12, color: colors.ink3 }} numberOfLines={1}>{greeting()}</Text>
        <Text style={{ fontFamily: FONT, fontSize: 20, lineHeight: 26, fontWeight: '700', color: colors.ink, letterSpacing: -0.4 }} numberOfLines={1}>{firstName(user!.name)}</Text>
      </View>
      <IconBtn name="bell" label="Notifications" count={unread} framed onPress={() => nav.navigate('Notifications')} />
      <Pressable onPress={() => nav.navigate('Profile')} accessibilityLabel="Profile and settings" accessibilityRole="button"><Avatar name={user!.name} size={38} /></Pressable>
    </View>
  );
}

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
  const unread = list.filter(n => n.unread).length;
  const block = (title: string, items: typeof list) => items.length > 0 && (
    <Section title={title}>
      <Group>
        {items.map(n => (
          <Row key={n.id} unread={n.unread} title={n.title} sub={`${n.body}\n${ago(n.at)}`} subLines={3}
            left={<IconTile name={n.icon as IconName} tone={n.tone as Tone} />}
            onPress={() => { act.markRead(n.id); if (n.link) go(n.link.screen, n.link.params); }} />
        ))}
      </Group>
    </Section>
  );
  return (
    <Screen title="Notifications" sub="Booking, reminder, message and payment updates."
      right={unread ? <Btn label="Mark all read" icon="check" kind="ghost" small onPress={act.markAllRead} /> : undefined}>
      <SegControl options={[['all', 'All'], ['unread', 'Unread', unread]]} value={tab} onChange={setTab} />
      {shown.length === 0 ? <Card><Empty icon="bell" title="You're all caught up" sub="Booking, reminder, message and payment updates appear here." /></Card> : <>
        {block('Today', today)}
        {block('Earlier', earlier)}
      </>}
      <Hint>In the real app these also arrive as phone alerts, and reminders can go out by SMS or email.</Hint>
    </Screen>
  );
}

export function NotifSettings() {
  const { user, act } = useApp(); const prefs = user!.prefs || DEFAULT_PREFS;
  return (
    <Screen title="Notification settings" sub="Choose how and when the clinic reaches you.">
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
        <Hint>Every update is also kept in your notification list. SMS and email depend on clinic setup.</Hint>
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
  const { wide } = useBP();
  const edit = () => { setErr({}); setF({ name: user!.name, phone: user!.phone, email: user!.email, address: ownerRec?.address || '' }); setEditOpen(true); };
  const card = (
    <View style={{ borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface }}>
      {/* Identity */}
      <View style={{ backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.line, padding: 20, flexDirection: 'row', gap: 16, alignItems: 'center' }}>
        <Avatar name={user!.name} size={64} />
        <View style={{ flex: 1, minWidth: 0, gap: 5 }}>
          <Text style={{ fontFamily: FONT, fontSize: 20, lineHeight: 26, fontWeight: '700', color: colors.ink, letterSpacing: -0.4 }} numberOfLines={1}>{user!.name}</Text>
          <View style={{ paddingHorizontal: 9, paddingVertical: 3, borderRadius: 6, backgroundColor: colors.accentSoft, alignSelf: 'flex-start' }}>
            <Text style={{ fontFamily: FONT, fontSize: 11.5, fontWeight: '600', color: colors.ink }}>{ROLE_LABEL[user!.role]}</Text>
          </View>
          {ownerRec && <Text style={{ fontFamily: FONT, fontSize: 12, color: colors.ink2 }}>client since {parseD(ownerRec.since).getFullYear()}</Text>}
        </View>
      </View>

      {/* White bottom: contact + edit + stats */}
      <View style={{ backgroundColor: colors.surface, padding: 16, gap: 14 }}>
        {/* Contact info */}
        <View style={{ gap: 8 }}>
          {([['mail', user!.email], ['phone', user!.phone], ...(owner && ownerRec?.address ? [['pin', ownerRec.address]] : [])] as [IconName, string][]).map(([i, v]) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Icon name={i} size={15} color={colors.ink3} />
              <Text style={[type.small, { fontSize: 13.5, color: colors.ink, flex: 1 }]} numberOfLines={2}>{v}</Text>
            </View>
          ))}
        </View>

        <Btn label="Edit profile" icon="edit" kind="line" small onPress={edit} />

        {/* Owner stats strip */}
        {owner && (
          <View style={pf.stats}>
            {([[String(myPets), myPets === 1 ? 'Pet' : 'Pets'], [String(myAppts), myAppts === 1 ? 'Visit' : 'Visits'], [`${years}+`, years === 1 ? 'Year' : 'Years']] as const).map(([v, l], k) => (
              <View key={l} style={[pf.stat, k > 0 && { borderLeftWidth: 1, borderLeftColor: colors.line }]}>
                <Text style={pf.val}>{v}</Text>
                <Text style={[type.small, { fontSize: 12 }]}>{l}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
  const settings = (
    <>
      <Section title="Account">
        <Group>
          <Row icon="user" title="Personal details" sub={owner ? 'Name, mobile number, email and address' : 'Name, mobile number and email'} onPress={edit} />
          <Row icon="lock" title="Change password" sub="Use at least 8 characters" onPress={() => setPwOpen(true)} />
        </Group>
      </Section>
      <Section title={owner ? 'Notifications' : 'General'}>
        <Group>
          <Row icon="bell" title="Notification center" sub={unread ? `${unread} unread` : 'All caught up'} right={unread ? <CountBadge n={unread} /> : undefined} onPress={() => nav.navigate('Notifications')} />
          {owner && <Row icon="gear" title="Notification settings" sub="Phone alerts, SMS and email" onPress={() => nav.navigate('NotifSettings')} />}
          {!owner && <Row icon="pin" title="Clinic information" sub={db.clinic.address} onPress={() => nav.navigate('ClinicInfo')} />}
        </Group>
      </Section>
      {owner && (
        <Section title="Clinic">
          <Group>
            <Row icon="pin" title="Clinic information" sub="Location, hours and services" onPress={() => nav.navigate('ClinicInfo')} />
            <Row icon="phone" title="Call the clinic" sub={db.clinic.mobile} onPress={() => Linking.openURL(`tel:${db.clinic.mobile.replace(/\s/g, '')}`)} />
          </Group>
        </Section>
      )}
      <Group>
        <Row icon="logout" title="Log out" danger chevron={false} onPress={() => confirm({ title: 'Log out?', body: 'You can log back in with your email and password, or a code sent to your mobile number.', ok: 'Log out', icon: 'logout', onOk: act.logout })} />
      </Group>
    </>
  );
  return (
    <Screen title="Profile and settings" sub="Your account, notification preferences and clinic details.">
      {wide ? <Cols ratio={[300, 1]}>{card}{settings}</Cols> : <>{card}{settings}</>}
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
  stats: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 16 },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  val: { fontFamily: FONT, color: colors.ink, fontSize: 18, fontWeight: '700', letterSpacing: -0.3 },
});
