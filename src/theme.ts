// Design tokens v4 — premium redesign.
// Dark navy sidebar, Plus Jakarta Sans, vibrant blue accents, saturated semantic colors.
export const FONT = 'Plus Jakarta Sans';

export const colors = {
  // ── Surfaces ──────────────────────────────────────────────────────────────
  bg: '#F7F9FC',
  surface: '#FFFFFF',
  subtle: '#EEF2F8',
  hover: '#E8EEF7',
  line: '#DDE3ED',
  lineStrong: '#C5CEDF',

  // ── Text ──────────────────────────────────────────────────────────────────
  ink: '#0F172A',      // richer than #1F2937
  ink2: '#64748B',     // slate-500
  ink3: '#94A3B8',     // slate-400

  // ── Brand ─────────────────────────────────────────────────────────────────
  accent: '#2F7DE1',       // vibrant interactive blue (up from #4F82B8)
  accentMid: '#4F82B8',    // kept for focus rings and secondary use
  accentDeep: '#142747',   // navy — primary CTA bg, unchanged
  accentSoft: '#EBF4FF',   // selected / highlight wash

  // ── Status ────────────────────────────────────────────────────────────────
  okBg: '#ECFDF5',   ok: '#059669',
  warnBg: '#FFFBEB', warn: '#D97706',
  badBg: '#FEF2F2',  bad: '#DC2626',
  infoBg: '#EFF6FF', info: '#1D4ED8',

  // ── Vibrant accent tones (stat tiles, variety) ────────────────────────────
  warmOrange: '#F97316',  tileOrange: '#FFF4ED',
  teal: '#0891B2',        tileTeal: '#E9F8FC',
  violet: '#7C3AED',      tileViolet: '#F3F0FF',
  emerald: '#059669',     tileEmerald: '#ECFDF5',
  rose: '#E11D48',        tileRose: '#FFF1F2',
  sky: '#0284C7',         tileSky: '#E0F2FE',

  // ── Misc ──────────────────────────────────────────────────────────────────
  dot: '#EF4444',
  scrim: 'rgba(10,20,40,0.52)',
};

// Dark sidebar — staff & admin only (owners keep white top-nav)
export const sidebar = {
  bg: '#1B3A6B',
  border: 'rgba(255,255,255,0.11)',
  itemHover: 'rgba(255,255,255,0.07)',
  itemActive: 'rgba(47,125,225,0.22)',   // blue tint (GeneX-style), not white
  itemActiveBorder: '#2F7DE1',           // left accent bar on active item
  text: 'rgba(255,255,255,0.68)',
  textActive: '#FFFFFF',
  textMuted: 'rgba(255,255,255,0.32)',
  icon: 'rgba(255,255,255,0.5)',
  iconActive: '#7EC8F5',                 // bright light-blue for active icon
  badge: '#2F7DE1',
};

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 };
export const radius = { sm: 8, md: 10, lg: 12, xl: 16, pill: 999 };
export const MAX_W = 760;

export const shadow = {
  shadowColor: '#0A1628', shadowOpacity: 0.07,
  shadowRadius: 12, shadowOffset: { width: 0, height: 2 }, elevation: 2,
};
export const shadowPop = {
  shadowColor: '#0A1628', shadowOpacity: 0.18,
  shadowRadius: 28, shadowOffset: { width: 0, height: 10 }, elevation: 10,
};

export const type = {
  display: { fontFamily: FONT, fontSize: 32, lineHeight: 38, fontWeight: '700' as const, letterSpacing: -0.8, color: colors.ink },
  h1:      { fontFamily: FONT, fontSize: 22, lineHeight: 28, fontWeight: '600' as const, letterSpacing: -0.4, color: colors.ink },
  h2:      { fontFamily: FONT, fontSize: 17, lineHeight: 23, fontWeight: '600' as const, letterSpacing: -0.2, color: colors.ink },
  h3:      { fontFamily: FONT, fontSize: 15, lineHeight: 21, fontWeight: '600' as const, color: colors.ink },
  body:    { fontFamily: FONT, fontSize: 15, lineHeight: 23, color: colors.ink },
  small:   { fontFamily: FONT, fontSize: 13, lineHeight: 19, color: colors.ink2 },
  label:   { fontFamily: FONT, fontSize: 13, lineHeight: 18, fontWeight: '500' as const, color: colors.ink2 },
  eyebrow: { fontFamily: FONT, fontSize: 11, lineHeight: 15, fontWeight: '600' as const, letterSpacing: 0.5, color: colors.ink3, textTransform: 'uppercase' as const },
};

export type Tone = '' | 'ok' | 'warn' | 'bad' | 'info';
export const toneColors = (t: Tone) =>
  t === 'ok'   ? { bg: colors.okBg,   fg: colors.ok   }
  : t === 'warn' ? { bg: colors.warnBg, fg: colors.warn }
  : t === 'bad'  ? { bg: colors.badBg,  fg: colors.bad  }
  : t === 'info' ? { bg: colors.infoBg, fg: colors.info }
  : { bg: colors.subtle, fg: colors.ink2 };
