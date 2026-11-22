// Design tokens v5: "The Care Line" (2026 redesign).
// Warm linen paper, navy ink, clinic blue for anything you can act on, and one living accent (calamansi) that only
// marks "now": today on a care line, the current queue slot, the selected item. Depth comes from tone and hairlines,
// not shadows. Bricolage Grotesque carries headlines; Geist carries text and numbers.
export const FONT = 'Geist';
export const DISPLAY = 'Bricolage Grotesque';

export const colors = {
  // Surfaces: paper on linen, separated by hairlines
  bg: '#F3F2EE',          // linen: the page
  surface: '#FBFAF7',     // paper: raised areas, inputs
  subtle: '#ECEAE4',      // pressed / quiet fills
  hover: '#E7E5DE',
  line: '#E2DFD7',        // hairline rule
  lineStrong: '#CBC7BC',  // input borders, stronger rules

  // Ink: navy-black text, AA on linen and paper
  ink: '#13213B',
  ink2: '#4C576B',
  ink3: '#6B7383',

  // Brand
  blue: '#4F82B8',         // clinic blue: care line, illustration, large marks
  accent: '#2D5F96',       // interactive blue: links, focus, selected text (AA on linen)
  accentMid: '#4F82B8',
  accentDeep: '#142747',   // brand navy: primary buttons, sidebar ink
  accentSoft: '#E3EBF4',   // blue wash for selected rows

  // "Now": calamansi. Always paired with navy, never carries text on its own.
  now: '#D4E157',
  nowSoft: '#F1F5CF',

  // Status: earthy, readable, distinct from the brand blue
  okBg: '#E4EFE6',   ok: '#2E6E4E',
  warnBg: '#F5EAD6', warn: '#8A5A12',
  badBg: '#F5E1DC',  bad: '#A8392A',
  infoBg: '#E3EBF4', info: '#2D5F96',

  // Legacy accent names, folded into the new palette so older screens stay coherent
  warmOrange: '#8A5A12',  tileOrange: '#F5EAD6',
  teal: '#2D5F96',        tileTeal: '#E3EBF4',
  violet: '#2D5F96',      tileViolet: '#E3EBF4',
  emerald: '#2E6E4E',     tileEmerald: '#E4EFE6',
  rose: '#A8392A',        tileRose: '#F5E1DC',
  sky: '#2D5F96',         tileSky: '#E3EBF4',

  dot: '#C2412D',
  scrim: 'rgba(19,33,59,0.42)',
};

// Staff and admin sidebar: a deeper tone of the same paper, not a navy slab.
export const sidebar = {
  bg: '#E9E7E0',
  border: '#DCD9D0',
  itemHover: 'rgba(19,33,59,0.05)',
  itemActive: '#FBFAF7',
  itemActiveBorder: '#D4E157',
  text: '#4C576B',
  textActive: '#13213B',
  textMuted: '#6B7383',
  icon: '#6B7383',
  iconActive: '#142747',
  badge: '#142747',
};

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 };
// Tighter radii: content is ruled, not boxed. Photos get the generous corners.
export const radius = { sm: 6, md: 8, lg: 10, xl: 14, pill: 999 };
export const MAX_W = 760;

// No resting shadows. Kept as objects so existing spreads keep compiling.
export const shadow = { shadowColor: '#13213B', shadowOpacity: 0, shadowRadius: 0, shadowOffset: { width: 0, height: 0 }, elevation: 0 };
// Floating layers only (menus, sheets): one soft, low shadow.
export const shadowPop = { shadowColor: '#13213B', shadowOpacity: 0.12, shadowRadius: 24, shadowOffset: { width: 0, height: 8 }, elevation: 8 };

// Type scale (major third from 15): 12 · 13 · 15 · 17 · 20 · 26 · 34 · 44 · 60
export const type = {
  hero:    { fontFamily: DISPLAY, fontSize: 60, lineHeight: 62, fontWeight: '600' as const, letterSpacing: -2.2, color: colors.ink },
  display: { fontFamily: DISPLAY, fontSize: 34, lineHeight: 38, fontWeight: '600' as const, letterSpacing: -1, color: colors.ink },
  h1:      { fontFamily: DISPLAY, fontSize: 26, lineHeight: 30, fontWeight: '600' as const, letterSpacing: -0.6, color: colors.ink },
  h2:      { fontFamily: FONT, fontSize: 17, lineHeight: 23, fontWeight: '600' as const, letterSpacing: -0.2, color: colors.ink },
  h3:      { fontFamily: FONT, fontSize: 15, lineHeight: 21, fontWeight: '600' as const, color: colors.ink },
  body:    { fontFamily: FONT, fontSize: 15, lineHeight: 23, color: colors.ink },
  small:   { fontFamily: FONT, fontSize: 13, lineHeight: 19, color: colors.ink2 },
  label:   { fontFamily: FONT, fontSize: 13.5, lineHeight: 18, fontWeight: '500' as const, color: colors.ink },
  eyebrow: { fontFamily: FONT, fontSize: 13, lineHeight: 18, fontWeight: '500' as const, color: colors.ink3 },
  num:     { fontFamily: FONT, fontVariant: ['tabular-nums'] as ('tabular-nums')[] },
};

export type Tone = '' | 'ok' | 'warn' | 'bad' | 'info';
export const toneColors = (t: Tone) =>
  t === 'ok'   ? { bg: colors.okBg,   fg: colors.ok   }
  : t === 'warn' ? { bg: colors.warnBg, fg: colors.warn }
  : t === 'bad'  ? { bg: colors.badBg,  fg: colors.bad  }
  : t === 'info' ? { bg: colors.infoBg, fg: colors.info }
  : { bg: colors.subtle, fg: colors.ink2 };
