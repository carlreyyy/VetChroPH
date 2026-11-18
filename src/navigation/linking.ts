// Browser URLs for every screen, so refresh, back/forward and direct links work on the web.
// Extra params (for example ?tab=follow or ?staff=1) are kept in the query string automatically.
import type { LinkingOptions } from '@react-navigation/native';

export const TITLES: Record<string, string> = {
  Welcome: 'Welcome', Login: 'Log in', SignUp: 'Create account', VerifyCode: 'Verify your number', ResetPassword: 'Reset password',
  Home: 'Home', Pets: 'My pets', Appointments: 'Appointments', Messages: 'Messages', More: 'More', Patients: 'Patients', Billing: 'Billing',
  Reports: 'Reports', Setup: 'Setup', Notifications: 'Notifications', Profile: 'Profile and settings', NotifSettings: 'Notification settings',
  PetDetail: 'Pet profile', PetForm: 'Pet details', VisitDetail: 'Visit record', Book: 'Book an appointment', BookSuccess: 'Appointment confirmed',
  ApptDetail: 'Appointment', BillDetail: 'Bill', Receipt: 'Receipt', ClinicInfo: 'Clinic', Chat: 'Conversation', PayBill: 'Pay bill',
  OwnerBills: 'Bills and receipts', ConsultForm: 'Consultation', OwnerDetail: 'Owner record', CareMonitor: 'Due and overdue', BillingList: 'Billing',
  CreateBill: 'New bill', Inbox: 'Messages', Users: 'Users and staff', UserForm: 'Account', ClinicProfile: 'Clinic profile', Services: 'Services and prices',
  Hours: 'Hours and time slots', Reminders: 'Reminder settings', PaymentSetup: 'Payment accounts', ActivityLog: 'Activity log',
};

export type RootList = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
export const linking: LinkingOptions<RootList> = {
  prefixes: [],
  config: {
    screens: {
      Welcome: '',
      Login: 'login',
      SignUp: 'signup',
      VerifyCode: 'signup/verify',
      ResetPassword: 'reset-password',
      Main: {
        screens: {
          Home: 'home', Pets: 'pets', Appointments: 'appointments', Messages: 'messages', More: 'more',
          Patients: 'patients', Billing: 'billing', Reports: 'reports', Setup: 'setup',
        },
      },
      Notifications: 'notifications',
      Profile: 'profile',
      NotifSettings: 'profile/notifications',
      PetDetail: 'pets/:id',
      PetForm: 'pet-form',
      VisitDetail: 'visits/:id',
      Book: 'book',
      BookSuccess: 'book/confirmed',
      ApptDetail: 'appointments/:id',
      BillDetail: 'bills/:id',
      Receipt: 'receipts/:id',
      ClinicInfo: 'clinic',
      Chat: 'chat',
      PayBill: 'pay',
      OwnerBills: 'bills',
      ConsultForm: 'consultation',
      OwnerDetail: 'owners/:id',
      CareMonitor: 'due-list',
      BillingList: 'billing/all',
      CreateBill: 'billing/new',
      Inbox: 'inbox',
      Users: 'admin/users',
      UserForm: 'admin/users/edit',
      ClinicProfile: 'admin/clinic',
      Services: 'admin/services',
      Hours: 'admin/hours',
      Reminders: 'admin/reminders',
      PaymentSetup: 'admin/payments',
      ActivityLog: 'admin/activity',
    },
  },
};
