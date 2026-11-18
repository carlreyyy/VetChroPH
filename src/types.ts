// Data shapes for the mock store. A real backend would return the same shapes.
export type Role = 'owner' | 'staff' | 'admin';
/** Consultation D5: dogs and cats first. */
export type Species = 'dog' | 'cat';

export interface NotifPrefs { push: boolean; sms: boolean; email: boolean; appt: boolean; care: boolean; pay: boolean; chat: boolean }
export interface User {
  id: string; name: string; role: Role; email: string; phone: string;
  status: 'active' | 'inactive'; ownerId?: string; pass: string; lastActive: string; prefs?: NotifPrefs;
}
export interface StaffNote { id: string; at: number; by: string; text: string }
export interface Owner {
  id: string; name: string; phone: string; email: string; address: string; since: string;
  /** Internal notes, visible to clinic roles only (consultation P5). Missed visits add a note here (D10). */
  notes: StaffNote[];
}
export interface Pet {
  id: string; ownerId: string; name: string; species: Species; breed: string; sex: 'Male' | 'Female';
  birth: string; weight: number; coat: string; status: 'active' | 'inactive' | 'deceased';
}
export interface Visit {
  id: string; petId: string; date: string; complaint: string; findings: string; diagnosis: string;
  treatment: string; medication: string; weight: number; vet: string; enteredBy?: string;
  /** Saved records can be edited; every edit is logged (consultation D17). */
  edits: { at: number; by: string }[];
}
/** Short notes on how a pet's condition is progressing (manuscript; consultation 2D). */
export interface ProgressNote { id: string; petId: string; date: string; text: string; by: string }
/**
 * Return visits and preventive-care due dates. The client asked that vaccine and deworming due dates be handled
 * through the same reminders instead of a separate module, so they are follow-up kinds here.
 */
export type FollowKind = 'Recheck' | 'Vaccination' | 'Deworming';
export interface FollowUp {
  id: string; petId: string; kind: FollowKind; date: string; reason: string; notes: string; status: 'open' | 'done'; setBy: string;
}
/** Consultation D8: bookings are confirmed automatically when the slot is free, so there is no Pending status. */
export type ApptStatus = 'confirmed' | 'resched' | 'checked_in' | 'completed' | 'cancelled' | 'missed';
export interface Appt {
  id: string; petId: string; ownerId: string; service: string; date: string; time: string;
  status: ApptStatus; reason: string; by: 'owner' | 'staff'; note?: string; offer?: { date: string; time: string };
  handledBy?: string;
}
export interface BillItem { name: string; price: number; qty: number }
export type PayMethod = 'Cash' | 'GCash' | 'Other e-wallet' | 'Bank transfer';
export interface Payment {
  id: string; method: PayMethod; amount: number; ref: string; proof: string;
  status: 'pending' | 'confirmed' | 'rejected'; date: string; by: string; verifiedBy?: string; reason?: string;
}
export interface Bill {
  id: string; petId: string; ownerId: string; apptId: string | null; date: string; items: BillItem[]; payments: Payment[];
}
export interface Doc { id: string; petId: string; name: string; kind: string; size: string; date: string; by: string }
export interface Service { id: string; name: string; category: string; price: number; minutes: number; active: boolean }
export interface Notif {
  id: string; at: number; unread: boolean; title: string; body: string; icon: string; tone: '' | 'ok' | 'warn' | 'bad';
  link?: { screen: string; params?: Record<string, string> };
}
export interface Msg { id: string; at: number; from: 'owner' | 'clinic'; by: string; text: string; read: boolean }
export interface Activity { id: string; at: number; who: string; text: string }
export interface DayHours { open: boolean; from: number; to: number }
/** Payment accounts the clinic accepts (consultation D12: GCash QR, other e-wallet QR, bank transfer). */
export interface PayAccount { id: string; kind: Exclude<PayMethod, 'Cash'>; provider: string; accountName: string; number: string; on: boolean; qrSeed: number }
export interface Clinic {
  name: string; address: string; phone: string; mobile: string; email: string; about: string;
  lat: number; lng: number; payUpdated: string; accounts: PayAccount[];
}
export interface Reminder { id: string; name: string; desc: string; on: boolean; when: string[] }
export interface Settings {
  slotMinutes: number; lunch: [number, number]; cancelCutoffHours: number; bookAheadDays: number;
  days: Record<number, DayHours>; reminders: Reminder[]; channels: { push: boolean; sms: boolean; email: boolean };
}
export interface DB {
  clinic: Clinic; settings: Settings; users: User[]; owners: Owner[]; pets: Pet[]; visits: Visit[]; notes: ProgressNote[];
  followups: FollowUp[]; appts: Appt[]; bills: Bill[]; docs: Doc[]; services: Service[];
  notifs: Record<string, Notif[]>; activity: Activity[]; messages: Record<string, Msg[]>;
}
