// Shared building blocks (design system v3). Every screen is composed from these so all roles look the same.
// Principles: white cards with a hairline border and one soft shadow, one navy for actions, status as dot + text,
// one radius scale (8 / 12 / 16 / 20), sentence-case labels.
import React from 'react';
import {
  ActivityIndicator, Animated, Image, ImageSourcePropType, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleProp, StyleSheet, Text,
  TextInput, TextInputProps, View, ViewStyle, useWindowDimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, shadow, space, toneColors, type, Tone, FONT } from '../theme';
import { Icon, IconName } from './Icon';
import { initials } from '../utils/format';
import { PEOPLE_PHOTOS } from '../data/photos';
import { useBP, hoverBg, pageMax, pagePad, PState } from './responsive';

/** Space kept free at the bottom of tab pages on phones so content clears the tab bar. */
export const TAB_SPACE = 84;
/** Height of the phone bottom tab bar (without the safe-area inset). */
export const TAB_BAR_H = 60;

/* ---------- layout ---------- */
/** True on tablets and wide screens. */
export const useWide = () => useWindowDimensions().width >= 768;

export function Screen({ title, back = true, right, children, footer, scroll = true, big, padTop = true, hideHeader, tabbed, bg, wide: wideProp, sub, centerFooter, bleed }: {
  title?: string; back?: boolean; right?: React.ReactNode; children: React.ReactNode; footer?: React.ReactNode;
  scroll?: boolean; big?: boolean; padTop?: boolean; hideHeader?: boolean; tabbed?: boolean; bg?: string;
  /** Use the wide content width on desktops (dashboards and lists). Tab pages are wide by default. */ wide?: boolean;
  /** Short description under the page title on wide screens. */ sub?: string; centerFooter?: boolean;
  /** Phones only: let non-scrolling content run edge to edge (chat). */ bleed?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const { bp, mobile } = useBP();
  const isWide = wideProp ?? (big || hideHeader);
  const padX = pagePad(bp);
  const cap: ViewStyle = { width: '100%', maxWidth: pageMax(bp, !!isWide), alignSelf: 'center', paddingHorizontal: padX };
  const head = !hideHeader && (mobile
    ? <View style={[cap, { paddingHorizontal: 0 }]}><Header title={title} back={back} right={right} big={big} /></View>
    : <View style={[cap, { paddingTop: 32, paddingBottom: 4 }]}><PageHeader title={title} back={back} right={right} sub={sub} /></View>);
  // Phones keep a sticky action bar; on wider screens actions sit at the end of the page, like a web form.
  const inlineFooter = !mobile && footer && scroll;
  return (
    <View style={[s.screen, { paddingTop: insets.top }, bg ? { backgroundColor: bg } : null]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {scroll ? (
          <ScrollView contentContainerStyle={[{ paddingBottom: 56 }, tabbed && mobile && { paddingBottom: TAB_SPACE + 24 + insets.bottom }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={!mobile}>
            {head}
            <View style={[s.scroll, cap, !padTop && { paddingTop: 0 }, !mobile && { paddingTop: 20, gap: 32 }, hideHeader && !mobile && { paddingTop: 32 }]}>
              {children}
              {inlineFooter && <View style={[s.inlineFooter, centerFooter && { borderTopWidth: 0 }]}><View style={[s.inlineActions, centerFooter && { alignSelf: 'center' }]}>{footer}</View></View>}
            </View>
          </ScrollView>
        ) : <>{head}<View style={[{ flex: 1 }, cap, !mobile && { paddingTop: 16 }, bleed && mobile && { paddingHorizontal: 0 }]}>{children}</View></>}
        {footer && !inlineFooter && <View style={[s.footerWrap, { paddingBottom: Math.max(insets.bottom, 12) }]}><View style={[s.footer, cap, { paddingHorizontal: 0 }]}>{footer}</View></View>}
      </KeyboardAvoidingView>
    </View>
  );
}

export function Header({ title, back = true, right, big }: { title?: string; back?: boolean; right?: React.ReactNode; big?: boolean }) {
  const nav = useNavigation();
  const canBack = back && nav.canGoBack();
  if (big) return (
    <View style={[s.header, { paddingTop: 14, paddingBottom: 4 }]}>
      <Text style={[s.bigTitle, { flex: 1 }]} numberOfLines={1} accessibilityRole="header">{title}</Text>
      {right}
    </View>
  );
  return (
    <View style={s.header}>
      <View style={{ width: 72, alignItems: 'flex-start' }}>
        {canBack && <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => nav.goBack()} hitSlop={10} style={({ pressed }) => [s.back, pressed && { opacity: 0.5 }]}>
          <Icon name="chevL" size={24} color={colors.ink} />
        </Pressable>}
      </View>
      <Text style={[s.headerTitle, { flex: 1, textAlign: 'center' }]} numberOfLines={1} accessibilityRole="header">{title}</Text>
      <View style={{ minWidth: 72, alignItems: 'flex-end' }}>{right}</View>
    </View>
  );
}

/** Desktop and tablet page title: back link, left-aligned title, actions on the right. */
export function PageHeader({ title, back = true, right, sub }: { title?: string; back?: boolean; right?: React.ReactNode; sub?: string }) {
  const nav = useNavigation();
  const canBack = back && nav.canGoBack();
  return (
    <View style={{ gap: 12 }}>
      {canBack && (
        <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => nav.goBack()}
          style={(st: PState) => [s.backLink, st.hovered && { backgroundColor: colors.hover }]}>
          <Icon name="chevL" size={16} color={colors.ink2} /><Text style={{ fontFamily: FONT, fontSize: 13.5, fontWeight: '500', color: colors.ink2 }}>Back</Text>
        </Pressable>
      )}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, minHeight: 44 }}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={s.pageTitle} numberOfLines={1} accessibilityRole="header">{title}</Text>
          {sub && <Text style={[type.small, { fontSize: 14.5, lineHeight: 20, marginTop: 4 }]}>{sub}</Text>}
        </View>
        {right}
      </View>
    </View>
  );
}

export const Stack = ({ gap = space.lg, children, style }: { gap?: number; children: React.ReactNode; style?: StyleProp<ViewStyle> }) =>
  <View style={[{ gap }, style]}>{children}</View>;
export const RowView = ({ gap = space.sm, children, style, wrap }: { gap?: number; children: React.ReactNode; style?: StyleProp<ViewStyle>; wrap?: boolean }) =>
  <View style={[{ flexDirection: 'row', alignItems: 'center', gap }, wrap && { flexWrap: 'wrap' }, style]}>{children}</View>;
export const Divider = ({ inset = 0 }: { inset?: number }) => <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.line, marginLeft: inset }} />;

/* ---------- text ---------- */
export const T = {
  Display: (p: { children: React.ReactNode }) => <Text style={type.display}>{p.children}</Text>,
  H1: (p: { children: React.ReactNode }) => <Text style={type.h1}>{p.children}</Text>,
  H2: (p: { children: React.ReactNode }) => <Text style={type.h2}>{p.children}</Text>,
  H3: (p: { children: React.ReactNode; numberOfLines?: number }) => <Text style={type.h3} numberOfLines={p.numberOfLines}>{p.children}</Text>,
  Body: (p: { children: React.ReactNode; muted?: boolean }) => <Text style={[type.body, p.muted && { color: colors.ink2 }]}>{p.children}</Text>,
  Small: (p: { children: React.ReactNode; color?: string; numberOfLines?: number }) => <Text style={[type.small, p.color ? { color: p.color } : null]} numberOfLines={p.numberOfLines}>{p.children}</Text>,
  Eyebrow: (p: { children: React.ReactNode }) => <Text style={type.eyebrow}>{p.children}</Text>,
};

/* ---------- buttons ---------- */
type BtnKind = 'primary' | 'soft' | 'line' | 'ghost' | 'danger' | 'dangerFill';
export function Btn({ label, onPress, kind = 'primary', icon, iconRight, small, disabled, full, loading, style }: {
  label: string; onPress?: () => void; kind?: BtnKind; icon?: IconName; iconRight?: IconName; small?: boolean; disabled?: boolean; full?: boolean; loading?: boolean; style?: StyleProp<ViewStyle>;
}) {
  const k = BTN[kind];
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} disabled={disabled || loading} onPress={onPress}
      style={(st: PState) => [s.btn, small && s.btnSm, { backgroundColor: st.hovered && k.hover ? k.hover : k.bg, borderColor: k.border }, full && { alignSelf: 'stretch' }, disabled && { opacity: 0.4 }, st.pressed && { opacity: 0.85 }, style]}>
      {loading ? <ActivityIndicator color={k.fg} /> : <>
        {icon && <Icon name={icon} size={small ? 16 : 18} color={k.fg} strokeWidth={2.1} />}
        <Text style={[s.btnText, small && { fontSize: 13.5 }, { color: k.fg }]} numberOfLines={1}>{label}</Text>
        {iconRight && <Icon name={iconRight} size={small ? 16 : 18} color={k.fg} strokeWidth={2.1} />}
      </>}
    </Pressable>
  );
}
const BTN: Record<BtnKind, { bg: string; fg: string; border: string; hover?: string }> = {
  primary:    { bg: colors.accentDeep, fg: '#fff',        border: colors.accentDeep, hover: '#1A3461' },
  soft:       { bg: colors.accentSoft, fg: colors.accentDeep, border: colors.accentSoft, hover: '#D9EAFF' },
  line:       { bg: colors.surface,    fg: colors.accentDeep, border: colors.lineStrong, hover: colors.hover },
  ghost:      { bg: 'transparent',     fg: colors.accentDeep, border: 'transparent',    hover: colors.hover },
  danger:     { bg: colors.surface,    fg: colors.bad,    border: '#F5C6C6',            hover: '#FFF5F5' },
  dangerFill: { bg: colors.bad,        fg: '#fff',        border: colors.bad,            hover: '#B91C1C' },
};

export function IconBtn({ name, onPress, label, badge, count, size = 22, framed }: { name: IconName; onPress?: () => void; label: string; badge?: boolean; count?: number; size?: number; framed?: boolean }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={count ? `${label}, ${count} unread` : label} onPress={onPress} hitSlop={6}
      style={(st: PState) => [s.iconBtn, framed && s.iconBtnFramed, st.hovered && { backgroundColor: colors.hover }, st.pressed && { opacity: 0.55 }]}>
      <Icon name={name} size={size} color={colors.ink} />
      {!!count && <View style={s.iconCount}><Text style={s.countText}>{count > 9 ? '9+' : count}</Text></View>}
      {badge && !count && <View style={s.badge} />}
    </Pressable>
  );
}

export function LinkBtn({ label, onPress, icon }: { label: string; onPress: () => void; icon?: boolean }) {
  return (
    <Pressable onPress={onPress} hitSlop={8} accessibilityRole="button" style={(st: PState) => [{ flexDirection: 'row', alignItems: 'center', gap: 2, paddingVertical: 2 }, st.hovered && { opacity: 0.75 }, st.pressed && { opacity: 0.5 }]}>
      <Text style={{ fontFamily: FONT, color: colors.accentDeep, fontWeight: '600', fontSize: 13.5 }}>{label}</Text>
      {icon !== false && <Icon name="chevR" size={15} color={colors.accentDeep} />}
    </Pressable>
  );
}

/* ---------- containers ---------- */
export function Card({ children, style, tint, onPress, label }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; tint?: boolean; onPress?: () => void; label?: string }) {
  const { wide } = useBP();
  const base = [s.card, wide && { padding: 20 }, tint && s.cardTint];
  return onPress
    ? <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} style={(st: PState) => [...base, style, st.hovered && { borderColor: colors.lineStrong }, st.pressed && { backgroundColor: colors.subtle }]}>{children}</Pressable>
    : <View style={[...base, style]}>{children}</View>;
}

export function Group({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const items = React.Children.toArray(children).filter(Boolean);
  return <View style={[s.group, style]}>{items.map((c, i) => <View key={i}>{i > 0 && <Divider inset={space.lg} />}{c}</View>)}</View>;
}

export function Row({ title, sub, left, right, onPress, chevron, icon, unread, subLines = 1, titleLines = 1, danger, action }: {
  title: string; sub?: string; left?: React.ReactNode; right?: React.ReactNode; onPress?: () => void; chevron?: boolean;
  icon?: IconName; unread?: boolean; subLines?: number; titleLines?: number; danger?: boolean;
  /** A button shown at the end of the row, beside (not inside) the pressable area, so buttons never nest. */ action?: React.ReactNode;
}) {
  const inner = (
    <>
      {unread && <View style={s.unreadDot} />}
      {left ?? (icon ? <IconTile name={icon} danger={danger} /> : null)}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[s.rowTitle, danger && { color: colors.bad }, unread && { fontWeight: '700' }]} numberOfLines={titleLines}>{title}</Text>
        {!!sub && <Text style={s.rowSub} numberOfLines={subLines}>{sub}</Text>}
      </View>
      {right}
      {onPress && chevron !== false && !right && !action && <Icon name="chevR" size={18} color={colors.ink3} />}
    </>
  );
  if (action) return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingRight: space.lg, gap: 12 }}>
      {onPress
        ? <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={sub ? `${title}, ${sub}` : title} style={(st: PState) => [s.row, { flex: 1, paddingRight: 0, backgroundColor: hoverBg(st) }]}>{inner}</Pressable>
        : <View style={[s.row, { flex: 1, paddingRight: 0 }]}>{inner}</View>}
      {action}
    </View>
  );
  return onPress
    ? <Pressable onPress={onPress} accessibilityRole="button" style={(st: PState) => [s.row, { backgroundColor: hoverBg(st) }]}>{inner}</Pressable>
    : <View style={s.row}>{inner}</View>;
}

/** Rounded-square icon tile used in rows, menus and action cards. */
export function IconTile({ name, size = 36, danger, tone, solid }: { name: IconName; size?: number; danger?: boolean; tone?: Tone; solid?: boolean }) {
  const c = danger ? { bg: colors.badBg, fg: colors.bad } : tone ? toneColors(tone) : { bg: colors.subtle, fg: colors.accentDeep };
  return (
    <View style={{ width: size, height: size, borderRadius: Math.round(size * 0.3), backgroundColor: solid ? colors.accentDeep : c.bg, alignItems: 'center', justifyContent: 'center' }}>
      <Icon name={name} size={Math.round(size * 0.5)} color={solid ? '#fff' : c.fg} strokeWidth={2} />
    </View>
  );
}

export function Section({ title, action, onAction, children, sub }: { title: string; action?: string; onAction?: () => void; children?: React.ReactNode; sub?: string }) {
  return (
    <View style={{ gap: space.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, minHeight: 24 }}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={s.sectionTitle} accessibilityRole="header">{title}</Text>
          {!!sub && <Text style={[type.small, { marginTop: 2 }]}>{sub}</Text>}
        </View>
        {action && onAction && <LinkBtn label={action} onPress={onAction} />}
      </View>
      {children}
    </View>
  );
}

/** Status as a small dot and colored text. Replaces filled pills, which made screens noisy. */
export function Pill({ text, tone = '', chip }: { text: string; tone?: Tone; chip?: boolean }) {
  const c = tone ? toneColors(tone).fg : colors.ink2;
  if (chip) return (
    <View style={[s.chipPill, { backgroundColor: tone ? toneColors(tone).bg : colors.subtle }]}>
      <View style={[s.pillDot, { backgroundColor: c }]} />
      <Text style={[s.pillText, { color: c, fontSize: 12.5 }]} numberOfLines={1}>{text}</Text>
    </View>
  );
  return (
    <View style={s.pill}>
      <View style={[s.pillDot, { backgroundColor: tone ? c : colors.ink3 }]} />
      <Text style={[s.pillText, { color: c }]} numberOfLines={1}>{text}</Text>
    </View>
  );
}

/** Small numeric badge (unread, to pay). */
export const CountBadge = ({ n, tone = 'dot' }: { n: number; tone?: 'dot' | 'navy' }) => n > 0
  ? <View style={[s.count, tone === 'navy' && { backgroundColor: colors.accentDeep }]}><Text style={s.countText}>{n > 99 ? '99+' : n}</Text></View>
  : null;

/** One metric inside a StatGrid. */
export function Stat({ value, label, onPress, alert }: { value: string | number; label: string; onPress?: () => void; alert?: boolean; dark?: boolean; icon?: IconName }) {
  return (
    <Pressable disabled={!onPress} onPress={onPress} accessibilityRole={onPress ? 'button' : undefined} accessibilityLabel={`${label}: ${value}`} style={(st: PState) => [s.stat, onPress && { backgroundColor: hoverBg(st) }]}>
      <Text style={[s.statValue, alert && { color: colors.bad }]} numberOfLines={1}>{value}</Text>
      <Text style={[type.small, { fontSize: 12.5 }]} numberOfLines={2}>{label}</Text>
    </Pressable>
  );
}
/** Metrics in one bordered strip: 2×2 on phones, one row on tablets. */
export function StatGrid({ children }: { children: React.ReactNode }) {
  const wide = useWide();
  const items = React.Children.toArray(children).filter(Boolean);
  const perRow = wide ? items.length : 2;
  const rows: React.ReactNode[][] = [];
  items.forEach((c, i) => { (rows[Math.floor(i / perRow)] ||= []).push(c); });
  return (
    <View style={s.group}>
      {rows.map((r, ri) => (
        <View key={ri} style={[{ flexDirection: 'row' }, ri > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line }]}>
          {r.map((c, ci) => <View key={ci} style={[{ flex: 1 }, ci > 0 && { borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: colors.line }]}>{c}</View>)}
        </View>
      ))}
    </View>
  );
}

/** Row of shortcut actions. */
export function QuickActions({ items }: { items: [label: string, icon: IconName, onPress: () => void, badge?: number][] }) {
  const { wide } = useBP();
  if (wide) return (
    <Group>{items.map(([l, i, fn, n]) => (
      <Row key={l} icon={i} title={l} onPress={fn} right={n ? <CountBadge n={n} /> : undefined} />
    ))}</Group>
  );
  return (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      {items.map(([l, i, fn, n]) => (
        <Pressable key={l} onPress={fn} accessibilityRole="button" accessibilityLabel={l} style={(st: PState) => [s.qa, { backgroundColor: hoverBg(st, colors.surface) }]}>
          <View>
            <Icon name={i} size={20} color={colors.accentDeep} />
            {!!n && <View style={s.qaBadge}><Text style={s.countText}>{n}</Text></View>}
          </View>
          <Text style={{ fontFamily: FONT, fontSize: 12, lineHeight: 15, minHeight: 30, fontWeight: '500', color: colors.ink, textAlign: 'center' }} numberOfLines={2}>{l}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export function Empty({ icon = 'info', title, sub, action }: { icon?: IconName; title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <View style={s.empty}>
      <View style={s.emptyIcon}><Icon name={icon} size={22} color={colors.accent} /></View>
      <Text style={[type.h3, { textAlign: 'center' }]}>{title}</Text>
      {sub && <Text style={[type.small, { textAlign: 'center', maxWidth: 300 }]}>{sub}</Text>}
      {action && <View style={{ marginTop: 8 }}>{action}</View>}
    </View>
  );
}

export function KV({ rows }: { rows: ([string, string | undefined] | false | null | undefined)[] }) {
  const r = rows.filter(Boolean) as [string, string | undefined][];
  return (
    <View>
      {r.map(([k, v], i) => (
        <View key={k} style={[s.kv, i === r.length - 1 && { borderBottomWidth: 0 }]}>
          <Text style={[type.small, { fontSize: 14 }]}>{k}</Text>
          <Text style={s.kvValue}>{v || '—'}</Text>
        </View>
      ))}
    </View>
  );
}

export function Banner({ icon = 'info', title, sub, tone = '', action }: { icon?: IconName; title: string; sub?: string; tone?: Tone; action?: React.ReactNode }) {
  const c = tone ? toneColors(tone) : { bg: colors.subtle, fg: colors.ink2 };
  return (
    <View style={[s.banner, { backgroundColor: c.bg }]} accessibilityRole={tone === 'bad' ? 'alert' : undefined}>
      <Icon name={icon} size={18} color={tone ? c.fg : colors.accentDeep} />
      <View style={{ flex: 1 }}>
        <Text style={[type.h3, { fontSize: 14, color: tone ? c.fg : colors.ink }]}>{title}</Text>
        {sub && <Text style={[type.small, { color: tone ? c.fg : colors.ink2, marginTop: 2, opacity: tone ? 0.9 : 1 }]}>{sub}</Text>}
      </View>
      {action}
    </View>
  );
}

/** Quiet helper line with an icon, for policies and tips under a section. */
export function Hint({ icon = 'info', children }: { icon?: IconName; children: React.ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
      <View style={{ paddingTop: 1 }}><Icon name={icon} size={15} color={colors.ink3} /></View>
      <Text style={[type.small, { flex: 1 }]}>{children}</Text>
    </View>
  );
}

export function Avatar({ name, size = 40, photo }: { name: string; size?: number; photo?: ImageSourcePropType }) {
  const src = photo || PEOPLE_PHOTOS[name];
  if (src) return <Image source={src} accessibilityIgnoresInvertColors style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors.subtle }} />;
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontFamily: FONT, color: colors.accentDeep, fontWeight: '600', fontSize: size * 0.36 }}>{initials(name)}</Text>
    </View>
  );
}

/** Placeholder block shown while a screen "loads". */
export function Skeleton({ h = 16, w = '100%', r = radius.md, style }: { h?: number; w?: number | `${number}%`; r?: number; style?: StyleProp<ViewStyle> }) {
  const op = React.useRef(new Animated.Value(0.5)).current;
  React.useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(op, { toValue: 1, duration: 600, useNativeDriver: Platform.OS !== 'web' }),
      Animated.timing(op, { toValue: 0.5, duration: 600, useNativeDriver: Platform.OS !== 'web' }),
    ])); loop.start(); return () => loop.stop();
  }, [op]);
  return <Animated.View style={[{ height: h, width: w, borderRadius: r, backgroundColor: '#E9EDF3', opacity: op }, style]} />;
}
const loaded = new Set<string>();
/** True for a short moment the first time a screen opens in a session (shows the loading state). */
export function useFirstLoad(key: string, ms = 550) {
  const [loading, setLoading] = React.useState(!loaded.has(key));
  React.useEffect(() => { if (!loading) return; const t = setTimeout(() => { loaded.add(key); setLoading(false); }, ms); return () => clearTimeout(t); }, [key, loading, ms]);
  return loading;
}

/* ---------- selection controls ---------- */
/** Underline tabs (content sections inside a page). */
export function Tabs<K extends string>({ options, value, onChange }: { options: [K, string, number?][]; value: K; onChange: (k: K) => void }) {
  return (
    <View style={s.tabs} accessibilityRole="tablist">
      {options.map(([k, l, n]) => {
        const on = k === value;
        return (
          <Pressable key={k} accessibilityRole="tab" accessibilityLabel={l} accessibilityState={{ selected: on }} onPress={() => onChange(k)} style={(st: PState) => [s.tab, on && s.tabOn, !on && st.hovered && { borderBottomColor: colors.lineStrong }]}>
            <Text style={[s.tabText, on && { color: colors.accentDeep, fontWeight: '600' }]} numberOfLines={1}>{l}</Text>
            {!!n && <View style={s.count}><Text style={s.countText}>{n}</Text></View>}
          </Pressable>
        );
      })}
    </View>
  );
}

/** Segmented control for switching a list's filter (Upcoming / Past, All / Unread). */
export function SegControl<K extends string>({ options, value, onChange, style }: { options: [K, string, number?][]; value: K; onChange: (k: K) => void; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[s.segc, style]} accessibilityRole="tablist">
      {options.map(([k, l, n]) => {
        const on = k === value;
        return (
          <Pressable key={k} onPress={() => onChange(k)} accessibilityRole="tab" accessibilityLabel={l} accessibilityState={{ selected: on }}
            style={(st: PState) => [s.segcItem, on ? s.segcOn : st.hovered ? { backgroundColor: 'rgba(255,255,255,0.6)' } : null]}>
            <Text style={[s.segcText, on && { color: colors.accentDeep, fontWeight: '600' }]} numberOfLines={1}>{l}</Text>
            {n != null && n > 0 && <Text style={[s.segcN, on && { color: colors.accentDeep }]}>{n}</Text>}
          </Pressable>
        );
      })}
    </View>
  );
}

export function Chips<K extends string>({ options, value, onChange }: { options: [K, string, number?][]; value: K; onChange: (k: K) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm, paddingHorizontal: space.lg }} style={{ marginHorizontal: -space.lg, flexGrow: 0 }}>
      {options.map(([k, l, n]) => {
        const on = k === value;
        return (
          <Pressable key={k} onPress={() => onChange(k)} accessibilityRole="button" accessibilityState={{ selected: on }} style={(st: PState) => [s.chip, on && s.chipOn, !on && st.hovered && { borderColor: colors.lineStrong }]}>
            <Text style={[s.chipText, on && { color: '#fff' }]}>{l}{n != null ? <Text style={{ color: on ? 'rgba(255,255,255,0.7)' : colors.ink3 }}>{`  ${n}`}</Text> : null}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

export function Seg<K extends string>({ label, options, value, onChange, error, wrap }: { label?: string; options: [K, string][]; value?: K; onChange: (k: K) => void; error?: string; wrap?: boolean }) {
  return (
    <View style={{ gap: 8 }}>
      {label && <Text style={type.label}>{label}</Text>}
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: wrap ? 'wrap' : 'nowrap' }}>
        {options.map(([k, l]) => {
          const on = k === value;
          return (
            <Pressable key={k} onPress={() => onChange(k)} accessibilityRole="radio" accessibilityState={{ selected: on }}
              style={(st: PState) => [s.seg, wrap && { flexBasis: '30%', flexGrow: 1 }, on ? s.segOn : st.hovered ? { borderColor: colors.lineStrong } : null]}>
              <Text style={[s.segText, on && { color: colors.accentDeep, fontWeight: '600' }]} numberOfLines={1}>{l}</Text>
            </Pressable>
          );
        })}
      </View>
      {error && <FieldError text={error} />}
    </View>
  );
}

export function Toggle({ value, onChange, label }: { value: boolean; onChange: () => void; label: string }) {
  return (
    <Pressable accessibilityRole="switch" accessibilityLabel={label} accessibilityState={{ checked: value }} onPress={onChange} hitSlop={8}
      style={[s.sw, value && { backgroundColor: colors.accentDeep }]}>
      <View style={[s.swKnob, value && { transform: [{ translateX: 18 }] }]} />
    </Pressable>
  );
}

export function Check({ value, onChange, label, error }: { value: boolean; onChange: () => void; label: string; error?: string }) {
  return (
    <View style={{ gap: 6 }}>
      <Pressable onPress={onChange} accessibilityRole="checkbox" accessibilityState={{ checked: value }} style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
        <View style={[s.check, value && { backgroundColor: colors.accentDeep, borderColor: colors.accentDeep }]}>{value && <Icon name="check" size={14} color="#fff" strokeWidth={2.6} />}</View>
        <Text style={[type.body, { flex: 1, fontSize: 14, lineHeight: 20 }]}>{label}</Text>
      </Pressable>
      {error && <FieldError text={error} />}
    </View>
  );
}

/* ---------- inputs ---------- */
export function Field({ label, error, hint, icon, secure, style, ...p }: TextInputProps & { label?: string; error?: string; hint?: string; icon?: IconName; secure?: boolean; style?: StyleProp<ViewStyle> }) {
  const [show, setShow] = React.useState(false);
  const [focus, setFocus] = React.useState(false);
  return (
    <View style={[{ gap: 6 }, style]}>
      {label && <Text style={type.label}>{label}</Text>}
      <View style={[s.inp, p.multiline && s.inpMulti, focus && s.inpFocus, !!error && s.inpErr, p.editable === false && { backgroundColor: colors.subtle }]}>
        {icon && <Icon name={icon} size={18} color={colors.ink3} />}
        <TextInput placeholderTextColor={colors.ink3} {...p} secureTextEntry={secure && !show}
          onFocus={e => { setFocus(true); p.onFocus?.(e); }} onBlur={e => { setFocus(false); p.onBlur?.(e); }}
          style={[s.inpText, p.multiline && { minHeight: 72, textAlignVertical: 'top', paddingTop: 0 }]} />
        {secure && <Pressable onPress={() => setShow(x => !x)} hitSlop={10} accessibilityLabel="Show or hide password"><Icon name={show ? 'eyeoff' : 'eye'} size={18} color={colors.ink3} /></Pressable>}
      </View>
      {error ? <FieldError text={error} /> : hint ? <Text style={[type.small, { fontSize: 12.5 }]}>{hint}</Text> : null}
    </View>
  );
}
export const FieldError = ({ text }: { text: string }) => (
  <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}><Icon name="alert" size={13} color={colors.bad} /><Text style={[type.small, { fontSize: 12.5, color: colors.bad, flex: 1 }]}>{text}</Text></View>
);

/** Pick-one list shown inline. Used instead of native pickers so it looks the same on every phone. */
export function Picker<K extends string>({ label, options, value, onChange, error }: { label?: string; options: [K, string, string?][]; value?: K; onChange: (k: K) => void; error?: string }) {
  return (
    <View style={{ gap: 8 }}>
      {label && <Text style={type.label}>{label}</Text>}
      <View style={[s.group, !!error && { borderColor: colors.bad }]}>
        {options.map(([k, l, sub], i) => {
          const on = k === value;
          return (
            <View key={k}>
              {i > 0 && <Divider inset={space.lg} />}
              <Pressable onPress={() => onChange(k)} style={[s.pickRow, on && { backgroundColor: colors.accentSoft }]} accessibilityRole="radio" accessibilityState={{ selected: on }}>
                <View style={{ flex: 1 }}>
                  <Text style={s.rowTitle}>{l}</Text>
                  {sub && <Text style={s.rowSub}>{sub}</Text>}
                </View>
                <View style={[s.radio, on && { borderColor: colors.accentDeep }]}>{on && <View style={s.radioDot} />}</View>
              </Pressable>
            </View>
          );
        })}
      </View>
      {error && <FieldError text={error} />}
    </View>
  );
}

const HAIR = StyleSheet.hairlineWidth;
export const s = StyleSheet.create({
  screen:        { flex: 1, backgroundColor: colors.bg },
  scroll:        { paddingHorizontal: space.lg, paddingTop: space.md, paddingBottom: 40, gap: space.xxl },
  footerWrap:    { paddingHorizontal: space.lg, paddingTop: 12, backgroundColor: colors.surface, borderTopWidth: HAIR, borderTopColor: colors.line },
  footer:        { flexDirection: 'row', gap: 10 },
  inlineFooter:  { paddingTop: 24, borderTopWidth: 1, borderTopColor: colors.line },
  inlineActions: { flexDirection: 'row', gap: 12, width: '100%', maxWidth: 440, alignSelf: 'flex-end' },

  // Page headers
  pageTitle:   { fontFamily: FONT, fontSize: 26, lineHeight: 32, fontWeight: '600', color: colors.ink, letterSpacing: -0.5 },
  backLink:    { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', paddingVertical: 4, paddingLeft: 4, paddingRight: 10, marginLeft: -6, borderRadius: 8 },
  header:      { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: space.lg, paddingVertical: 6, minHeight: 52 },
  headerTitle: { fontFamily: FONT, fontSize: 17, fontWeight: '600', color: colors.ink, letterSpacing: -0.2 },
  bigTitle:    { fontFamily: FONT, fontSize: 24, lineHeight: 30, fontWeight: '700', color: colors.ink, letterSpacing: -0.5 },
  sectionTitle: { fontFamily: FONT, fontSize: 15, lineHeight: 20, fontWeight: '600', color: colors.ink },
  back: { width: 36, height: 36, alignItems: 'flex-start', justifyContent: 'center', marginLeft: -4 },

  // Buttons
  btn:    { height: 42, borderRadius: radius.md, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, flexShrink: 1 },
  btnSm:  { height: 34, paddingHorizontal: 13, borderRadius: 8 },
  btnText: { fontFamily: FONT, fontSize: 14, fontWeight: '600' },

  // Icon buttons
  iconBtn:       { width: 38, height: 38, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  iconBtnFramed: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, ...shadow },
  badge:         { position: 'absolute', top: 7, right: 7, width: 8, height: 8, borderRadius: 4, backgroundColor: colors.dot, borderWidth: 1.5, borderColor: colors.surface },
  iconCount:     { position: 'absolute', top: 3, right: 2, minWidth: 17, height: 17, borderRadius: 9, paddingHorizontal: 4, backgroundColor: colors.dot, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: colors.surface },

  // Containers
  card:     { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, padding: space.lg, ...shadow },
  cardTint: { backgroundColor: colors.subtle, borderColor: colors.subtle, shadowOpacity: 0, elevation: 0 },
  group:    { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, overflow: 'hidden', ...shadow },
  qa:       { flex: 1, alignItems: 'center', gap: 7, paddingVertical: 12, paddingHorizontal: 4, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, ...shadow },
  qaBadge:  { position: 'absolute', top: -6, right: -10, minWidth: 17, height: 17, borderRadius: 9, backgroundColor: colors.dot, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },

  // Rows
  row:        { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: space.lg, minHeight: 56 },
  rowTitle:   { fontFamily: FONT, fontSize: 14.5, fontWeight: '500', color: colors.ink },
  rowSub:     { fontFamily: FONT, fontSize: 13, color: colors.ink2, marginTop: 2, lineHeight: 18 },
  unreadDot:  { position: 'absolute', left: 6, top: '50%', marginTop: -3, width: 6, height: 6, borderRadius: 3, backgroundColor: colors.accent },

  // Pills / badges
  pill:     { flexDirection: 'row', alignItems: 'center', gap: 5 },
  pillDot:  { width: 6, height: 6, borderRadius: 3 },
  pillText: { fontFamily: FONT, fontSize: 12.5, fontWeight: '600' },
  chipPill: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', paddingHorizontal: 9, height: 24, borderRadius: 6 },

  // Stats
  stat:      { paddingVertical: 16, paddingHorizontal: 18, gap: 4, minHeight: 84 },
  statValue: { fontFamily: FONT, fontSize: 28, fontWeight: '700', color: colors.ink, letterSpacing: -0.8 },

  // Empty / misc
  empty:     { alignItems: 'center', gap: 6, paddingVertical: 36, paddingHorizontal: 20 },
  emptyIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  kv:        { flexDirection: 'row', justifyContent: 'space-between', gap: 16, paddingVertical: 12, borderBottomWidth: HAIR, borderBottomColor: colors.line },
  kvValue:   { fontFamily: FONT, fontSize: 14, fontWeight: '500', color: colors.ink, textAlign: 'right', flexShrink: 1 },
  banner:    { flexDirection: 'row', gap: 12, alignItems: 'flex-start', borderRadius: radius.md, padding: 14 },

  // Tabs & segmented controls
  tabs:     { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.line },
  tab:      { flex: 1, height: 44, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6, borderBottomWidth: 2, borderBottomColor: 'transparent', marginBottom: -1 },
  tabOn:    { borderBottomColor: colors.accentDeep },
  tabText:  { fontFamily: FONT, fontSize: 14, fontWeight: '500', color: colors.ink2 },
  segc:     { flexDirection: 'row', alignSelf: 'flex-start', backgroundColor: colors.subtle, borderRadius: 10, padding: 3, gap: 2 },
  segcItem: { height: 32, paddingHorizontal: 14, borderRadius: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  segcOn:   { backgroundColor: colors.surface, ...shadow, shadowOpacity: 0.07 },
  segcText: { fontFamily: FONT, fontSize: 13.5, fontWeight: '500', color: colors.ink2 },
  segcN:    { fontFamily: FONT, fontSize: 12, fontWeight: '600', color: colors.ink3 },
  count:    { minWidth: 18, height: 18, borderRadius: 9, backgroundColor: colors.dot, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  countText: { fontFamily: FONT, color: '#fff', fontSize: 10.5, fontWeight: '700' },
  chip:     { height: 32, paddingHorizontal: 13, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, justifyContent: 'center' },
  chipOn:   { backgroundColor: colors.accentDeep, borderColor: colors.accentDeep },
  chipText: { fontFamily: FONT, fontSize: 13, fontWeight: '500', color: colors.ink },
  seg:      { flex: 1, height: 42, borderRadius: 8, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  segOn:    { backgroundColor: colors.accentSoft, borderColor: colors.accentDeep },
  segText:  { fontFamily: FONT, fontSize: 14, fontWeight: '500', color: colors.ink },

  // Toggle & checkbox
  sw:      { width: 44, height: 26, borderRadius: 13, backgroundColor: colors.lineStrong, padding: 3 },
  swKnob:  { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff' },
  check:   { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: colors.lineStrong, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },

  // Inputs
  inp:      { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 46, paddingHorizontal: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.lineStrong, borderRadius: 8 },
  inpMulti: { alignItems: 'flex-start', paddingVertical: 13 },
  inpFocus: { borderColor: colors.accent },
  inpErr:   { borderColor: colors.bad },
  inpText:  { fontFamily: FONT, flex: 1, fontSize: 15, color: colors.ink, paddingVertical: 0, minWidth: 0, outlineStyle: 'none' } as never,
  pickRow:  { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, paddingHorizontal: space.lg },
  radio:    { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: colors.lineStrong, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.accentDeep },
});
