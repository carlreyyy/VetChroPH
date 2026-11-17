// Sample records for the prototype. Every date is relative to the day the app is opened.
// Replace seedDB() with API calls when the backend is ready.
import type { Appt, Bill, DB, FollowUp, NotifPrefs, Visit } from '../types';
import { D } from '../utils/format';

const hoursAgo = (h: number) => Date.now() - h * 36e5;
const VET = 'Dr. Elena Ybañez';
export const DEFAULT_PREFS: NotifPrefs = { push: true, sms: true, email: false, appt: true, care: true, pay: true, chat: true };

export function seedDB(): DB {
  const db: DB = {
    clinic: {
      name: 'Sugbo Pet Care Clinic',
      address: 'Lot 12, Sampaguita St., Brgy. Capitol Site, Cebu City 6000',
      phone: '(032) 555 0188', mobile: '0917 555 0188', email: 'hello@sugbopetcare.example',
      about: 'A neighborhood clinic for dogs and cats. Booking ahead keeps waiting short.',
      lat: 10.3157, lng: 123.8854, payUpdated: D(-20),
      accounts: [
        { id: 'pa1', kind: 'GCash', provider: 'GCash', accountName: 'Sugbo Pet Care Clinic', number: '0917 555 0188', on: true, qrSeed: 7 },
        { id: 'pa2', kind: 'Other e-wallet', provider: 'Maya', accountName: 'Sugbo Pet Care Clinic', number: '0917 555 0188', on: true, qrSeed: 13 },
        { id: 'pa3', kind: 'Bank transfer', provider: 'BDO', accountName: 'Sugbo Pet Care Clinic', number: '0012 3456 7890', on: true, qrSeed: 0 },
      ],
    },
    settings: {
      slotMinutes: 30, lunch: [12, 13], cancelCutoffHours: 24, bookAheadDays: 30,
      days: {
        0: { open: true, from: 9, to: 13 }, 1: { open: true, from: 8, to: 18 }, 2: { open: true, from: 8, to: 18 },
        3: { open: true, from: 8, to: 18 }, 4: { open: true, from: 8, to: 18 }, 5: { open: true, from: 8, to: 18 },
        6: { open: true, from: 8, to: 17 },
      },
      channels: { push: true, sms: true, email: true },
      reminders: [
        { id: 'r1', name: 'Appointment reminder', desc: 'Sent to the owner before a confirmed visit', on: true, when: ['1 day before', '2 hours before'] },
        { id: 'r2', name: 'Follow-up and preventive care', desc: 'Return visits, vaccines and deworming coming due', on: true, when: ['3 days before', 'When overdue'] },
        { id: 'r3', name: 'Booking updates', desc: 'Confirmed, new time offered or cancelled', on: true, when: ['Immediately'] },
        { id: 'r4', name: 'Payment updates', desc: 'Payment confirmed or not confirmed', on: true, when: ['Immediately'] },
      ],
    },
    users: [
      { id: 'u1', name: 'Maria Santos', role: 'owner', email: 'maria.santos@example.com', phone: '0917 555 0142', status: 'active', ownerId: 'o1', pass: 'demo1234', lastActive: D(0), prefs: { ...DEFAULT_PREFS } },
      { id: 'u2', name: 'Lea Ramirez', role: 'staff', email: 'lea@sugbopetcare.example', phone: '0917 555 0201', status: 'active', pass: 'demo1234', lastActive: D(0) },
      { id: 'u3', name: VET, role: 'admin', email: 'elena@sugbopetcare.example', phone: '0917 555 0188', status: 'active', pass: 'demo1234', lastActive: D(0) },
      { id: 'u5', name: 'Marco Pacaña', role: 'staff', email: 'marco@sugbopetcare.example', phone: '0917 555 0203', status: 'active', pass: 'demo1234', lastActive: D(-1) },
      { id: 'u6', name: 'Trisha Go', role: 'staff', email: 'trisha@sugbopetcare.example', phone: '0917 555 0204', status: 'inactive', pass: 'demo1234', lastActive: D(-60) },
      { id: 'u7', name: 'Joanne Tan', role: 'owner', email: 'joanne.tan@example.com', phone: '0918 555 0119', status: 'active', ownerId: 'o2', pass: 'demo1234', lastActive: D(-3), prefs: { ...DEFAULT_PREFS } },
      { id: 'u8', name: 'Ramon Gonzales', role: 'owner', email: 'ramon.g@example.com', phone: '0922 555 0167', status: 'active', ownerId: 'o3', pass: 'demo1234', lastActive: D(-2), prefs: { ...DEFAULT_PREFS } },
      { id: 'u9', name: 'Aileen Uy', role: 'owner', email: 'aileen.uy@example.com', phone: '0905 555 0138', status: 'active', ownerId: 'o4', pass: 'demo1234', lastActive: D(-4), prefs: { ...DEFAULT_PREFS } },
      { id: 'u10', name: 'Paolo Lim', role: 'owner', email: 'paolo.lim@example.com', phone: '0939 555 0121', status: 'active', ownerId: 'o5', pass: 'demo1234', lastActive: D(-9), prefs: { ...DEFAULT_PREFS } },
      { id: 'u11', name: 'Carlo Dela Peña', role: 'owner', email: 'carlo.dp@example.com', phone: '0928 555 0173', status: 'active', ownerId: 'o6', pass: 'demo1234', lastActive: D(-12), prefs: { ...DEFAULT_PREFS } },
    ],
    owners: [
      { id: 'o1', name: 'Maria Santos', phone: '0917 555 0142', email: 'maria.santos@example.com', address: 'Banilad, Cebu City', since: D(-420), notes: [] },
      { id: 'o2', name: 'Joanne Tan', phone: '0918 555 0119', email: 'joanne.tan@example.com', address: 'Lahug, Cebu City', since: D(-380), notes: [] },
      { id: 'o3', name: 'Ramon Gonzales', phone: '0922 555 0167', email: 'ramon.g@example.com', address: 'Mabolo, Cebu City', since: D(-300), notes: [{ id: 'sn1', at: hoursAgo(24 * 40), by: 'Lea Ramirez', text: 'Prefers a call over text for reminders.' }] },
      { id: 'o4', name: 'Aileen Uy', phone: '0905 555 0138', email: 'aileen.uy@example.com', address: 'Guadalupe, Cebu City', since: D(-250), notes: [] },
      { id: 'o5', name: 'Paolo Lim', phone: '0939 555 0121', email: 'paolo.lim@example.com', address: 'Capitol Site, Cebu City', since: D(-210), notes: [] },
      { id: 'o6', name: 'Carlo Dela Peña', phone: '0928 555 0173', email: 'carlo.dp@example.com', address: 'Talamban, Cebu City', since: D(-12), notes: [] },
    ],
    pets: [
      { id: 'p1', ownerId: 'o1', name: 'Bingo', species: 'dog', breed: 'Golden Retriever', sex: 'Male', birth: D(-1130), weight: 14.2, coat: 'golden', status: 'active' },
      { id: 'p2', ownerId: 'o1', name: 'Mochi', species: 'cat', breed: 'Domestic shorthair', sex: 'Female', birth: D(-790), weight: 4.1, coat: 'orange', status: 'active' },
      { id: 'p3', ownerId: 'o2', name: 'Luna', species: 'cat', breed: 'British Shorthair', sex: 'Female', birth: D(-1500), weight: 3.8, coat: 'calico', status: 'active' },
      { id: 'p4', ownerId: 'o2', name: 'Max', species: 'dog', breed: 'Pug', sex: 'Male', birth: D(-2200), weight: 8.1, coat: 'bw', status: 'active' },
      { id: 'p5', ownerId: 'o3', name: 'Brutus', species: 'dog', breed: 'Rottweiler', sex: 'Male', birth: D(-700), weight: 26.4, coat: 'tan', status: 'active' },
      { id: 'p6', ownerId: 'o4', name: 'Coco', species: 'dog', breed: 'Pomeranian', sex: 'Female', birth: D(-540), weight: 3.2, coat: 'cream', status: 'active' },
      { id: 'p7', ownerId: 'o5', name: 'Choco', species: 'dog', breed: 'Poodle', sex: 'Male', birth: D(-900), weight: 6.1, coat: 'brown', status: 'active' },
      { id: 'p8', ownerId: 'o5', name: 'Nala', species: 'cat', breed: 'Gray tabby', sex: 'Female', birth: D(-460), weight: 3.2, coat: 'gray', status: 'active' },
      { id: 'p9', ownerId: 'o6', name: 'Kiko', species: 'dog', breed: 'Dachshund', sex: 'Male', birth: D(-300), weight: 9.8, coat: 'cream', status: 'active' },
      { id: 'p10', ownerId: 'o4', name: 'Tomtom', species: 'cat', breed: 'Tabby (Puspin)', sex: 'Male', birth: D(-3900), weight: 4.6, coat: 'black', status: 'deceased' },
    ],
    visits: [] as Visit[], notes: [], followups: [] as FollowUp[], appts: [] as Appt[], bills: [] as Bill[], docs: [],
    services: [
      { id: 's1', name: 'General Consultation', category: 'Consultation', price: 350, minutes: 30, active: true },
      { id: 's2', name: 'Follow-up Check', category: 'Consultation', price: 200, minutes: 20, active: true },
      { id: 's3', name: 'Wellness Check-up', category: 'Consultation', price: 450, minutes: 30, active: true },
      { id: 's4', name: 'Vaccination (5-in-1)', category: 'Preventive care', price: 650, minutes: 20, active: true },
      { id: 's9', name: 'Vaccination (4-in-1)', category: 'Preventive care', price: 600, minutes: 20, active: true },
      { id: 's5', name: 'Anti-rabies Vaccine', category: 'Preventive care', price: 350, minutes: 15, active: true },
      { id: 's6', name: 'Deworming', category: 'Preventive care', price: 250, minutes: 15, active: true },
      { id: 's7', name: 'Minor Procedure', category: 'Procedures', price: 500, minutes: 30, active: true },
      { id: 's8', name: 'Wound Care & Dressing', category: 'Procedures', price: 300, minutes: 20, active: true },
    ],
    notifs: {}, activity: [], messages: {},
  };

  const V = (id: string, petId: string, date: string, complaint: string, findings: string, diagnosis: string, treatment: string, medication: string, weight: number): Visit =>
    ({ id, petId, date, complaint, findings, diagnosis, treatment, medication, weight, vet: VET, edits: [] });
  db.visits = [
    V('v1', 'p1', D(-360), 'Annual check-up', 'Healthy, active, good coat. Mild tartar on the teeth.', 'Healthy adult dog', 'Physical exam. Anti-rabies and 5-in-1 vaccines given.', 'None', 13.8),
    V('v2', 'p1', D(-120), 'Itching and red patches on the belly', 'Redness and scratch marks on the abdomen. No fleas found.', 'Mild allergic dermatitis', 'Skin cleaned in clinic. Medicated bath advised.', 'Antihistamine, once daily for 5 days', 14.0),
    V('v3', 'p1', D(-45), 'Skin recheck', 'Skin clear, no new patches.', 'Dermatitis resolved', 'No further treatment. Deworming given.', 'Deworming tablet, single dose', 14.1),
    { ...V('v4', 'p1', D(-2), 'Shaking head, scratching left ear', 'Redness and mild odor in the left ear canal.', 'Mild otitis externa (left ear)', 'Ear cleaning done in clinic.', 'Ear drops, 2 drops twice daily for 7 days', 14.2), edits: [{ at: hoursAgo(40), by: VET }] },
    V('v5', 'p2', D(-200), 'Wellness check', 'Bright and alert. Normal appetite.', 'Healthy adult cat', 'Physical exam. 4-in-1 vaccine and deworming given.', 'Deworming tablet, single dose', 3.9),
    V('v6', 'p2', D(-30), 'Vomiting for two days', 'Mild abdominal tenderness. Slightly dehydrated.', 'Mild gastritis', 'Fluids under the skin. Bland diet for 3 days.', 'Anti-nausea syrup, 3 days', 4.0),
    V('v7', 'p3', D(0), 'Yearly wellness check', 'Healthy, good weight.', 'Healthy adult cat', 'Physical exam and deworming.', 'Deworming tablet', 3.8),
    V('v8', 'p4', D(-70), 'Eye discharge', 'Mild tear staining with clear discharge.', 'Conjunctival irritation', 'Eye wash shown to owner.', 'Eye drops, 5 days', 8.0),
    V('v9', 'p5', D(-95), 'Limping on right hind leg', 'Mild pain on the hip. No swelling.', 'Muscle strain', 'Rest for one week.', 'Pain relief, 5 days', 25.8),
    V('v10', 'p7', D(-150), 'Skin check', 'Skin healthy.', 'Healthy adult dog', 'Physical exam.', 'None', 6.0),
    { id: 'v11', petId: 'p5', date: D(0), complaint: 'Slight cough since yesterday', findings: '', diagnosis: '', treatment: '', medication: '', weight: 0, vet: VET, enteredBy: 'Lea Ramirez', edits: [] },
  ];

  db.notes = [
    { id: 'pn1', petId: 'p1', date: D(-2), text: 'Left ear red with mild odor. Started ear drops.', by: VET },
    { id: 'pn2', petId: 'p1', date: D(0), text: 'Owner reports less head shaking after two days of drops.', by: VET },
    { id: 'pn3', petId: 'p2', date: D(-28), text: 'Eating normally again. Stool firm.', by: VET },
  ];

  const F = (id: string, petId: string, kind: FollowUp['kind'], date: string, reason: string, notes = '', status: FollowUp['status'] = 'open'): FollowUp =>
    ({ id, petId, kind, date, reason, notes, status, setBy: VET });
  db.followups = [
    F('f1', 'p1', 'Recheck', D(-30), 'Skin recheck', 'Check that the patches are gone.', 'done'),
    F('f2', 'p2', 'Recheck', D(3), 'Recheck appetite and stool after gastritis', 'Bring a stool sample if possible.'),
    F('f3', 'p4', 'Recheck', D(-4), 'Eye recheck'),
    F('f4', 'p5', 'Recheck', D(9), 'Hip recheck', 'Observe gait first.'),
    F('f5', 'p1', 'Recheck', D(7), 'Ear recheck after treatment'),
    F('f6', 'p1', 'Vaccination', D(3), 'Anti-rabies booster'), F('f7', 'p1', 'Vaccination', D(25), '5-in-1 (DHPPi) booster'),
    F('f8', 'p1', 'Deworming', D(45), 'Deworming'), F('f9', 'p2', 'Deworming', D(-20), 'Deworming'),
    F('f10', 'p2', 'Vaccination', D(115), '4-in-1 (Feline) booster'), F('f11', 'p3', 'Vaccination', D(25), '4-in-1 (Feline) booster'),
    F('f12', 'p3', 'Deworming', D(90), 'Deworming'), F('f13', 'p4', 'Vaccination', D(-9), '5-in-1 (DHPPi) booster'),
    F('f14', 'p5', 'Vaccination', D(-1), 'Anti-rabies booster', '', 'done'), F('f15', 'p6', 'Deworming', D(-4), 'Deworming'),
    F('f16', 'p7', 'Deworming', D(5), 'Deworming'), F('f17', 'p9', 'Vaccination', D(8), '5-in-1 (DHPPi) second dose'),
  ];

  const A = (id: string, petId: string, ownerId: string, service: string, date: string, time: string, status: Appt['status'], reason = '', extra: Partial<Appt> = {}): Appt =>
    ({ id, petId, ownerId, service, date, time, status, reason, by: 'owner', ...extra });
  db.appts = [
    A('a1', 'p1', 'o1', 'Anti-rabies Vaccine', D(3), '10:00', 'confirmed', 'Yearly booster'),
    A('a2', 'p2', 'o1', 'Follow-up Check', D(3), '10:30', 'confirmed', 'Follow-up after stomach upset'),
    A('a3', 'p1', 'o1', 'General Consultation', D(-2), '10:00', 'completed', 'Scratching left ear', { handledBy: 'Lea Ramirez' }),
    A('a4', 'p2', 'o1', 'General Consultation', D(-30), '09:30', 'completed', 'Vomiting', { handledBy: 'Marco Pacaña' }),
    A('a5', 'p1', 'o1', 'Follow-up Check', D(-45), '11:00', 'completed', 'Skin recheck', { handledBy: 'Lea Ramirez' }),
    A('a6', 'p2', 'o1', 'Wellness Check-up', D(-10), '14:00', 'cancelled', 'Routine check', { note: 'Cancelled by owner' }),
    A('a10', 'p3', 'o2', 'Wellness Check-up', D(0), '09:00', 'completed', 'Yearly wellness', { by: 'staff', handledBy: 'Lea Ramirez' }),
    A('a11', 'p5', 'o3', 'General Consultation', D(0), '09:30', 'checked_in', 'Slight cough since yesterday', { handledBy: 'Lea Ramirez' }),
    A('a12', 'p6', 'o4', 'General Consultation', D(0), '10:30', 'confirmed', 'Not eating well'),
    A('a13', 'p7', 'o5', 'Deworming', D(0), '11:00', 'confirmed', 'Routine'),
    A('a20', 'p4', 'o2', 'Follow-up Check', D(0), '14:00', 'confirmed', 'Eye recheck'),
    A('a14', 'p8', 'o5', 'Vaccination (4-in-1)', D(1), '09:30', 'confirmed', 'Kitten vaccine series'),
    A('a15', 'p4', 'o2', 'Vaccination (5-in-1)', D(1), '10:30', 'resched', 'Overdue booster', { offer: { date: D(2), time: '14:00' }, handledBy: 'Marco Pacaña' }),
    A('a16', 'p9', 'o6', 'General Consultation', D(2), '09:30', 'confirmed', 'Phone booking, first check', { by: 'staff', handledBy: 'Marco Pacaña' }),
    A('a18', 'p5', 'o3', 'Anti-rabies Vaccine', D(-1), '10:00', 'completed', 'Rabies due', { handledBy: 'Marco Pacaña' }),
    A('a19', 'p6', 'o4', 'General Consultation', D(-2), '11:30', 'completed', 'Teeth check', { handledBy: 'Lea Ramirez' }),
    A('a22', 'p9', 'o6', 'General Consultation', D(-3), '15:30', 'completed', 'Limping after play', { handledBy: 'Marco Pacaña' }),
    A('a21', 'p7', 'o5', 'Wellness Check-up', D(-6), '15:00', 'missed', 'Annual check', { handledBy: 'Lea Ramirez', note: 'Did not arrive. Tried calling, no answer.' }),
  ];
  db.owners.find(o => o.id === 'o5')!.notes.push({ id: 'sn2', at: hoursAgo(24 * 6 - 3), by: 'Lea Ramirez', text: `Missed visit (${D(-6)}, Choco, Wellness Check-up): did not arrive. Tried calling, no answer.` });

  const It = (name: string, price: number, qty = 1) => ({ name, price, qty });
  db.bills = [
    { id: 'b1', petId: 'p3', ownerId: 'o2', apptId: 'a10', date: D(0), items: [It('Wellness Check-up', 450), It('Deworming', 250)], payments: [{ id: 'y1', method: 'Cash', amount: 700, ref: '', proof: '', status: 'confirmed', date: D(0), by: 'Lea Ramirez', verifiedBy: 'Lea Ramirez' }] },
    { id: 'b2', petId: 'p1', ownerId: 'o1', apptId: 'a3', date: D(-2), items: [It('General Consultation', 350), It('Minor Procedure', 500)], payments: [] },
    { id: 'b3', petId: 'p2', ownerId: 'o1', apptId: 'a4', date: D(-30), items: [It('General Consultation', 350), It('Wound Care & Dressing', 300)], payments: [{ id: 'y3', method: 'GCash', amount: 650, ref: '5102 441 902', proof: 'gcash-receipt.png', status: 'confirmed', date: D(-30), by: 'Maria Santos', verifiedBy: 'Lea Ramirez' }] },
    { id: 'b4', petId: 'p1', ownerId: 'o1', apptId: 'a5', date: D(-45), items: [It('Follow-up Check', 200)], payments: [{ id: 'y4', method: 'Cash', amount: 200, ref: '', proof: '', status: 'confirmed', date: D(-45), by: 'Lea Ramirez', verifiedBy: 'Lea Ramirez' }] },
    { id: 'b6', petId: 'p5', ownerId: 'o3', apptId: 'a18', date: D(-1), items: [It('General Consultation', 350), It('Anti-rabies Vaccine', 350)], payments: [{ id: 'y6', method: 'GCash', amount: 700, ref: '4821 903 117', proof: 'gcash-screenshot.png', status: 'pending', date: D(-1), by: 'Ramon Gonzales' }] },
    { id: 'b7', petId: 'p6', ownerId: 'o4', apptId: 'a19', date: D(-2), items: [It('General Consultation', 350)], payments: [{ id: 'y7', method: 'Bank transfer', amount: 350, ref: 'BDO 3390 774 201', proof: 'bank-transfer.png', status: 'pending', date: D(-2), by: 'Aileen Uy' }] },
    { id: 'b9', petId: 'p9', ownerId: 'o6', apptId: 'a22', date: D(-3), items: [It('General Consultation', 350), It('Wound Care & Dressing', 300)], payments: [] },
    { id: 'b8', petId: 'p4', ownerId: 'o2', apptId: null, date: D(-70), items: [It('General Consultation', 350)], payments: [{ id: 'y8', method: 'Cash', amount: 350, ref: '', proof: '', status: 'confirmed', date: D(-70), by: 'Marco Pacaña', verifiedBy: 'Marco Pacaña' }] },
  ];

  db.docs = [
    { id: 'd1', petId: 'p1', name: 'vaccination-card.jpg', kind: 'Vaccination card', size: '1.2 MB', date: D(-300), by: 'Maria Santos' },
    { id: 'd2', petId: 'p1', name: 'skin-test-result.pdf', kind: 'Laboratory result', size: '240 KB', date: D(-118), by: 'Lea Ramirez' },
    { id: 'd3', petId: 'p2', name: 'vaccination-card.png', kind: 'Vaccination card', size: '860 KB', date: D(-200), by: 'Maria Santos' },
  ];

  // Past visits so monitoring and the daily and monthly reports have data: dense for 2 weeks, lighter for 5 months.
  const staff = ['Lea Ramirez', 'Marco Pacaña'], times = ['09:00', '10:00', '11:30', '14:00', '15:30'];
  const pool = db.pets.filter(p => ['p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'p9'].includes(p.id));
  const methods = ['Cash', 'Cash', 'GCash', 'Cash', 'Other e-wallet', 'GCash', 'Bank transfer'] as const;
  let k = 0;
  for (let d = 150; d >= 3; d--) {
    const n = d <= 14 ? 2 + (d % 3) : (d % 2) + 1;
    for (let i = 0; i < n; i++) {
      k++;
      const p = pool[(k * 3) % pool.length], s = db.services[(k * 5) % db.services.length];
      const st: Appt['status'] = k % 11 === 0 ? 'cancelled' : k % 17 === 0 ? 'missed' : 'completed';
      const id = 'h' + k;
      db.appts.push({ id, petId: p.id, ownerId: p.ownerId, service: s.name, date: D(-d), time: times[(k + i) % 5], status: st, reason: '', by: k % 4 === 0 ? 'staff' : 'owner', handledBy: staff[k % 2], note: st === 'missed' ? 'Did not arrive' : st === 'cancelled' ? 'Cancelled by owner' : undefined });
      if (st === 'completed') {
        const m = methods[k % methods.length];
        db.bills.push({ id: 'hb' + k, petId: p.id, ownerId: p.ownerId, apptId: id, date: D(-d), items: [{ name: s.name, price: s.price, qty: 1 }],
          payments: [{ id: 'hy' + k, method: m, amount: s.price, ref: m === 'Cash' ? '' : `5${100 + k} 3${10 + k} ${200 + k}`, proof: m === 'Cash' ? '' : 'payment-proof.png', status: 'confirmed', date: D(-d), by: staff[(k + 1) % 2], verifiedBy: staff[(k + 1) % 2] }] });
      }
    }
  }

  db.messages = {
    o1: [
      { id: 'm1', at: hoursAgo(28), from: 'owner', by: 'Maria Santos', text: 'Hi! Can Bingo still eat his usual food while on the ear drops?', read: true },
      { id: 'm2', at: hoursAgo(27.5), from: 'clinic', by: 'Lea Ramirez', text: 'Hi Maria! Yes, his usual food is fine. Just keep the ear dry for the week.', read: true },
      { id: 'm3', at: hoursAgo(2), from: 'clinic', by: VET, text: 'Reminder: please bring Mochi\'s stool sample on Thursday if you can.', read: false },
    ],
    o2: [
      { id: 'm4', at: hoursAgo(0.7), from: 'owner', by: 'Joanne Tan', text: 'Good morning. Is 2:00 PM on the new date okay for Max? I saw the suggested time.', read: false },
    ],
    o3: [
      { id: 'm5', at: hoursAgo(20), from: 'owner', by: 'Ramon Gonzales', text: 'I sent the GCash payment for Brutus yesterday. Ref 4821 903 117.', read: true },
      { id: 'm6', at: hoursAgo(19), from: 'clinic', by: 'Marco Pacaña', text: 'Thanks Ramon, we will confirm it once we see it in our account.', read: true },
    ],
  };

  db.notifs = {
    'owner:o1': [
      { id: 'n1', at: hoursAgo(1.2), unread: true, title: 'Booking confirmed', body: `Bingo's anti-rabies booster is set for 10:00 AM in 3 days.`, icon: 'calendar', tone: 'ok', link: { screen: 'ApptDetail', params: { id: 'a1' } } },
      { id: 'n7', at: hoursAgo(2), unread: true, title: 'New message from the clinic', body: `Reminder: please bring Mochi's stool sample on Thursday if you can.`, icon: 'chat', tone: '', link: { screen: 'Chat' } },
      { id: 'n3', at: hoursAgo(5), unread: true, title: 'Deworming overdue', body: `Mochi's deworming was due 20 days ago. Book a visit to catch up.`, icon: 'pill', tone: 'bad', link: { screen: 'PetDetail', params: { id: 'p2', tab: 'follow' } } },
      { id: 'n4', at: hoursAgo(26), unread: false, title: 'Bill ready', body: `Bingo's visit bill is ₱850. Pay by GCash, e-wallet, bank transfer or at the clinic.`, icon: 'receipt', tone: '', link: { screen: 'BillDetail', params: { id: 'b2' } } },
      { id: 'n5', at: hoursAgo(30), unread: false, title: 'Return-visit reminder', body: `Mochi's recheck is in 3 days.`, icon: 'repeat', tone: 'warn', link: { screen: 'PetDetail', params: { id: 'p2', tab: 'follow' } } },
      { id: 'n6', at: hoursAgo(720), unread: false, title: 'Payment confirmed', body: `Your ₱650 payment for Mochi was confirmed. Receipt issued.`, icon: 'check', tone: 'ok', link: { screen: 'Receipt', params: { id: 'b3' } } },
    ],
    staff: [
      { id: 'n20', at: hoursAgo(0.5), unread: true, title: 'New message', body: `Joanne Tan: Is 2:00 PM on the new date okay for Max?`, icon: 'chat', tone: '', link: { screen: 'Chat', params: { ownerId: 'o2' } } },
      { id: 'n21', at: hoursAgo(2), unread: true, title: 'Payment proof submitted', body: `Brutus (Ramon Gonzales) sent ₱700 by GCash. Check the clinic account.`, icon: 'banknote', tone: 'warn', link: { screen: 'BillDetail', params: { id: 'b6' } } },
      { id: 'n24', at: hoursAgo(3), unread: true, title: 'New booking', body: `Mochi (Maria Santos) · Follow-up Check · in 3 days, 10:30 AM. Confirmed automatically.`, icon: 'calendar', tone: 'ok', link: { screen: 'ApptDetail', params: { id: 'a2' } } },
      { id: 'n22', at: hoursAgo(4), unread: false, title: 'Overdue vaccine', body: `Max (Joanne Tan) is 9 days past due for 5-in-1.`, icon: 'alert', tone: 'bad', link: { screen: 'CareMonitor' } },
      { id: 'n23', at: hoursAgo(27), unread: false, title: 'Payment proof submitted', body: `Coco (Aileen Uy) sent ₱350 by bank transfer.`, icon: 'banknote', tone: 'warn', link: { screen: 'BillDetail', params: { id: 'b7' } } },
    ],
    admin: [
      { id: 'n31', at: hoursAgo(2), unread: true, title: 'Payment proof submitted', body: `Brutus (Ramon Gonzales) sent ₱700 by GCash.`, icon: 'banknote', tone: 'warn', link: { screen: 'BillDetail', params: { id: 'b6' } } },
      { id: 'n30', at: hoursAgo(3), unread: true, title: 'New booking', body: `Mochi (Maria Santos) · Follow-up Check · in 3 days, 10:30 AM`, icon: 'calendar', tone: 'ok', link: { screen: 'ApptDetail', params: { id: 'a2' } } },
      { id: 'n32', at: hoursAgo(4), unread: false, title: 'Overdue follow-up', body: `Max's eye recheck was due 4 days ago.`, icon: 'repeat', tone: 'bad', link: { screen: 'CareMonitor' } },
      { id: 'n33', at: hoursAgo(30), unread: false, title: 'Password reset requested', body: `Carlo Dela Peña asked for a reset code.`, icon: 'key', tone: '', link: { screen: 'Users' } },
    ],
  };

  db.activity = [
    { id: 'l1', at: hoursAgo(1), who: 'Marco Pacaña', text: 'Suggested a new time for Max’s appointment' },
    { id: 'l2', at: hoursAgo(3), who: 'Lea Ramirez', text: 'Checked in Brutus' },
    { id: 'l3', at: hoursAgo(8), who: VET, text: 'Saved a consultation record for Luna' },
    { id: 'l7', at: hoursAgo(40), who: VET, text: 'Edited the consultation record for Bingo' },
    { id: 'l4', at: hoursAgo(30), who: VET, text: 'Deactivated staff account: Trisha Go' },
    { id: 'l5', at: hoursAgo(52), who: VET, text: 'Updated Sunday clinic hours' },
    { id: 'l8', at: hoursAgo(24 * 6 - 3), who: 'Lea Ramirez', text: 'Marked Choco’s appointment as missed' },
    { id: 'l6', at: hoursAgo(24 * 7), who: 'Marco Pacaña', text: 'Verified a ₱650 GCash payment for Mochi' },
  ];
  return db;
}
