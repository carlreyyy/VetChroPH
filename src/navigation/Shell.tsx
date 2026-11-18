// Signed-in app frame.
// Pet owners: top navbar (OwnerNav) on every breakpoint.
// Staff and administrator on tablets and desktops: a left sidebar beside the page. Desktop (>= 1200 px) shows a full
// sidebar with labels; tablets (768–1199 px) show a compact icon rail. Phones keep the bottom tab bar from
// RootNavigator, so this frame renders the page alone there.
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { NavigationContainerRefWithCurrent, StackActions } from '@react-navigation/native';
import { useApp, sel } from '../store/AppStore';
import { useBP, PState } from '../components/responsive';
import { Avatar } from '../components/ui';
import { Logo, BrandTile } from '../components/Brand';
import { Icon, IconName } from '../components/Icon';
import { useConfirm } from '../components/overlays';
import { colors } from '../theme';
import { billState } from '../utils/format';
import type { Role } from '../types';
import type { RootList } from './linking';
import { OwnerFrame } from './OwnerNav';

type Item = { key: string; label: string; icon: IconName; tab?: boolean; badge?: number; short?: string };

/** Screens that belong to a sidebar section, so the right item stays highlighted on detail pages. */
const PARENT: Record<string, string> = {
  PetDetail: 'Pets', PetForm: 'Pets', VisitDetail: 'Pets', ConsultForm: 'Patients', OwnerDetail: 'Patients',
  ApptDetail: 'Appointments', Book: 'Appointments', BookSuccess: 'Appointments', Chat: 'Messages',
  BillDetail: 'Billing', PayBill: 'Billing', Receipt: 'Billing', CreateBill: 'Billing', NotifSettings: 'Profile',
  UserForm: 'Users', ClinicProfile: 'Setup', Services: 'Setup', Hours: 'Setup', Reminders: 'Setup', PaymentSetup: 'Setup',
};

function useItems(role: Role): [string, Item[]][] {
  const { db, user } = useApp();
  const unread = sel.unreadMsgs(db, user!);
  const verify = db.bills.filter(b => billState(b) === 'pending').length;
  if (role === 'staff') return [['', [
    { key: 'Home', label: 'Today', icon: 'home', tab: true },
    { key: 'Appointments', label: 'Schedule', icon: 'calendar', tab: true },
    { key: 'Patients', label: 'Patients', icon: 'paw', tab: true },
    { key: 'Messages', label: 'Messages', icon: 'chat', tab: true, badge: unread },
    { key: 'Billing', label: 'Billing', icon: 'wallet', tab: true, badge: verify },
    { key: 'CareMonitor', label: 'Due list', icon: 'bell' },
  ]]];
  return [
    ['', [
      { key: 'Home', label: 'Overview', icon: 'home', tab: true },
      { key: 'Appointments', label: 'Schedule', icon: 'calendar', tab: true },
      { key: 'Patients', label: 'Patients', icon: 'paw', tab: true },
      { key: 'Inbox', label: 'Messages', icon: 'chat', badge: unread },
      { key: 'BillingList', label: 'Billing', icon: 'wallet', badge: verify },
      { key: 'CareMonitor', label: 'Due list', icon: 'bell' },
      { key: 'Reports', label: 'Reports', icon: 'chart', tab: true },
    ]],
    ['Administration', [
      { key: 'Setup', label: 'Setup', icon: 'sliders', tab: true },
      { key: 'Users', label: 'Users and staff', short: 'Users', icon: 'users' },
      { key: 'ActivityLog', label: 'Activity log', short: 'Activity', icon: 'history' },
    ]],
  ];
}

export function Shell({ children, route, navRef }: { children: React.ReactNode; route: string; navRef: NavigationContainerRefWithCurrent<RootList> }) {
  const { user } = useApp(); const { bp } = useBP();
  if (user?.role === 'owner') return <OwnerFrame route={route} navRef={navRef}>{children}</OwnerFrame>;
  if (!user || bp === 'mobile') return <>{children}</>;
  return (
    <View style={{ flex: 1, flexDirection: 'row', backgroundColor: colors.bg }}>
      <Sidebar route={route} navRef={navRef} compact={bp === 'tablet'} />
      <View style={{ flex: 1, minWidth: 0 }}>{children}</View>
    </View>
  );
}

function Sidebar({ route, navRef, compact }: { route: string; navRef: NavigationContainerRefWithCurrent<RootList>; compact: boolean }) {
  const { user, db, act } = useApp(); const confirm = useConfirm();
  const groups = useItems(user!.role);
  const all = groups.flatMap(g => g[1]);
  const keys = all.map(i => i.key);
  // Admins reach Messages and Billing as stack screens; map the shared tab names onto them.
  const alias: Record<string, string> = user!.role === 'admin' ? { Messages: 'Inbox', Billing: 'BillingList', Pets: 'Patients' } : { Pets: 'Patients' };
  const norm = (r: string) => alias[r] || r;
  const lastRef = React.useRef(route && keys.includes(norm(PARENT[route] || route)) ? norm(PARENT[route] || route) : 'Home');
  let active = keys.includes(norm(route)) ? norm(route) : keys.includes(norm(PARENT[route] || '')) ? norm(PARENT[route]) : '';
  if (active) lastRef.current = active; else if (route !== 'Notifications' && route !== 'Profile') active = lastRef.current;
  const unreadNotifs = (db.notifs[act.inboxKey()] || []).filter(n => n.unread).length;

  const go = (it: { key: string; tab?: boolean }) => {
    const nav = navRef.current; if (!nav) return;
    if (it.tab) { nav.navigate('Main', { screen: it.key }); return; }
    if (nav.canGoBack()) nav.dispatch(StackActions.popToTop());
    nav.navigate(it.key);
  };

  const item = (it: Item, on: boolean) => (
    <Pressable key={it.key} onPress={() => go(it)} accessibilityRole="link" accessibilityLabel={it.label} accessibilityState={{ selected: on }}
      style={(st: PState) => [compact ? sb.railItem : sb.item, on ? sb.itemOn : st.hovered ? sb.itemHover : null]}>
      <View>
        <Icon name={it.icon} size={compact ? 22 : 19} color={on ? colors.accentDeep : colors.ink2} strokeWidth={on ? 2.2 : 1.9} />
        {compact && !!it.badge && <View style={sb.dot} />}
      </View>
      <Text style={[compact ? sb.railLabel : sb.label, on && { color: colors.accentDeep, fontWeight: '600' }]} numberOfLines={1}>{compact ? it.short || it.label : it.label}</Text>
      {!compact && !!it.badge && <View style={sb.count}><Text style={sb.countText}>{it.badge}</Text></View>}
    </Pressable>
  );

  return (
    <View style={[sb.wrap, compact && { width: 92, paddingHorizontal: 8 }]} accessibilityRole={'navigation' as never}>
      <View style={[sb.brand, compact && { paddingHorizontal: 0, alignItems: 'center' }]}>{compact ? <BrandTile size={38} /> : <Logo size={30} />}</View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: 2, paddingBottom: 12 }} showsVerticalScrollIndicator={false}>
        {groups.map(([title, items]) => (
          <View key={title || 'main'} style={{ gap: 2, marginTop: title ? 18 : 0 }}>
            {!!title && !compact && <Text style={sb.groupTitle}>{title}</Text>}
            {!!title && compact && <View style={{ height: 1, backgroundColor: colors.line, marginHorizontal: 10, marginBottom: 8 }} />}
            {items.map(it => item(it, active === it.key))}
          </View>
        ))}
      </ScrollView>
      <View style={sb.bottom}>
        {item({ key: 'Notifications', label: 'Notifications', short: 'Alerts', icon: 'bell', badge: unreadNotifs }, route === 'Notifications')}
        <Pressable onPress={() => go({ key: 'Profile' })} accessibilityRole="link" accessibilityLabel="Profile and settings"
          style={(st: PState) => [sb.me, compact && { justifyContent: 'center', paddingHorizontal: 0 }, (route === 'Profile' || route === 'NotifSettings') ? sb.itemOn : st.hovered ? sb.itemHover : null]}>
          <Avatar name={user!.name} size={compact ? 36 : 34} />
          {!compact && <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={{ fontSize: 13.5, fontWeight: '600', color: colors.ink }} numberOfLines={1}>{user!.name}</Text>
            <Text style={{ fontSize: 12, color: colors.ink2 }} numberOfLines={1}>{user!.role === 'owner' ? 'Pet owner' : user!.role === 'staff' ? 'Clinic staff' : 'Administrator'}</Text>
          </View>}
        </Pressable>
        <Pressable onPress={() => confirm({ title: 'Log out?', ok: 'Log out', icon: 'logout', onOk: act.logout })} accessibilityRole="button" accessibilityLabel="Log out"
          style={(st: PState) => [compact ? sb.railItem : sb.item, st.hovered && sb.itemHover]}>
          <Icon name="logout" size={compact ? 20 : 18} color={colors.ink2} />
          <Text style={compact ? sb.railLabel : sb.label}>Log out</Text>
        </Pressable>
      </View>
    </View>
  );
}

const sb = StyleSheet.create({
  wrap: { width: 256, backgroundColor: colors.surface, borderRightWidth: 1, borderRightColor: colors.line, paddingHorizontal: 14, paddingTop: 22, paddingBottom: 14 },
  brand: { paddingHorizontal: 8, paddingBottom: 24 },
  groupTitle: { fontSize: 11.5, fontWeight: '600', color: colors.ink3, letterSpacing: 0.6, textTransform: 'uppercase', paddingHorizontal: 12, marginBottom: 6 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, height: 42, paddingHorizontal: 12, borderRadius: 10 },
  itemOn: { backgroundColor: colors.accentSoft },
  itemHover: { backgroundColor: '#F3F6FA' },
  label: { flex: 1, fontSize: 14.5, fontWeight: '500', color: colors.ink },
  railItem: { alignItems: 'center', justifyContent: 'center', gap: 4, height: 62, borderRadius: 12 },
  railLabel: { fontSize: 11, fontWeight: '500', color: colors.ink2, textAlign: 'center' },
  count: { minWidth: 20, height: 20, borderRadius: 10, paddingHorizontal: 6, backgroundColor: colors.accentDeep, alignItems: 'center', justifyContent: 'center' },
  countText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  dot: { position: 'absolute', top: -2, right: -4, width: 8, height: 8, borderRadius: 4, backgroundColor: colors.dot, borderWidth: 1.5, borderColor: '#fff' },
  bottom: { borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 10, gap: 2 },
  me: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 8, paddingVertical: 8, borderRadius: 10 },
});
