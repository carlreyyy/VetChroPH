import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp, sel } from '../store/AppStore';
import { colors, FONT } from '../theme';
import { Icon, IconName } from '../components/Icon';
import type { Role } from '../types';

import { Welcome, Login, SignUp, VerifyCode, ResetPassword, AuthFrame } from '../screens/auth';
import { useBP } from '../components/responsive';
import { Notifications, NotifSettings, Profile } from '../screens/common';
import { OwnerHome, OwnerPets, OwnerAppts, OwnerBills, ClinicInfo } from '../screens/owner';
import { useOwnerBadges } from './OwnerNav';
import { TAB_BAR_H } from '../components/ui';
import { PetDetail, PetForm, VisitDetail, ConsultForm } from '../screens/pets';
import { Book, BookSuccess, ApptDetail, ClinicAppts } from '../screens/appointments';
import { BillDetail, PayBill, Receipt, Billing, CreateBill } from '../screens/billing';
import { StaffHome, Patients, OwnerDetail, CareMonitor } from '../screens/clinic';
import { Inbox, Chat, OwnerChat } from '../screens/messages';
import { AdminHome, Reports, Setup, Users, UserForm, ClinicProfile, Services, Hours, Reminders, PaymentSetup, ActivityLog } from '../screens/admin';

const Stack = createNativeStackNavigator();
// Auth pages share a split layout on desktops (brand panel + form). Defined once so screen identity stays stable.
const framed = (C: React.ComponentType) => function Framed() { return <AuthFrame><C /></AuthFrame>; };
const [FWelcome, FLogin, FSignUp, FVerify, FReset] = [Welcome, Login, SignUp, VerifyCode, ResetPassword].map(framed);
const Tab = createBottomTabNavigator();

type TabDef = [name: string, label: string, icon: IconName, component: React.ComponentType];
const TABS: Record<Role, TabDef[]> = {
  owner: [['Home', 'Home', 'home', OwnerHome], ['Pets', 'Pets', 'paw', OwnerPets], ['Appointments', 'Visits', 'calendar', OwnerAppts], ['Messages', 'Messages', 'chat', OwnerChat], ['Bills', 'Bills', 'receipt', OwnerBills]],
  staff: [['Home', 'Today', 'home', StaffHome], ['Appointments', 'Schedule', 'calendar', ClinicAppts], ['Patients', 'Patients', 'paw', Patients], ['Messages', 'Messages', 'chat', Inbox], ['Billing', 'Billing', 'wallet', Billing]],
  admin: [['Home', 'Overview', 'home', AdminHome], ['Appointments', 'Schedule', 'calendar', ClinicAppts], ['Patients', 'Patients', 'paw', Patients], ['Reports', 'Reports', 'chart', Reports], ['Setup', 'Setup', 'sliders', Setup]],
};

function TabBar({ state, navigation }: BottomTabBarProps) {
  const { user, db } = useApp();
  const insets = useSafeAreaInsets(); const { wide } = useBP(); const ownerBadges = useOwnerBadges();
  const tabs = TABS[user!.role];
  if (wide) return null; // tablets and desktops use the owner navbar or the clinic sidebar (Shell)
  const badge = (name: string) => {
    if (user!.role === 'owner') return (ownerBadges[name] || 0) > 0;
    if (name === 'Messages') return sel.unreadMsgs(db, user!) > 0;
    return name === 'Billing' && db.bills.some(b => b.payments.some(p => p.status === 'pending'));
  };
  return (
    <View style={[ts.wrap, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      <View style={ts.bar} accessibilityRole="tablist">
        {state.routes.map((r, i) => {
          const def = tabs.find(t => t[0] === r.name)!; const on = state.index === i;
          return (
            <Pressable key={r.key} accessibilityRole="tab" accessibilityLabel={def[1]} accessibilityState={{ selected: on }}
              onPress={() => { if (!on) navigation.navigate(r.name); }} style={({ pressed }) => [ts.item, pressed && { opacity: 0.6 }]}>
              <View style={[ts.pill, on && { backgroundColor: colors.accentSoft }]}>
                <Icon name={def[2]} size={22} color={on ? colors.accentDeep : colors.ink2} strokeWidth={on ? 2.2 : 1.8} />
                {badge(r.name) && <View style={ts.dot} />}
              </View>
              <Text style={[ts.label, on && { color: colors.accentDeep, fontWeight: '600' }]} numberOfLines={1}>{def[1]}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function MainTabs() {
  const { user } = useApp();
  return (
    <Tab.Navigator key={user!.id} tabBar={p => <TabBar {...p} />} screenOptions={{ headerShown: false }}>
      {TABS[user!.role].map(([name, , , C]) => <Tab.Screen key={name} name={name} component={C} />)}
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  const { user } = useApp(); const { wide } = useBP();
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: wide ? 'none' : 'slide_from_right', contentStyle: { backgroundColor: colors.bg } }}>
      {!user ? (
        <>
          <Stack.Screen name="Welcome" component={FWelcome} />
          <Stack.Screen name="Login" component={FLogin} />
          <Stack.Screen name="SignUp" component={FSignUp} />
          <Stack.Screen name="VerifyCode" component={FVerify} />
          <Stack.Screen name="ResetPassword" component={FReset} />
        </>
      ) : (
        <>
          <Stack.Screen name="Main" component={MainTabs} />
          {/* shared */}
          <Stack.Screen name="Notifications" component={Notifications} />
          <Stack.Screen name="Profile" component={Profile} />
          <Stack.Screen name="NotifSettings" component={NotifSettings} />
          <Stack.Screen name="PetDetail" component={PetDetail} />
          <Stack.Screen name="PetForm" component={PetForm} />
          <Stack.Screen name="VisitDetail" component={VisitDetail} />
          <Stack.Screen name="Book" component={Book} />
          <Stack.Screen name="BookSuccess" component={BookSuccess} options={{ animation: 'fade' }} />
          <Stack.Screen name="ApptDetail" component={ApptDetail} />
          <Stack.Screen name="BillDetail" component={BillDetail} />
          <Stack.Screen name="Receipt" component={Receipt} />
          <Stack.Screen name="ClinicInfo" component={ClinicInfo} />
          <Stack.Screen name="Chat" component={Chat} />
          {/* pet owner */}
          <Stack.Screen name="PayBill" component={PayBill} />
          {/* clinic (staff and administrator) */}
          <Stack.Screen name="ConsultForm" component={ConsultForm} />
          <Stack.Screen name="OwnerDetail" component={OwnerDetail} />
          <Stack.Screen name="CareMonitor" component={CareMonitor} />
          <Stack.Screen name="BillingList" component={Billing} />
          <Stack.Screen name="CreateBill" component={CreateBill} />
          <Stack.Screen name="Inbox" component={Inbox} />
          {/* administrator */}
          <Stack.Screen name="Users" component={Users} />
          <Stack.Screen name="UserForm" component={UserForm} />
          <Stack.Screen name="ClinicProfile" component={ClinicProfile} />
          <Stack.Screen name="Services" component={Services} />
          <Stack.Screen name="Hours" component={Hours} />
          <Stack.Screen name="Reminders" component={Reminders} />
          <Stack.Screen name="PaymentSetup" component={PaymentSetup} />
          <Stack.Screen name="ActivityLog" component={ActivityLog} />
        </>
      )}
    </Stack.Navigator>
  );
}

const ts = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: colors.surface, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.lineStrong, alignItems: 'center' },
  bar: { width: '100%', maxWidth: 560, height: TAB_BAR_H, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4 },
  item: { flex: 1, height: TAB_BAR_H - 4, alignItems: 'center', justifyContent: 'center', gap: 3 },
  pill: { width: 52, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  label: { fontFamily: FONT, color: colors.ink2, fontWeight: '500', fontSize: 11 },
  dot: { position: 'absolute', top: 3, right: 12, width: 8, height: 8, borderRadius: 4, backgroundColor: colors.dot, borderWidth: 1.5, borderColor: '#fff' },
});
