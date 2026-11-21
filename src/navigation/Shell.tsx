// Signed-in app frame.
// Pet owners: top navbar (OwnerNav) on every breakpoint.
// Staff and administrator on tablets and desktops: dark navy sidebar beside the page.
// Desktop (>= 1200 px): full sidebar with labels. Tablet (768–1199 px): compact icon rail.
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { NavigationContainerRefWithCurrent, StackActions } from '@react-navigation/native';
import { useApp, sel } from '../store/AppStore';
import { useBP, PState } from '../components/responsive';
import { Avatar } from '../components/ui';
import { BrandMark, Wordmark } from '../components/Brand';
import { Icon, IconName } from '../components/Icon';
import { useConfirm } from '../components/overlays';
import { sidebar, FONT } from '../theme';
import { billState } from '../utils/format';
import type { Role } from '../types';
import type { RootList } from './linking';
import { OwnerFrame } from './OwnerNav';

type Item = { key: string; label: string; icon: IconName; tab?: boolean; badge?: number; short?: string };

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
      { key: 'Users', label: 'Users & staff', short: 'Users', icon: 'users' },
      { key: 'ActivityLog', label: 'Activity log', short: 'Activity', icon: 'history' },
    ]],
  ];
}

export function Shell({ children, route, navRef }: { children: React.ReactNode; route: string; navRef: NavigationContainerRefWithCurrent<RootList> }) {
  const { user } = useApp(); const { bp } = useBP();
  if (user?.role === 'owner') return <OwnerFrame route={route} navRef={navRef}>{children}</OwnerFrame>;
  if (!user || bp === 'mobile') return <>{children}</>;
  return (
    <View style={{ flex: 1, flexDirection: 'row', backgroundColor: sidebar.bg }}>
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
      <Icon name={it.icon} size={compact ? 20 : 18} color={on ? sidebar.iconActive : sidebar.icon} strokeWidth={on ? 2.1 : 1.8} />
      {!compact && (
        <Text style={[sb.label, on && sb.labelOn]} numberOfLines={1}>{it.label}</Text>
      )}
      {compact && !!it.badge && <View style={sb.dot} />}
      {!compact && !!it.badge && (
        <View style={sb.count}><Text style={sb.countText}>{it.badge > 9 ? '9+' : it.badge}</Text></View>
      )}
      {compact && <Text style={[sb.railLabel, on && { color: sidebar.textActive }]} numberOfLines={1}>{it.short || it.label}</Text>}
    </Pressable>
  );

  return (
    <View style={[sb.wrap, compact && { width: 76, paddingHorizontal: 6 }]} accessibilityRole={'navigation' as never}>
      {/* Brand */}
      <View style={[sb.brand, compact && { justifyContent: 'center', paddingHorizontal: 0 }]}>
        {compact
          ? <BrandMark size={30} white />
          : <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <BrandMark size={28} white />
              <Wordmark size={17} light />
            </View>
        }
      </View>

      {/* Nav items */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: 2, paddingBottom: 12 }} showsVerticalScrollIndicator={false}>
        {groups.map(([title, items]) => (
          <View key={title || 'main'} style={{ gap: 2, marginTop: title ? 20 : 0 }}>
            {!!title && !compact && (
              <Text style={sb.groupTitle}>{title}</Text>
            )}
            {!!title && compact && (
              <View style={{ height: 1, backgroundColor: sidebar.border, marginHorizontal: 8, marginBottom: 6 }} />
            )}
            {items.map(it => item(it, active === it.key))}
          </View>
        ))}
      </ScrollView>

      {/* Bottom */}
      <View style={[sb.bottom, compact && { alignItems: 'center' }]}>
        {item({ key: 'Notifications', label: 'Notifications', short: 'Alerts', icon: 'bell', badge: unreadNotifs }, route === 'Notifications')}

        <Pressable onPress={() => go({ key: 'Profile' })} accessibilityRole="link" accessibilityLabel="Profile and settings"
          style={(st: PState) => [
            compact ? sb.meCompact : sb.me,
            (route === 'Profile' || route === 'NotifSettings') ? sb.itemOn : st.hovered ? sb.itemHover : null,
          ]}>
          <Avatar name={user!.name} size={compact ? 32 : 30} />
          {!compact && (
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ fontFamily: FONT, fontSize: 13, fontWeight: '600', color: sidebar.textActive }} numberOfLines={1}>{user!.name}</Text>
              <Text style={{ fontFamily: FONT, fontSize: 11, color: sidebar.text, marginTop: 1 }} numberOfLines={1}>
                {user!.role === 'staff' ? 'Clinic staff' : 'Administrator'}
              </Text>
            </View>
          )}
        </Pressable>

        <Pressable onPress={() => confirm({ title: 'Log out?', ok: 'Log out', icon: 'logout', onOk: act.logout })}
          accessibilityRole="button" accessibilityLabel="Log out"
          style={(st: PState) => [compact ? sb.railItem : sb.item, st.hovered ? sb.itemHover : null]}>
          <Icon name="logout" size={compact ? 18 : 17} color={sidebar.icon} />
          {!compact && <Text style={sb.label}>Log out</Text>}
          {compact && <Text style={sb.railLabel}>Log out</Text>}
        </Pressable>
      </View>
    </View>
  );
}

const sb = StyleSheet.create({
  wrap: {
    width: 240, backgroundColor: sidebar.bg,
    borderRightWidth: 1, borderRightColor: sidebar.border,
    paddingHorizontal: 10, paddingTop: 20, paddingBottom: 12,
  },
  brand: {
    paddingHorizontal: 6, paddingBottom: 22,
    borderBottomWidth: 1, borderBottomColor: sidebar.border,
    marginBottom: 10,
  },
  groupTitle: {
    fontFamily: FONT, fontSize: 10.5, fontWeight: '600',
    color: sidebar.textMuted, letterSpacing: 0.6,
    textTransform: 'uppercase', paddingHorizontal: 10, marginBottom: 4,
  },
  item: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    height: 38, paddingHorizontal: 10, borderRadius: 8,
  },
  itemOn: { backgroundColor: sidebar.itemActive },
  itemHover: { backgroundColor: sidebar.itemHover },
  label: {
    flex: 1, fontFamily: FONT, fontSize: 14, fontWeight: '500',
    color: sidebar.text,
  },
  labelOn: { color: sidebar.textActive, fontWeight: '600' },
  railItem: {
    alignItems: 'center', justifyContent: 'center',
    gap: 4, paddingVertical: 8, borderRadius: 10, minHeight: 56,
  },
  railLabel: {
    fontFamily: FONT, fontSize: 10.5, fontWeight: '500',
    color: sidebar.text, textAlign: 'center',
  },
  count: {
    minWidth: 20, height: 18, borderRadius: 9, paddingHorizontal: 5,
    backgroundColor: sidebar.badge, alignItems: 'center', justifyContent: 'center',
  },
  countText: { fontFamily: FONT, color: '#fff', fontSize: 10.5, fontWeight: '700' },
  dot: {
    position: 'absolute', top: 6, right: 10, width: 7, height: 7,
    borderRadius: 4, backgroundColor: '#EF4444',
    borderWidth: 1.5, borderColor: sidebar.bg,
  },
  bottom: {
    borderTopWidth: 1, borderTopColor: sidebar.border,
    paddingTop: 8, gap: 2,
  },
  me: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8,
  },
  meCompact: {
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: 8, borderRadius: 10,
  },
});
