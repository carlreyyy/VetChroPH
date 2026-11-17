export const colors = {
  bg: '#F8FAFC',          // brand background
  surface: '#FFFFFF',
  subtle: '#F1F6FC',      // pale tint between background and light blue
  line: '#E5EAF1',
  lineStrong: '#D2DAE5',
  ink: '#1F2937',         // brand main text
  ink2: '#6B7280',        // brand muted text
  ink3: '#9CA3AF',
  accent: '#4F82B8',      // brand secondary blue (accents, large headline words, icons)
  accentDeep: '#142747',  // brand primary navy (buttons, key actions)
  accentSoft: '#E6F0FA',  // brand light blue (selected states, highlights)
  okBg: '#E7F6EC',
  ok: '#1E7A4C',
  warnBg: '#FDF4E3',
  warn: '#A15C07',
  badBg: '#FCEEEC',
  bad: '#C0392B',
  infoBg: '#E6F0FA',
  info: '#142747',
  dot: '#E5484D',
  scrim: 'rgba(20,39,71,0.42)',
};

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24 };
export const radius = { sm: 8, md: 10, lg: 12, xl: 14, pill: 999 };
export const MAX_W = 760;
export const shadow = { shadowColor: '#142747', shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 1 };

export const type = {
  display: { fontSize: 24, lineHeight: 30, fontWeight: '700' as const, letterSpacing: -0.5, color: colors.ink },
  h1: { fontSize: 20, lineHeight: 26, fontWeight: '700' as const, letterSpacing: -0.3, color: colors.ink },
  h2: { fontSize: 16, lineHeight: 22, fontWeight: '600' as const, letterSpacing: -0.1, color: colors.ink },
  h3: { fontSize: 15, lineHeight: 20, fontWeight: '600' as const, color: colors.ink },
  body: { fontSize: 15, lineHeight: 22, color: colors.ink },
  small: { fontSize: 13, lineHeight: 18, color: colors.ink2 },
  label: { fontSize: 13, lineHeight: 18, fontWeight: '500' as const, color: colors.ink2 },
  eyebrow: { fontSize: 12, lineHeight: 16, fontWeight: '600' as const, letterSpacing: 0.4, color: colors.ink3, textTransform: 'uppercase' as const },
};

export type Tone = '' | 'ok' | 'warn' | 'bad' | 'info';
export const toneColors = (t: Tone) =>
  t === 'ok' ? { bg: colors.okBg, fg: colors.ok }
  : t === 'warn' ? { bg: colors.warnBg, fg: colors.warn }
  : t === 'bad' ? { bg: colors.badBg, fg: colors.bad }
  : t === 'info' ? { bg: colors.infoBg, fg: colors.info }
  : { bg: colors.subtle, fg: colors.ink2 };
