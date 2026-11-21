// Pet Owner app frame.
//   Tablets and desktops (>= 768 px): a top navbar on every page. Logo, the five sections, then notifications and an
//   account menu. Its inner edges line up with the page content.
//   Phones: a slim top bar (logo, notifications, profile) above the five tab pages. The bottom tab bar comes from
//   RootNavigator, and detail pages keep their own back header.
// The tree has the same shape on every breakpoint and route, so the navigator below never remounts.
import React, { useState } from 'react';
import { Linking, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { NavigationContainerRefWithCurrent, StackActions } from '@react-navigation/native';
import { SafeAreaInsetsContext, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp, sel } from '../store/AppStore';
import { useBP, pageMax, pagePad, PState } from '../components/responsive';
import { Avatar, CountBadge, IconBtn } from '../components/ui';
import { Logo } from '../components/Brand';
import { Icon, IconName } from '../components/Icon';
import { useConfirm } from '../components/overlays';
import { colors, shadowPop, type, FONT } from '../theme';
import { billState } from '../utils/format';
import type { RootList } from './linking';

export const OWNER_TABS = ['Home', 'Pets', 'Appointments', 'Messages', 'Bills'] as const;
const NAV_H = 64;
const BAR_H = 56;

/** Detail screens and the section they belong to, so the right link stays highlighted. */
const SECTION: Record<string, string> = {
  PetDetail: 'Pets', PetForm: 'Pets', VisitDetail: 'Pets',
  ApptDetail: 'Appointments', Book: 'Appointments', BookSuccess: 'Appointments',
  Chat: 'Messages', BillDetail: 'Bills', PayBill: 'Bills', Receipt: 'Bills',
};

/** Badge counts for the owner's sections, shared by the navbar and the bottom tab bar. */
export function useOwnerBadges() {
  const { db, user, act } = useApp();
  const oid = user?.ownerId;
  return {
    Messages: user ? sel.unreadMsgs(db, user) : 0,
    Appointments: db.appts.filter(a => a.ownerId === oid && a.status === 'resched').length,
    Bills: db.bills.filter(b => b.ownerId === oid && billState(b) === 'unpaid').length,
    notifs: (db.notifs[act.inboxKey()] || []).filter(n => n.unread).length,
  } as Record<string, number>;
}

type Nav = NavigationContainerRefWithCurrent<RootList>;

export function OwnerFrame({ children, route, navRef }: { children: React.ReactNode; route: string; navRef: Nav }) {
  const insets = useSafeAreaInsets(); const { wide } = useBP();
  const onTab = (OWNER_TABS as readonly string[]).includes(route);
  const bar = wide ? <TopNav route={route} navRef={navRef} /> : onTab ? <AppBar navRef={navRef} /> : null;
  // The bar handles the top safe-area inset, so pages below must not add it again.
  const inner = bar ? { ...insets, top: 0 } : insets;
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {bar}
      <SafeAreaInsetsContext.Provider value={inner}>
        <View style={{ flex: 1, minHeight: 0 }}>{children}</View>
      </SafeAreaInsetsContext.Provider>
    </View>
  );
}

const goTab = (navRef: Nav, key: string) => navRef.current?.navigate('Main', { screen: key });
/** Opens a top-level page from the navbar without piling it on top of a detail page. */
const goScreen = (navRef: Nav, key: string) => {
  const nav = navRef.current; if (!nav) return;
  // Only the root stack can pop to top. canGoBack() is also true when the tab navigator has history.
  if ((nav.getRootState()?.routes.length || 0) > 1) nav.dispatch(StackActions.popToTop());
  nav.navigate(key);
};

function TopNav({ route, navRef }: { route: string; navRef: Nav }) {
  const { user } = useApp(); const { bp, width, desktop } = useBP(); const insets = useSafeAreaInsets();
  const badges = useOwnerBadges(); const [menu, setMenu] = useState(false);
  const active = SECTION[route] || route;
  const padX = pagePad(bp); const maxW = pageMax(bp, true)!;
  const items: [key: string, label: string][] = [['Home', 'Home'], ['Pets', 'Pets'], ['Appointments', desktop ? 'Appointments' : 'Visits'], ['Messages', 'Messages'], ['Bills', 'Bills']];
  return (
    <View style={[n.wrap, { paddingTop: insets.top }]} accessibilityRole={'navigation' as never}>
      <View style={[n.inner, { maxWidth: maxW, paddingHorizontal: padX }]}>
        <Pressable onPress={() => goTab(navRef, 'Home')} accessibilityRole="link" accessibilityLabel="VetChroPH home" style={{ marginRight: desktop ? 40 : 24 }}>
          <Logo size={28} />
        </Pressable>
        <View style={n.links}>
          {items.map(([key, label]) => {
            const on = active === key; const count = badges[key] || 0;
            return (
              <Pressable key={key} onPress={() => goTab(navRef, key)} accessibilityRole="link" accessibilityLabel={count ? `${label}, ${count} new` : label} accessibilityState={{ selected: on }}
                style={(st: PState) => [n.link, !on && st.hovered && { backgroundColor: colors.hover }]}>
                <Text style={[n.linkText, on && n.linkOn]} numberOfLines={1}>{label}</Text>
                <CountBadge n={count} />
                {on && <View style={n.underline} />}
              </Pressable>
            );
          })}
        </View>
        <View style={n.right}>
          <IconBtn name="bell" label="Notifications" count={badges.notifs} onPress={() => goScreen(navRef, 'Notifications')} />
          <Pressable onPress={() => setMenu(true)} accessibilityRole="button" accessibilityLabel="Account menu" accessibilityState={{ expanded: menu }}
            style={(st: PState) => [n.me, (menu || st.hovered) && { backgroundColor: colors.hover }, (route === 'Profile' || route === 'NotifSettings') && { backgroundColor: colors.accentSoft }]}>
            <Avatar name={user!.name} size={32} />
            <Icon name="chevD" size={16} color={colors.ink2} />
          </Pressable>
        </View>
      </View>
      <AccountMenu visible={menu} onClose={() => setMenu(false)} navRef={navRef} top={insets.top + NAV_H - 4} right={Math.max(0, (width - Math.min(width, maxW)) / 2) + padX} />
    </View>
  );
}

function AccountMenu({ visible, onClose, navRef, top, right }: { visible: boolean; onClose: () => void; navRef: Nav; top: number; right: number }) {
  const { user, db, act } = useApp(); const confirm = useConfirm();
  const pick = (fn: () => void) => () => { onClose(); fn(); };
  const item = (icon: IconName, label: string, fn: () => void, danger?: boolean) => (
    <Pressable key={label} onPress={pick(fn)} accessibilityRole="menuitem" style={(st: PState) => [n.mItem, st.hovered && { backgroundColor: colors.hover }]}>
      <Icon name={icon} size={18} color={danger ? colors.bad : colors.ink2} />
      <Text style={[n.mText, danger && { color: colors.bad }]}>{label}</Text>
    </Pressable>
  );
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close menu" />
      <View style={[n.menu, { top, right }]} accessibilityRole={'menu' as never}>
        <View style={n.mHead}>
          <Avatar name={user!.name} size={40} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={type.h3} numberOfLines={1}>{user!.name}</Text>
            <Text style={[type.small, { fontSize: 12.5 }]} numberOfLines={1}>{user!.email}</Text>
          </View>
        </View>
        <View style={n.mLine} />
        {item('user', 'Profile and settings', () => goScreen(navRef, 'Profile'))}
        {item('gear', 'Notification settings', () => goScreen(navRef, 'NotifSettings'))}
        {item('pin', 'Clinic information', () => goScreen(navRef, 'ClinicInfo'))}
        {item('phone', 'Call the clinic', () => Linking.openURL(`tel:${db.clinic.mobile.replace(/\s/g, '')}`))}
        <View style={n.mLine} />
        {item('logout', 'Log out', () => confirm({ title: 'Log out?', body: 'You can log back in with your email and password, or a code sent to your mobile number.', ok: 'Log out', icon: 'logout', onOk: act.logout }), true)}
      </View>
    </Modal>
  );
}

/** Phone top bar on the five tab pages. */
function AppBar({ navRef }: { navRef: Nav }) {
  const { user } = useApp(); const insets = useSafeAreaInsets(); const badges = useOwnerBadges();
  return (
    <View style={[n.bar, { paddingTop: insets.top }]}>
      <View style={n.barInner}>
        <Pressable onPress={() => goTab(navRef, 'Home')} accessibilityRole="link" accessibilityLabel="VetChroPH home" style={{ flex: 1 }}>
          <Logo size={24} />
        </Pressable>
        <IconBtn name="bell" label="Notifications" count={badges.notifs} onPress={() => goScreen(navRef, 'Notifications')} />
        <Pressable onPress={() => goScreen(navRef, 'Profile')} accessibilityRole="button" accessibilityLabel="Profile and settings" hitSlop={6} style={{ marginLeft: 4 }}>
          <Avatar name={user!.name} size={32} />
        </Pressable>
      </View>
    </View>
  );
}

const n = StyleSheet.create({
  wrap:      { backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.line, zIndex: 10 },
  inner:     { width: '100%', alignSelf: 'center', height: NAV_H, flexDirection: 'row', alignItems: 'center' },
  links:     { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 0, height: '100%' },
  link:      { height: 36, paddingHorizontal: 12, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 6 },
  linkText:  { fontFamily: FONT, fontSize: 14, fontWeight: '500', color: colors.ink2 },
  linkOn:    { color: colors.teal, fontWeight: '600' },
  underline: { position: 'absolute', left: 12, right: 12, bottom: -13, height: 2.5, borderRadius: 2, backgroundColor: colors.teal },
  right:     { flexDirection: 'row', alignItems: 'center', gap: 4 },
  me:        { flexDirection: 'row', alignItems: 'center', gap: 4, paddingLeft: 6, paddingRight: 8, height: 38, borderRadius: 10 },
  menu:      { position: 'absolute', width: 272, backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.line, paddingVertical: 6, ...shadowPop },
  mHead:     { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 10 },
  mLine:     { height: 1, backgroundColor: colors.line, marginVertical: 4 },
  mItem:     { flexDirection: 'row', alignItems: 'center', gap: 12, height: 40, paddingHorizontal: 14, marginHorizontal: 6, borderRadius: 8 },
  mText:     { fontFamily: FONT, fontSize: 14, fontWeight: '500', color: colors.ink },
  bar:       { backgroundColor: colors.surface, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.lineStrong },
  barInner:  { height: BAR_H, flexDirection: 'row', alignItems: 'center', gap: 4, paddingLeft: 16, paddingRight: 12 },
});
