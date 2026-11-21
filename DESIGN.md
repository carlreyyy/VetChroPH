# VetChroPH — Design System v4

**Branch:** `feature/premium-redesign`  
**Date:** 2026-11-21  
**Status:** Spec — awaiting implementation approval

---

## Design direction

VetChroPH serves two audiences that need different emotional registers from the same codebase: pet owners who want warmth, reassurance and a quick path to action; and clinic staff and administrators who need density, speed and data clarity. The design unifies both through **precision and restraint** — a calm, structured layout system with one point of warmth (amber accents on care moments). Every screen is built from the same 20-token color system and 11-step type scale, so both audiences feel the same underlying product even though the visual density shifts by role.

---

## 3.1 Typography

### Font family

**Plus Jakarta Sans** (Google Fonts) — a geometric-humanist sans-serif with roots in Southeast Asia. Chosen because:
- Warm but precise character suits both clinical (staff tables) and personal (pet owner home)
- Excellent numeral rendering at all weights, including tabulars
- Not the reflexive default for any other brief — avoids Inter's ubiquity
- Available weights: 400, 500, 600 (700 only for display numbers)

**Web loading (index.html):**
```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
  rel="stylesheet"
/>
```

**Fallback stack:** `'Plus Jakarta Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`

**React Native:** Loaded via `expo-font` with `useFonts` in App.tsx. Font family name: `'PlusJakartaSans'`.

No separate display face. Plus Jakarta Sans 700 at display size is characterful enough.

### Type scale

All `lineHeight` values in points (React Native) / pixels (web). `letterSpacing` in points.

| Token | Desktop size | Phone size | Weight | Line height | Letter spacing | Color |
|---|---|---|---|---|---|---|
| `display` | 36 | 28 | 700 | 42 / 34 | −1.0 / −0.6 | ink |
| `h1` | 22 | 20 | 600 | 28 / 26 | −0.4 / −0.3 | ink |
| `h2` | 17 | 16 | 600 | 23 / 22 | −0.2 / −0.1 | ink |
| `h3` | 15 | 15 | 600 | 20 / 20 | 0 | ink |
| `body` | 15 | 15 | 400 | 23 / 22 | 0 | ink |
| `bodySmall` | 13 | 13 | 400 | 19 / 18 | 0 | ink2 |
| `label` | 13 | 12 | 500 | 18 / 16 | 0 | ink2 |
| `overline` | 11 | 11 | 600 | 15 / 15 | 0.6 | ink3 |
| `caption` | 12 | 11 | 400 | 16 / 15 | 0 | ink3 |
| `btnText` | 14 | 14 | 600 | — | 0 | (per variant) |
| `tableHeader` | 12 | — | 600 | 16 | 0.2 | ink3 |
| `tableCell` | 14 | — | 400 | 18 | 0 | ink |

**`overline` usage:** Section dividers only when the content is a named category — not above every heading. Sentence case for everything except overline.

### Numbers
- **Font variant:** tabular numerals (`fontVariant: ['tabular-nums']`) on all money, time, table, and stat values.
- **Peso:** `₱1,250.00` for bill totals and receipts; `₱1,250` where whole pesos suffice (KPI tiles, row lists).
- **Times:** `9:30 AM` (no leading zero, space before AM/PM).
- **Dates:** `Tue, Nov 17` for fixed dates; `Today`, `Tomorrow`, `in 3 days` for relative.

### Line length
- Body text containers: `maxWidth: 680` on desktop, full width on phone.
- Form labels: `maxWidth: 560` (form column width).

### Casing
- Sentence case everywhere: headings, buttons, tabs, navigation labels.
- **Uppercase only:** `overline` token and sidebar group titles (11px, 0.6 tracking, ink3).

### Truncation
- `numberOfLines={1}` with `ellipsizeMode="tail"` only for name fields in rows and table cells.
- Full value available on hover via tooltip where truncation is likely.
- Never truncate buttons or tab labels — size to content.

---

## 3.2 Color

### Brand palette (unchanged per brief)

| Token | Hex | Use |
|---|---|---|
| `accentDeep` | `#142747` | Primary actions, sidebar active, key text accents |
| `accent` | `#4F82B8` | Links, secondary accents, focus ring |
| `accentSoft` | `#E6F0FA` | Selected states, soft highlights |
| `bg` | `#F8FAFC` | Page background |
| `ink` | `#1F2937` | Primary text |
| `ink2` | `#6B7280` | Secondary/muted text |

### Neutral scale

| Token | Hex | Use |
|---|---|---|
| `neutral50` | `#F8FAFC` | = bg |
| `neutral100` | `#F1F5FA` | Subtle surface, sunken state |
| `neutral200` | `#E6EBF2` | Line / border subtle |
| `neutral300` | `#D3DBE6` | Border default |
| `neutral400` | `#A9B8CB` | Border strong, placeholder icon |
| `neutral500` | `#7A91A8` | Tertiary text, disabled icons |
| `neutral600` | `#6B7280` | = ink2, secondary text |
| `neutral700` | `#4B5563` | Medium weight text |
| `neutral800` | `#374151` | Secondary heading |
| `neutral900` | `#1F2937` | = ink, primary text |

### Brand scale (derived from navy + blue)

| Token | Hex |
|---|---|
| `brand50` | `#E6F0FA` |
| `brand100` | `#CCE1F5` |
| `brand200` | `#A8CAE9` |
| `brand300` | `#7FACDA` |
| `brand400` | `#5990C9` |
| `brand500` | `#4F82B8` |
| `brand600` | `#3D6CA0` |
| `brand700` | `#2D5484` |
| `brand800` | `#1E3D68` |
| `brand900` | `#142747` |

### Warm accent (amber — care moments)

Used for: pet health status alerts, follow-up urgency, "checked in" appointment state, booking confirmation. Not used in admin/staff tables. 10% distribution maximum.

| Token | Hex |
|---|---|
| `amber50` | `#FFF8EC` |
| `amber100` | `#FEECD0` |
| `amber400` | `#F5A330` |
| `amber700` | `#B5620E` |
| `amber900` | `#6B3808` |

### Surface tokens

| Token | Hex | Use |
|---|---|---|
| `surface` | `#FFFFFF` | Cards, inputs, navbar, sidebar |
| `surfaceRaised` | `#FFFFFF` | (same, differentiated by border + shadow) |
| `surfaceSunken` | `#F1F5FA` | Tinted cards, disabled inputs, table header |
| `surfaceOverlay` | `rgba(20,39,71,0.42)` | Dialog scrim |

### Border tokens

| Token | Hex / Value |
|---|---|
| `borderSubtle` | `#E6EBF2` |
| `borderDefault` | `#D3DBE6` |
| `borderStrong` | `#A9B8CB` |
| `borderFocus` | `#4F82B8` |

### Text tokens

| Token | Value |
|---|---|
| `textPrimary` | `#1F2937` |
| `textSecondary` | `#6B7280` |
| `textTertiary` | `#9CA3AF` |
| `textDisabled` | `#A9B8CB` |
| `textOnPrimary` | `#FFFFFF` |
| `textLink` | `#4F82B8` |

### Semantic tokens

**Success** (confirmed appointments, paid bills, up-to-date reminders):
- bg: `#E7F6EC` · border: `#A3D9B6` · text: `#1E6E43` · icon: `#27AE60`

**Warning** (due-soon reminders, pending verification):
- bg: `#FFF8EC` · border: `#F9C97A` · text: `#92650A` · icon: `#F5A330`

**Danger** (overdue, missed, cancelled, bad bill):
- bg: `#FCEEEC` · border: `#F5B9B3` · text: `#B91C1C` · icon: `#EF4444`

**Info** (confirmed/scheduled appointments, general notices):
- bg: `#E6F0FA` · border: `#A8CAE9` · text: `#1E3D68` · icon: `#4F82B8`

### Status color map (one meaning per status, used identically everywhere)

**Appointments:**

| Status | Tone | Hex (text) | Label |
|---|---|---|---|
| `confirmed` | info | `#1E3D68` | Confirmed |
| `checkedin` | warning | `#92650A` | Checked in |
| `consultation` | warning | `#92650A` | In consultation |
| `completed` | success | `#1E6E43` | Completed |
| `missed` | danger | `#B91C1C` | Missed |
| `cancelled` | neutral | `#6B7280` | Cancelled |
| `resched` | warning | `#92650A` | Time suggested |

**Bills:**

| Status | Tone | Label |
|---|---|---|
| `unpaid` | danger | Unpaid |
| `pending` | warning | Checking payment |
| `confirmed` | success | Paid |
| `overdue` | danger | Overdue |

**Follow-ups:**

| Status | Tone | Label |
|---|---|---|
| `soon` | warning | Due soon |
| `overdue` | danger | Overdue |
| `done` | success | Done |

**Pets:**

| Status | Tone | Label |
|---|---|---|
| `active` | success | Active |
| `inactive` | neutral | Inactive |
| `deceased` | neutral | Deceased |

### Contrast ratios (WCAG 2.2 AA required: 4.5:1 body, 3:1 UI)

| Foreground | Background | Ratio | Pass |
|---|---|---|---|
| `#1F2937` on `#FFFFFF` | text on surface | 14.7:1 | ✓ AA |
| `#1F2937` on `#F8FAFC` | text on page bg | 14.1:1 | ✓ AA |
| `#6B7280` on `#FFFFFF` | secondary text | 5.9:1 | ✓ AA |
| `#6B7280` on `#F8FAFC` | secondary on bg | 5.6:1 | ✓ AA |
| `#FFFFFF` on `#142747` | nav/btn text | 13.8:1 | ✓ AA |
| `#1E3D68` on `#E6F0FA` | info text on bg | 7.4:1 | ✓ AA |
| `#1E6E43` on `#E7F6EC` | success text | 5.8:1 | ✓ AA |
| `#B91C1C` on `#FCEEEC` | danger text | 5.6:1 | ✓ AA |
| `#92650A` on `#FFF8EC` | warning text | 5.3:1 | ✓ AA |
| `#4F82B8` on `#FFFFFF` | link text | 3.6:1 | ✓ AA (large) |
| `#FFFFFF` on `#4F82B8` | badge text | 3.6:1 | ✓ AA (large) |

Note: `#4F82B8` on white is 3.6:1. It passes for large text (≥18px bold or ≥24px) and UI components (focus ring, icons). **Never use it as body text on white.** Use `#3D6CA0` (4.9:1) for inline link text if needed.

### Distribution target
- 60% neutrals (surfaces, borders, text)
- 30% brand (navy/blue — actions, navigation, highlights)
- 10% warm amber (care moments, check-in state, booking confirmation)

---

## 3.3 Shape (radius)

### Scale

| Name | Value | Use |
|---|---|---|
| `r2` | 2 | Tags, table row indicator |
| `r4` | 4 | Tooltip |
| `r6` | 6 | Badge/pill, overline chip |
| `r8` | 8 | Input, search, small button (sm), sidebar nav item |
| `r10` | 10 | Button md, segmented control item |
| `r12` | 12 | Card, dialog, dropdown menu |
| `r16` | 16 | Feature panel, bottom sheet corner |
| `r20` | 20 | Large modal |
| `r999` | 999 | Avatar (circle), round badge |

### Assignment per component

| Component | Radius |
|---|---|
| Button sm (h=32) | 8 |
| Button md (h=40) | 10 |
| Button lg (h=48) | 10 |
| Input (h=46) | 8 |
| Chip (h=30) | 6 (pill shape) |
| Badge (count) | 999 |
| Status pill (dot+text) | — (no container) |
| Status chip (with bg) | 6 |
| Card | 12 |
| Group (list container) | 12 |
| DataTable outer | 8 |
| Dialog (desktop) | 12 |
| Bottom sheet (phone) | 16 top only |
| Avatar (person) | 999 |
| Avatar (pet, square) | 10 |
| Pet photo in card | 10 (via overflow hidden) |
| Pet cover photo | 0 (full bleed) |
| Tooltip | 4 |
| Toast | 10 |
| Sidebar nav item | 8 |
| Dropdown menu | 10 |
| Segmented control | 10 (outer), 8 (inner item) |
| OTP input box | 8 |
| Calendar day | 999 (selected), 0 (default) |

### Nested radius rule
Inner element radius = outer radius − padding. If a photo sits inside a card with radius 12 and 16px padding, the photo top corners should be radius 12 (flush edge); if a button sits inside a card body, its radius stays at 10.

---

## 3.4 Spacing and layout

### Spacing scale (4px base, 8px rhythm)

| Token | Value | Common use |
|---|---|---|
| `sp2` | 2px | Icon-to-text optical gap |
| `sp4` | 4px | Within a compound element (dot + text) |
| `sp8` | 8px | Between labels and values, sibling chips |
| `sp12` | 12px | Inside rows (gap between avatar and text) |
| `sp16` | 16px | Padding inside components (cards, rows) |
| `sp20` | 20px | Larger padding (card on desktop) |
| `sp24` | 24px | Between sections within a page |
| `sp32` | 32px | Between major page sections |
| `sp40` | 40px | Page top padding |
| `sp48` | 48px | Auth panel padding |
| `sp64` | 64px | Very large vertical breathing room |

### Component padding rules

| Component | Padding |
|---|---|
| Card | 16px (phone), 20px (desktop) |
| Row | 12px vertical, 16px horizontal |
| Button sm | 10px horizontal, height 32 |
| Button md | 16px horizontal, height 40 |
| Button lg | 20px horizontal, height 48 |
| Input | 12px horizontal, height 46 |
| OTP box | — (fixed width 46 × height 54) |
| Dialog | 24px |
| Toast | 14px v, 16px h |
| Sidebar item | 10px v, 10px h |
| Sidebar section gap | 2px between items, 20px before group title |

### Page margins per breakpoint

| Breakpoint | Horizontal padding | Max content width (narrow) | Max content width (wide) |
|---|---|---|---|
| Phone (<768) | 16px | full | full |
| Tablet (768–1199) | 28px | 760px | 1100px |
| Desktop (≥1200) | 40px | 880px | 1240px |

### Grid

| Breakpoint | Columns | Gutter |
|---|---|---|
| Desktop | 12 | 24px |
| Tablet | 8 | 20px |
| Phone | 4 | 16px |

### Content widths

| Content type | Width |
|---|---|
| Forms, detail pages | max 720px |
| Reading text / descriptions | max 680px |
| Lists, tables, dashboards | wide (full content area) |
| Auth forms | max 480px |

### Sidebar

| Property | Full (desktop) | Rail (tablet) |
|---|---|---|
| Width | 256px | 72px |
| Item height | 40px | 58px |
| Item padding | 10px v, 10px h | centered |
| Brand area height | 76px | 70px |
| Section gap | 20px above group title | hairline divider |
| Bottom section | border-top + 10px pt | — |

### Owner navbar (desktop/tablet)

| Property | Value |
|---|---|
| Height | 60px |
| Background | white |
| Border-bottom | 1px `borderDefault` |
| Link height | 40px |
| Link padding | 12px horizontal |
| Active indicator | 2px underline at bottom of link, `accentDeep` |

### Page header (desktop/tablet)

| Property | Value |
|---|---|
| Back link | 13px / 500 / ink2, 8px above title |
| Title | h1 token |
| Subtitle | bodySmall / ink2, 4px below title |
| Actions area | row, right-aligned, gap 10px |
| Min-height | 44px |

### Optical alignment

- Icon vertical center with the first text baseline (not the whole text block).
- Numbers in tables: `textAlign: 'right'` with consistent column width.
- Consistent left edges across a page section: 16px from card edge, aligned with text in adjacent rows.
- `alignItems: 'flex-start'` on multi-line content rows.

---

## 3.5 Elevation, borders and surfaces

**Principle:** borders communicate structure; surfaces communicate hierarchy; shadows communicate floating elements only. Not every container needs a shadow.

### Elevation levels

| Level | Use | Shadow value |
|---|---|---|
| 0 (flat) | Page content, groups, rows | none — 1px border only |
| 1 (raised) | Cards, framed icon buttons, segmented control active | `shadowColor: '#0F1E36', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: {w:0, h:2}, elevation: 1` |
| 2 (overlay) | Dialogs, dropdown menus, account menu | `shadowColor: '#0F1E36', shadowOpacity: 0.14, shadowRadius: 24, shadowOffset: {w:0, h:10}, elevation: 8` |

**Rules:**
- Never layer two shadows (a shadow inside a shadow).
- Avoid colored shadows — `#0F1E36` is a desaturated near-navy, not pure black.
- Group containers (list of rows with dividers): 0 elevation, 1px border. This is the primary structural device — not cards.
- Use dividers to group related rows; cards only for self-contained entities (a pet, an appointment summary, a payment proof).

---

## 3.6 Iconography

**Library:** Lucide (react-native version), already installed.

### Sizes

| Size | Use |
|---|---|
| 16px | Inline with text, table cell indicator, back link |
| 20px | Default UI (rows, cards, form fields) |
| 22px | Tab bar (phone), sidebar nav items (rail) |
| 24px | Sidebar nav items (full), page header actions |

### Stroke width

- Default: `1.75`
- Active nav item: `2.0`
- Form validation icons: `2.0`
- Emphasis (error, alert): `2.0`

### Color rules

- Default: `ink3` (#9CA3AF) — muted, deferential
- Active / selected: `accentDeep` (#142747)
- Link / accent: `accent` (#4F82B8)
- Danger: `#B91C1C`
- Success: `#1E6E43`
- Warning: `#92650A`
- On navy background: `#FFFFFF`

### Icon vocabulary (one icon per concept)

| Concept | Icon name |
|---|---|
| Home / Today / Overview | `home` |
| Appointments / Schedule | `calendar` |
| Pets / Patients | `paw` |
| Messages / Inbox | `message-square` (mapped as `chat`) |
| Bills (owner) | `receipt` |
| Billing (staff/admin) | `wallet` |
| Reports / Charts | `bar-chart` |
| Setup / Settings | `sliders` |
| Users & Staff | `users` |
| Activity Log | `history` |
| Notifications / Due List | `bell` |
| Clinic info / location | `map-pin` |
| Search | `search` |
| Add / New | `plus` |
| Back | `chevron-left` |
| Forward / row action | `chevron-right` |
| Log out | `log-out` |
| Profile / User | `user` |
| Password | `lock` |
| Email | `mail` |
| Phone | `phone` |
| QR code | `qr-code` |
| Check / done | `check` |
| Completed | `check-circle` |
| Missed / Cancelled | `x-circle` |
| Overdue / Urgent | `alert-circle` |
| Info | `info` |
| Filter | `filter` |
| Sort | `chevrons-up-down` |
| Copy | `copy` |
| Upload | `upload-cloud` |
| Download | `download` |
| Edit | `pencil` |
| Delete | `trash-2` |
| Eye (show password) | `eye` / `eye-off` |
| Shield / verify | `shield` |
| Stethoscope | `stethoscope` |
| Clock / time | `clock` |
| Camera | `camera` |

---

## 3.7 Imagery and brand

### Logo usage

| Context | Variant | Min size |
|---|---|---|
| Welcome + auth panel | Full logo (wordmark) | 28px height |
| Sidebar top (full) | Full logo | 28px height |
| Sidebar top (rail/tablet) | Brand tile (icon only) | 36px |
| Owner navbar | Full logo | 24px height |
| Phone app bar | Full logo | 22px height |
| Favicon / small | Icon mark | 16px |

**Clear space:** minimum 1× logo height on all sides.  
**Never:** stretch, recolor, or place on a background that fails contrast.

### Pet photos

| Context | Aspect ratio | Radius | Fallback |
|---|---|---|---|
| Pet card (owner home, pets list) | 4:3 | 10 (flush top via overflow hidden) | Paw icon on `brand50` |
| Pet avatar in rows | 1:1 (40–60px) | 10 (square) | Paw on `brand50` |
| Pet avatar in tables | 1:1 (36px) | 10 | Paw on `brand50` |
| Pet profile cover | 16:9, full width | 0 (full bleed) | Paw on `brand100` |

Fallback placeholder: `paw` icon (20px) in `accent` color (#4F82B8) on `brand50` background (#E6F0FA). Never show broken image icons.

### People avatars

- Photo if available (from `PEOPLE_PHOTOS`)
- Initials (2 chars) on a consistent tint per initial letter bucket:
  - A–F: `brand50`/`brand900`
  - G–M: `amber50`/`amber900`  
  - N–Z: `neutral100`/`neutral700`

### Illustrations

None in the main UI. Empty states use a single small icon (20–24px) on a tinted rounded square — no clip art, no decorative SVG scenes.

---

## 3.8 Motion

### Durations

| Event | Duration | Easing |
|---|---|---|
| Hover / press feedback | 120ms | ease |
| Icon button press | 120ms | ease |
| Enter (dialog, toast, sheet) | 180ms | ease-out |
| Exit (dialog, toast, sheet) | 180ms | ease-in |
| Sheet slide up / down | 240ms | ease-out / ease-in |
| Tab indicator slide | 150ms | ease-out |
| Skeleton shimmer | 1200ms cycle | ease-in-out |

### Properties
- Animate **only** `opacity` and `transform` (translateY, scale). Never animate layout properties.

### Where motion appears
1. Dialog/sheet enter: `opacity 0→1 + translateY 12→0`
2. Toast enter: `translateY -20→0 + opacity 0→1`, exit: `translateY 0→-20 + opacity 1→0`
3. Hover on nav items: background color (no transform)
4. Pressed state: `opacity 0.85` (instant)
5. Skeleton shimmer: opacity pulse 0.5→1→0.5
6. Tab active indicator: position transition

### Reduced motion
```css
@media (prefers-reduced-motion: reduce) {
  /* all transitions become instant or opacity-only */
}
```
React Native: `AccessibilityInfo.isReduceMotionEnabled()` → skip animations, show final state immediately.

**No** decorative or looping animation (no floating particles, no pulsing dots, no intro sequences).

---

## 3.9 Voice and microcopy

### Tone
Warm, direct, specific. Address owners by first name when natural. Use the pet's name: "Bingo's vaccine is due in 3 days."

### Buttons
Always start with a verb. Active, specific:
- ✓ `Book a visit`, `Confirm payment`, `Send`, `Check in`, `Mark as missed`, `Upload proof`
- ✗ `OK`, `Submit`, `Proceed`, `Yes`

### Errors
Say what happened and what to do next. Never blame the user. Never say "Invalid" alone.
- ✓ "Enter the email on your account."
- ✓ "That code doesn't match. Check the message and try again."
- ✗ "Invalid email."

### Empty states
Say what will appear there, then offer the primary action:
- "No upcoming visits. Book a check-up, vaccine or consultation — open times are confirmed right away."
- "No patients yet. Patients appear here once their first appointment is booked."

### Numbers and money
- Peso: `₱1,250.00` (always two decimals in bills/receipts); `₱1,250` (whole, in list rows and KPI tiles if no cents)
- Times: `9:30 AM` not `09:30` or `9:30am`
- Dates: `Tue, Nov 17` or relative: `Today`, `Tomorrow`, `in 3 days`, `2 days ago`

---

## 4. Components

### Button

| Variant | Background | Text | Border |
|---|---|---|---|
| `primary` | `accentDeep` (#142747) | white | — |
| `soft` | `brand50` (#E6F0FA) | `accentDeep` | — |
| `line` | white | `accentDeep` | `borderDefault` |
| `ghost` | transparent | `accentDeep` | transparent |
| `danger` | white | `#B91C1C` | `#F5B9B3` |
| `dangerFill` | `#B91C1C` | white | — |
| `link` | transparent | `accent` | transparent |

**Sizes:**

| Size | Height | H-padding | Font | Radius |
|---|---|---|---|---|
| `sm` | 32px | 12px | 13px/600 | 8 |
| `md` | 40px | 16px | 14px/600 | 10 |
| `lg` | 48px | 20px | 15px/600 | 10 |

**States:** default, hover (10% darker bg), focus-visible (2px ring `#4F82B8`, 2px offset), pressed (opacity 0.85), disabled (opacity 0.38), loading (spinner replaces text, keeps width).

**Icon:** 16px (sm), 18px (md/lg). Gap 8px. Icon-only: square, tooltip + aria-label required.

**Full-width:** only on phone, in footer action bars. Never full-width on desktop except auth forms.

---

### Input / Field

**Height:** 46px (single line), auto-height multiline (min 90px).  
**Radius:** 8px.  
**Border:** `borderDefault` default → `accentDeep` focus → `#EF4444` error.  
**Padding:** 12px horizontal, 10px vertical.  
**Label:** above, `label` token (13px/500/ink2). Required fields: red asterisk after label.  
**Placeholder:** format hints only ("0917 555 0142"), not repeating the label.  
**Helper text:** below, 12px/ink3.  
**Error text:** below (replaces helper), 12px/danger text, with `alert-circle` icon (13px).  
**Validation:** on blur; errors clear as user types.

**Variants:**
- Text, password (show/hide toggle), phone (+63 prefix display), search (search icon left), textarea, select/inline picker, date picker, time slot grid, OTP (6 boxes), file dropzone.

**OTP:** 6 boxes, 46px wide × 54px tall each, 8px gap, `borderDefault`, focus `accentDeep`, auto-advance on digit entry.

**File dropzone:** 160px min-height, dashed border, upload-cloud icon (24px), "Tap to choose a file" label. Shows file name + size after selection. Shows image preview (200px) for image uploads.

---

### Pill / Badge / Status

**Pill (inline):** dot (6px) + text (`bodySmall` token). No container. Dot color = status icon color.  
**Chip (with bg):** dot + text in a rounded container: `borderRadius: 6`, `paddingH: 10`, `height: 26`. Background and text color from semantic tokens.  
**Count badge:** 18px height, min-width 18px, `borderRadius: 999`, white text, 11px/700. Colors: `accentDeep` (default), `dot` (urgent: `#E5484D`).

Color is never the only signal — the text label always accompanies the dot or background.

---

### Data table

**Row height:** comfortable 56px, compact 44px. Use comfortable for all owner/patient-facing tables; compact for admin dense views.  
**Header:** `surfaceSunken` background, `tableHeader` font (12px/600/ink3), 12px v-padding. Sticky on scroll.  
**Hover row:** `hover` (#F4F7FB) background, 120ms transition.  
**Clickable row:** `chevron-right` (16px, ink3) at the end. Full row is a pressable target.  
**Numbers:** `textAlign: 'right'` in amount columns. Tabular numerals.  
**Sort:** clickable column headers with `chevrons-up-down` icon (12px). Active sort shows direction arrow.  
**Empty:** centered `Empty` component spanning all columns.  
**Loading:** 5 skeleton rows at the correct height.  
**Phone:** becomes a stacked list (`Group` of `Row` items). No horizontal scroll.  
**Radius:** outer container 8px. No radius on individual rows.

---

### Dialog and bottom sheet

**Desktop:** centered modal, max-width 480px (confirmations) or 600px (forms), radius 12.  
**Phone:** bottom sheet, top radius 16px.  
**Structure:** title (h2), body (body/bodySmall), footer (row of buttons, right-aligned on desktop, full-width stacked on phone).  
**Close button:** top-right, 36×36 icon-only button, `x` icon.  
**Behavior:** Escape closes; focus trapped; focus returns to trigger on close.  
**Scrim:** `surfaceOverlay` (`rgba(20,39,71,0.42)`).  
**Animation:** enter translateY(16→0) + opacity(0→1) 180ms ease-out; exit reverse 180ms ease-in.

**Confirmation dialog:** names the specific entity ("Cancel Bingo's visit on Tue, Nov 17?"), danger button on the right.

---

### Empty state

Small icon (22px) on a 52×52 `borderRadius:16` `brand50` tile.  
H3 title (centered). One-line explanation (`bodySmall`, centered, `maxWidth: 300`).  
Optional primary action button.  
`paddingVertical: 36`.

---

### Stat / KPI tile

| Element | Style |
|---|---|
| Value | `display` token (36px desktop, 28px phone), tabular numerals |
| Label | `bodySmall` token |
| Context line | `caption` token (optional: change %, sub-metric) |
| Alert state | value color → `danger text` |
| Hover | `hover` background if pressable |

Arranged in a `StatGrid` — hairline-bordered strip, 2×2 on phone, single row on desktop/tablet.

---

### Sidebar (staff/admin, full desktop)

```
┌────────────────────────────┐
│  [Logo]           256px    │ ← brand area, 76px
├────────────────────────────┤
│  [item] Today              │ ← nav item, 40px, r8, gap 2px
│  [item] Schedule           │
│  [item] Patients           │
│  [item] Messages      [3]  │
│  [item] Billing       [2]  │
│  [item] Due list           │
│  ─ Administration ─        │ ← 11px/uppercase/ink3
│  [item] Setup              │
│  [item] Users & staff      │
│  [item] Activity log       │
├────────────────────────────┤
│  [Bell] Notifications      │ ← bottom area
│  [Avatar] Name / Role      │
│  [LogOut] Log out          │
└────────────────────────────┘
```

Active item: `brand50` background, `accentDeep` text, 2.0 stroke icon.  
Hover item: `hover` (#F4F7FB).  
Label: 14.5px/500/ink (default), 14.5px/600/accentDeep (active).

**Rail (tablet, 72px):**
- Icon centered (22px) + label below (11px/500/ink2)
- Active: `brand50` background
- Badge: 8px dot on icon (no count)
- Group separator: hairline divider

---

### Phone tab bar

5 tabs max. Height 60px + safe-area inset.  
Active indicator: 52×30 pill with `brand50` background behind the icon.  
Active icon: `accentDeep`, 2.0 stroke. Inactive: `ink2`, 1.8 stroke.  
Label: 11px/500, `ink2` inactive, `accentDeep` active.  
Badge: 8px dot, top-right of icon pill.  
Background: `surface` (#FFFFFF), top 1px `borderStrong`.  
Touch target: 44px minimum.

---

### Chat

**Message bubble:** mine — `accentDeep` bg, white text, right-aligned, `r8` with `r2` bottom-right; theirs — `neutral100` bg, `ink` text, left-aligned, `r8` with `r2` bottom-left.  
**Grouping:** consecutive same-sender messages within 60s share the flat corner treatment.  
**Timestamp:** `caption` centered, only shown when gap > 5 minutes.  
**Day separator:** hairline with centered date chip.  
**Input bar:** `surface`, top 1px border, 48px min-height, search radius, `send` icon button.  
**Unread:** bold name in conversation list, unread count badge.

---

### Calendar

Month grid. 7 columns.  
**Today:** `accentDeep` background, white text.  
**Selected:** `accent` border (2px), `brand50` background.  
**Has appointment:** 4px dot below the day number, `accent` color.  
**Disabled/past:** `ink3` text, `opacity: 0.5`.  
**Month navigation:** `<` and `>` icon buttons, 40×40.

---

### Time slot grid

Slots grouped by **Morning** and **Afternoon** (overline label).  
**Available:** `surface`, `borderDefault` border.  
**Selected:** `brand50` background, `accentDeep` border (2px), `accentDeep` text.  
**Full/booked:** `surfaceSunken`, `ink3` text, `opacity: 0.6`. Not pressable.  
**Past:** same as full.  
Grid: 3 columns on desktop/tablet, 2 on phone. Each slot: `height: 48`, `borderRadius: 8`.

---

### Toast

Bottom of screen (phone) or top-right (desktop). Max-width 400px.  
Slide in from edge, auto-dismiss 4s.  
Variants: success (`ok`), error (`bad`), info.  
Structure: leading icon (18px) + text (body/14px) + optional close button.  
Does not cover primary actions.

---

### Stepper (booking wizard)

Horizontal on desktop/tablet, horizontal compact on phone.  

```
  ●━━━━━○━━━━━○━━━━━○
  Pet    Service  Date    Review
```

Done step: filled `accentDeep` circle (22px), `accentDeep` connector line.  
Active step: `surface` circle with `accentDeep` 2px border, label bold.  
Future step: `borderDefault` circle, `ink3` label.  
No numbered markers — the fill/border state communicates progress.

---

## 5. Screen-by-screen direction

### Owner

**Home:**
- Greeting: `h1` token + first name. Subline: date + next appointment info. Left-aligned.
- Pet cards: photo (4:3) top, name + sex mark + breed/age + status pill below. 200px min-width in AutoGrid. Add Pet card: dashed border, plus icon, same size.
- Next visit card: DateTile (calendar-page style, `accentDeep` month strip, large day number) + service + pet + status pill + chevron. Full-width card, not a strip.
- ActionStrip on desktop: 4 cards in a 2×2 grid (phone) or horizontal row (desktop). "Book a visit" card uses `accentDeep` background. Desktop cards: 180px min-width, 2 rows of text (title + subtitle).
- Attention section: `Group` with dividers, no extra boxing.
- Clinic card: `BrandTile` + name + address + open/closed status pill + Call and Directions buttons.

**Pet profile:**
- Full-width cover photo (16:9, full bleed, no border radius at top).
- Name, species/breed, age, sex (SexMark), weight, birthday — in a 2-col `KV` grid below the photo.
- Tabs: Info / History / Reminders / Files. Underline style.
- History: timeline layout — left side date tile, right side visit summary card. Connecting vertical line in `borderDefault`.
- Reminders: list rows with due-date status chip and "Mark done" action.
- Files: grid of file tiles (icon + filename + date + size).

**Booking (4-step wizard):**
- Step 1 — Pet: grid of pet cards (same as home).
- Step 2 — Service: radio-style picker cards with service name, description, price.
- Step 3 — Date & time: month calendar + time slot grid. Morning / Afternoon overline labels.
- Step 4 — Review: summary card of selected pet + service + date/time + clinic. "Confirm booking" primary CTA.
- Selected pet and service stay visible in a sticky summary bar at the top (desktop) or bottom (phone) throughout steps 2–4.
- Confirmation screen: large `check-circle` in success green, appointment details, "View appointment" and "Back to home" actions.

**Pay bill:**
- Amount: `display` token (36px), prominent at top.
- Method tiles: GCash / Maya / Bank — icon + label, border-select style (like radio cards).
- After method selection: QR code (centered, 220px), account details in `KV`, copy buttons on each value.
- Steps section: numbered list (this is an actual sequence: scan → enter amount → take screenshot → upload). Numbers 01–03 as overline labels are correct here — it is a sequence.
- Upload: `FileDropzone` with preview. Status tracking: `Pill` updating from "Unpaid" → "Checking payment" → "Paid".

**Messages:**
- Clinic header: `BrandTile` + clinic name + opening hours status.
- Chat bubbles per spec above.
- Input bar sticky at bottom.

**Bills:**
- List of bills: `DataTable` on tablet/desktop, `Group` rows on phone.
- Bill detail: amount, date, service, pet, status history timeline.
- Receipt: printable layout with logo, clinic details, itemized breakdown.

**Clinic info:**
- Address with directions button.
- Phone with call button.
- Opening hours: 7-row schedule, today highlighted.
- Map embed placeholder (or link to Google Maps).

**Profile & settings:**
- Settings layout: grouped sections with dividers. No extra card boxing.
- Edit name, email, phone, password.

---

### Staff

**Today (home):**
- Summary strip at top: count chips for each queue state (Upcoming X, Checked In X, In Consultation X, Done X).
- Queue grouped by status sections (`overline` labels). Each appointment: time, pet, owner, service, status chip, check-in button.
- Missed/overdue: `danger` row tint or danger pill, clearly differentiated.
- One-tap "Check in" button on upcoming rows (opens confirmation dialog).

**Schedule:**
- `SegControl` for List / Calendar views.
- `Chips` for Today / Upcoming / Past / All filter.
- Search field.
- List: `DataTable` (time, pet, owner, service, status, action).
- Calendar: month grid with dot indicators.

**Appointment detail:**
- Pet avatar + name + breed/age + owner name.
- Appointment info: date, time, service, reason, status.
- Primary actions: "Check in" / "Start consultation" / "Mark as missed" — contextual by current status. Each destructive action opens a confirmation dialog.
- History block: previous visits for this pet.

**Consultation form:**
- Reason for visit (pre-filled from appointment), editable.
- Findings textarea.
- Follow-up section: add vaccine/deworming reminders with dates.
- "Save consultation" primary CTA.

**Patients:**
- Pets table: photo, name, species, breed, age, owner, status, last visit. Searchable.
- Owners table: name, phone, pets count, last visit, internal notes indicator.

**Owner record:**
- Owner info + pets list + visit history + internal notes (textarea, save action).

**Billing:**
- Tabs: To verify / Unpaid / Paid.
- To verify: each bill shows payment proof thumbnail, reference number, amount, owner, "Confirm" and "Reject" buttons.
- Create bill: line items (service + amount) with dynamic "Add item" row. Live total. Owner picker.

**Due list:**
- Sections: Overdue (danger), Due soon (warning), Done (success, collapsed).
- Each row: pet name + owner + reminder type + due date + contact actions (call, message).

---

### Admin

**Overview:**
- KPI row (5 tiles): collected today (₱), this month (₱), appointments today (#), payments to verify (#), overdue follow-ups (#).
  - Tile for "Collected today" is the primary KPI — slightly larger `display` number.
  - Alert tiles (payments to verify > 0, overdue > 0) use `danger text` for the number.
- Charts:
  - Collections trend: bar chart, 7 days, `accent` bars, gridlines, peso axis labels.
  - Visits by service: horizontal bar chart, one color (`accentDeep`), service labels on left.
- Today's schedule: `ScheduleTable` (compact 44px rows, up to 10, link to full schedule).
- Staff activity: last 4 actions, `ago()` timestamps.
- Shortcuts: `QuickActions` group for Messages, Billing, Due list, Activity.

**Reports:**
- Daily / Monthly toggle (`SegControl`).
- Bar chart: collections per day/month.
- Summary table: total collected, total appointments, top services.
- Due/overdue summary.

**Setup:**
- Left sub-nav on desktop (Categories: Clinic, Services, Hours, Reminders, Payment). Becomes a list picker on phone.
- Each settings page: sections with dividers, editable fields, "Save changes" at the bottom.

**Users & staff:**
- Table: avatar, name, role, status, last active, edit/deactivate actions.
- Add/edit form: name, email, phone, role selector.

**Activity log:**
- Filterable timeline: date pickers, role filter.
- Each entry: `ago()` timestamp, action text, actor name + avatar.

---

### Auth & shared

**Welcome (phone):**
- Logo at top.
- Headline: "Your pets' care, all in one place." — sentence case, `h1` token (30px/700), `ink` color. **No accent color on the second line.**
- Body lede: 15px/400/ink2.
- Pet illustration: circular soft background (`brand50`), no decorative blobs. Illustration sits in the center.
- "Log in" primary button (full-width, navy).
- "Create a pet owner account" `line` button (full-width).
- "Explore Demo Accounts" collapsible: accordion, same as before but styled as a proper Card with the 3 demo account rows.

**Welcome (desktop) — left panel:**
- Background: `brand900` (#142747, navy). **Not soft blue.**
- Logo (white variant) at top.
- Pet illustration, centered (white/light on dark background).
- Tagline: "Manage every visit, record and reminder for your clinic and the pets it cares for." — descriptive, not slogany. White on navy.
- No decorative blobs.

**Login:**
- `Tabs` for Email / Mobile.
- Email: email field + password field (show/hide) + forgot password link.
- Mobile: phone field → send code → 6-box OTP input.
- Demo credentials: replaced with the demo accordion from Welcome, collapsed by default, using the same styled card format. Not a plain tinted Card with a text wall.

**Sign up / Verify / Reset:** short, one task per screen, `Stepper` on reset password.

**Notifications:**
- Grouped: Today / Earlier (overline labels).
- Unread: bold title + `accentDeep` left border on row.
- "Mark all read" button in page header.

**Profile & settings:**
- Grouped settings with dividers.
- Logout button at the bottom, `danger` variant.

---

## 6. Non-negotiables

All items from the brief preserved:
- Every route and URL unchanged.
- Demo login accounts and "Reset demo data" kept.
- `localStorage` persistence unchanged.
- Back/forward and direct URL navigation unchanged.
- Real file pickers.
- Role-based navigation.
- No new business features.
- No new dependencies without explanation.

**Font dependency:** `expo-font` is already in the Expo SDK — no new package. Web font via Google Fonts CDN link in `index.html`. React Native font loading via `useFonts` in App entry.

---

## 7. Code quality

- All design values come from `src/theme.ts`. No hard-coded hex values in screens.
- Font family added to all type tokens: `fontFamily: 'PlusJakartaSans'`.
- Shared components in `src/components/` are reused and not duplicated.
- Dead styles replaced, not commented out.
- Files stay at ≤ 600 lines. Split if needed.

---

## 8. Implementation phases

1. **Tokens + font + base components** — `theme.ts`, `index.html`, `App.tsx` (font load), `ui.tsx`, `overlays.tsx`, `responsive.tsx`
2. **Owner screens** — `owner.tsx`, `pets.tsx`, `appointments.tsx`, `billing.tsx`, `messages.tsx`
3. **Staff screens** — `clinic.tsx`, `appointments.tsx` (shared views)
4. **Admin screens** — `admin.tsx`
5. **Auth & shared screens** — `auth.tsx`, `common.tsx`, Shell updates, navbar updates
6. **Phone polish** — test at 360px, touch target pass, bottom sheet behavior, sticky action bars

TypeCheck (`npm run typecheck`) passes after each phase.
