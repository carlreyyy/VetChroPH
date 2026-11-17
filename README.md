# VetChroPH: responsive web application (frontend prototype)

Web application for one veterinary clinic, built with **TypeScript, React Native + React Native Web, Expo SDK 58 and React Navigation**. It runs in the browser on desktops, tablets and phones from one codebase. There is no separate Android app.

**Frontend only.** Every screen works, but all data is sample data. There is no server, database, real login, SMS, push notification or payment gateway. Changes are kept in this browser's local storage so a page refresh does not lose them; *Reset demo data* (Welcome → Explore Demo Accounts) starts over. Sample data also starts fresh each day.

This version follows the **final client consultation (signed 11/15/26)**. The decisions it is based on are listed under [What changed after the consultation](#what-changed-after-the-consultation).

---

## 1. Set up and run

### What you need
- **Node.js 20 or newer** (LTS). Check with `node -v`.
- A current **Chrome or Edge**.

### Run it locally
```bash
cd vetchroph
npm install          # first time only
npm start            # starts the dev server and opens the app in the browser (http://localhost:8081)
```
Press `w` in the terminal if the browser doesn't open. To see it on your phone, open `http://<your-computer's-IP>:8081` on the same Wi-Fi.

### Other commands
```bash
npm run typecheck    # TypeScript check (prints nothing when OK)
npm run build        # production build into the "dist" folder
npx serve dist -s    # preview the production build (the -s flag makes direct links like /patients work)
```

### Deploy (free hosting)
The build in `dist` is a static website. Any static host works; it must send unknown paths to `index.html` so refresh and direct links work:
- **Netlify:** build command `npm run build`, publish directory `dist`, and add a `_redirects` file in `public/` with `/*  /index.html  200` (already included).
- **Vercel:** framework "Other", build command `npm run build`, output directory `dist` (the included `vercel.json` adds the rewrite).

### Troubleshooting
| Problem | Fix |
|---|---|
| `npm install` shows warnings | Warnings are normal. Only stop if it ends with `ERR!`. |
| Old screens or strange cache errors | `npx expo start --web -c` (clears the cache). |
| Want a clean demo | Welcome → Explore Demo Accounts → *Reset demo data*. |
| Adding a package | Use `npx expo install <package>` so the version matches SDK 58. |

### Screen sizes
| Width | Layout |
|---|---|
| 1200 px and wider (laptops, desktops) | Full left sidebar, wide pages, data tables, two-column dashboards, split inbox, centered dialogs |
| 768–1199 px (tablets) | Compact icon sidebar, tables with fewer columns, centered dialogs |
| below 768 px (phones) | Bottom tab bar, stacked content, bottom sheets, sticky action buttons |

---

## 2. Demo sign-in

The welcome page has demo buttons for each role under **Explore Demo Accounts**. To log in by hand:

| Role | Name | Email (password `demo1234`) | Mobile (code `123456`) |
|---|---|---|---|
| Pet Owner | Maria Santos | maria.santos@example.com | 0917 555 0142 |
| Clinic Staff | Lea Ramirez | lea@sugbopetcare.example | 0917 555 0201 |
| Administrator (clinic owner) | Dr. Elena Ybañez | elena@sugbopetcare.example | 0917 555 0188 |

Every verification code is **123456**. No SMS is sent.

---

## 3. Suggested demo script for the client (about 10 minutes)

Open the site on a laptop first, then show the same site on a phone.

1. **Pet owner (Maria)** (Explore Demo Accounts → Pet Owner): Home → **Book a visit** → choose Mochi and Wellness Check-up → **Next** → pick a date and time → **Next** → **Confirm Appointment**. The confirmation appears right away.
2. **My pets** → Bingo → **History**, **Reminders** and **Files** (Upload a file opens the real file picker).
3. **Messages** → send a message to the clinic.
4. **Bills** → ₱850 → **Pay** → switch between **GCash / Maya / BDO** → enter a reference number → upload a screenshot → **Submit Payment Proof**. Status becomes **Checking payment**. Refresh the page: everything is still there.
5. Log out (bottom of the sidebar). **Clinic staff (Lea):** Today dashboard → **Schedule** → **Calendar** view → Coco → **Check in** → **Reason for visit**.
6. Max (2:00 PM) → **Mark missed**. A note is added to the owner record (**Patients → Owners → Joanne Tan**).
7. **Messages** (split inbox) → reply to Joanne. **Billing → To verify** → Brutus → **Confirm payment**.
8. Log out. **Administrator (Dr. Elena):** Overview → **Reports** (Daily / Monthly) → **Schedule** (monitoring counts) → Brutus → **Consultation**.
9. **Setup**, **Users and staff**, **Activity log**.
10. Open the same address on a phone: the sidebar becomes a bottom tab bar, tables become lists, and dialogs become bottom sheets.

---

## 4. Roles and screens

**Pet Owner** (tabs: Home · Pets · Visits · Messages · More)
- Sign up (privacy notice, mobile code check) · log in by email + password or mobile + code · reset password
- Home: next visit, quick actions, needs-attention list (due/overdue follow-ups, unpaid bills)
- Multiple pets; add/edit pet (dogs and cats; estimated age allowed; duplicate-name warning)
- Pet profile: Info · History (read-only visits + progress notes) · Follow-ups (rechecks, vaccine and deworming due dates) · Files (upload/view)
- Book (pet → service → date → open time); **confirmed automatically**; cancel or change time up to 24 hours before; accept/decline a time the clinic suggests
- Messages with the clinic · Bills and receipts · Pay in full by GCash QR, other e-wallet QR (Maya) or bank transfer, with reference number and screenshot
- Notification center · notification settings (phone alerts / SMS / email, and topics) · clinic location, hours and contact

**Clinic Staff** (tabs: Today · Schedule · Patients · Messages · Billing)
- Daily dashboard: appointments today, payments to verify, overdue follow-ups, unread messages, today's list, due/overdue pets
- Schedule as **list or calendar**; phone/walk-in booking for existing owners; check in; mark missed (with note); suggest another time; cancel with reason
- Patients: search pets and owners by name or mobile; edit pet; mark inactive/deceased; owner record with **internal notes**
- Enter **reason for visit only**; set follow-up/due dates; upload files
- Messages inbox · Billing: create bill from services, record cash (full amount), verify e-wallet/bank proofs · Due and overdue list with reminder/call

**Administrator / clinic owner** (tabs: Overview · Schedule · Patients · Reports · Setup)
- Overview: today, payments to verify, overdue follow-ups, messages, collections today and this month, staff activity
- Schedule with appointment monitoring (today / last 7 days) and who handled each appointment
- Full consultation records (complaint, findings, diagnosis, treatment, medication); **edits are logged**; **progress notes**; follow-ups
- Reports: **daily and monthly collections**, due/overdue vaccines and deworming, unpaid bills, staff oversight
- Setup: users and staff, clinic profile, services and prices, hours and slots (24-hour cutoff), reminder settings and channels, **payment accounts** (administrator only), activity log

---

## 5. What changed after the consultation

| Consultation decision | What the prototype does now |
|---|---|
| D2: three roles only (Pet owner, Staff, Admin = owner) | Three roles; Administrator labelled as the clinic owner |
| D4: phones for owners, tablets for staff | Layout widens and centers on tablets (stat cards in one row) |
| D5: dogs and cats first | Species picker is Dog / Cat only |
| D6: email + password, and mobile + verification code | Login screen has both tabs |
| D7 + "Register pet owners" not needed | Owners sign up in the app; staff registration screen removed |
| D8: automatic confirmation when the slot is free | No *Pending* status; bookings and owner reschedules confirm at once |
| D9: 24 hours | Default cutoff is 24 h (still changeable in Setup) |
| D10: missed + note | *Mark missed* asks for a note and adds it to the owner's internal notes |
| Vaccination/deworming record and schedule "not needed"; comment: include them in reminders | Separate vaccine module removed. Vaccine and deworming due dates are follow-up types that drive reminders |
| Staff consultation: reason for visit only, no weight | Staff form has only *Reason for visit* |
| D12–D14: GCash QR, other e-wallet QR, bank transfer; business account; paid in full | Three payment accounts; owner picks one; no partial payments |
| D16–D17: vet + staff basic details; edits allowed and logged | Edit history shown on each visit record |
| D20: real-time chat | Messages tab (owner) and shared inbox (clinic) |
| D21: daily/monthly collections, due/overdue vaccines, unpaid bills | Reports tab rebuilt around these |
| P2/P3: push, SMS, email; appointment reminder 1 day and 2 hours before | Reminder settings and owner preferences include all three channels and both timings |
| P5: staff-only notes, payment verification, activity log | Internal notes on the owner record; verification and log are clinic-only |
| P7: list and calendar | Schedule toggles between list and month calendar |
| Condition progress notes: wanted | Progress notes on the pet's History tab |
| D25: "User interface" (not plain wireframes) | Full styled UI based on the design reference |

---

## Design system and brand (v4)

- **Brand colors (from the brand sheet):** primary navy `#142747` (buttons, key actions), secondary blue `#4F82B8` (accents and icons), light blue `#E6F0FA` (selected states, highlights), background `#F8FAFC`, main text `#1F2937`, muted text `#6B7280`, white `#FFFFFF`. All live in `src/theme.ts`; screens read them from there and never hard-code colors.
- **Logo:** one transparent mark extracted from the brand sheet (`assets/brand/mark.png`, plus a white version `mark_white.png`). `src/components/Brand.tsx` builds every variation from it:
  - `Logo`: mark + wordmark (optional tagline). Used on Welcome, the owner home and the profile footer.
  - `BrandMark`: icon only, for tight spaces such as the log in and sign up headings and the home hero.
  - `BrandTile`: white mark on a navy rounded square (the app-icon look). Used for the clinic in Messages, on receipts and in the staff and admin home headers.
  - `Wordmark`: "VetChro" in navy and "PH" in blue, set as text so it stays sharp.
- **App icon, adaptive icon, splash and favicon** are generated from the same mark on navy.
- **Welcome:** logo, headline, cat-and-dog cutout on soft light-blue shapes, Log in (navy) and Create account (outlined), and a collapsible "Explore Demo Accounts" list. The hero shrinks on short screens.
- **Surfaces:** white cards with thin borders and a light shadow; no gradients. Text stays dark on light backgrounds.

Shared components are in `src/components/ui.tsx`.

---

## 6. Folder structure

```
App.tsx                      app entry: providers + navigation
src/
  theme.ts                   colors, spacing, type, shadow (one design system for all roles)
  types.ts                   data shapes (a backend should return the same shapes)
  data/seed.ts               sample records; all dates are relative to today
  data/photos.ts             sample pet/people photos (assets/photos)
  store/AppStore.tsx         in-memory store + every action screens call  ← backend plugs in here
  utils/format.ts            dates, money, status labels, validation helpers
  navigation/RootNavigator.tsx  stack + role-based bottom tabs
  components/ui.tsx          Screen, buttons, rows, cards, stats, quick actions, fields, pickers
  components/overlays.tsx    bottom sheet, confirm dialog, toast
  screens/auth.tsx           welcome, log in, sign up, verify code, reset password
  screens/common.tsx         home header, notifications, profile and settings
  screens/owner.tsx          owner home, pets, visits, bills, more, clinic info
  screens/pets.tsx           pet profile, add/edit pet, visit record, consultation form
  screens/appointments.tsx   booking wizard + confirmation, appointment detail, schedule (list + calendar)
  screens/billing.tsx        bill, pay bill, receipt, billing list, new bill
  screens/clinic.tsx         staff dashboard, patients, owner record, due and overdue
  screens/messages.tsx       owner chat, clinic inbox, conversation
  screens/admin.tsx          admin overview, reports, setup and settings screens
```
Screens never change data directly; they call `useApp().act.*`. To connect a backend later, replace the bodies of those actions with API calls.

---

## 7. Limitations (simulated or not built)

- **No backend.** Login, codes, accounts and records are sample data kept in this browser only. Another browser or device does not see the same data.
- **Notifications** appear in the in-app notification center only. No email, SMS or browser push is sent, and reminders are not scheduled.
- **Messages** update instantly in the same browser only. Real-time chat between users needs a backend.
- **File uploads** open the real file picker and check type and size (JPEG/PNG/PDF, 10 MB), but only the file name and size are recorded. The file is not stored.
- **QR codes** are placeholder patterns. Nothing confirms a payment except the clinic.
- **Map** is an illustration. *Directions* opens Google Maps; *Call* uses the device's dialer where available.
- **Receipts** are shown on screen only (no PDF).
- Optional **dark mode** (P8) is not built.

## 8. Testing done

- `npm run typecheck`: no errors. `npm run build` (web) builds without errors.
- **Desktop and tablet** (1366×768, 1920×1080, 768×1024): scripted Chrome test of all three roles. It covers demo sign-in, sidebar navigation, a pet profile with a real file upload, booking, chat, paying a bill with a real screenshot upload, check-in, payment verification, patient search, the split inbox reply, reports, the new-account form validation, setup and the activity log. Also checked: browser back/forward, page refresh (same page, data kept), a direct link (`/admin/users`), log out. All passed with no console errors and no horizontal scrolling.
- **Phones** (360×740 and 390×844): the full mobile walkthrough (57 screens and actions for all roles) passed with no console errors; 33 pages checked for horizontal overflow at both widths, with none found.
- **Not tested:** Microsoft Edge itself (it uses the same engine as Chrome), Safari/iPhone, a real phone browser, screen readers.
