// Responsive building blocks for the web app: breakpoints, two-column layouts and data tables.
// mobile < 768 px (phones), tablet 768–1199 px (collapsed sidebar), desktop >= 1200 px (full sidebar).
import React from 'react';
import { Platform, Pressable, StyleProp, StyleSheet, Text, View, ViewStyle, useWindowDimensions } from 'react-native';
import { colors, shadow, FONT } from '../theme';
import { Icon } from './Icon';

export type BP = 'mobile' | 'tablet' | 'desktop';
export const bpOf = (w: number): BP => (w >= 1200 ? 'desktop' : w >= 768 ? 'tablet' : 'mobile');
export function useBP() {
  const { width } = useWindowDimensions();
  const bp = bpOf(width);
  return { bp, width, mobile: bp === 'mobile', tablet: bp === 'tablet', desktop: bp === 'desktop', wide: bp !== 'mobile' };
}

/** Horizontal page padding per breakpoint. Shared by pages and the owner navbar so their edges line up. */
export const pagePad = (bp: BP) => (bp === 'desktop' ? 40 : bp === 'tablet' ? 28 : 16);
/** Page max width (padding included). Wide pages are dashboards and lists; narrow pages are details and forms. */
export const pageMax = (bp: BP, wide: boolean) => (bp === 'desktop' ? (wide ? 1240 : 880) : bp === 'tablet' ? (wide ? 1100 : 760) : undefined);

/** Web-only pressable state (RN-web adds `hovered`). */
export type PState = { pressed: boolean; hovered?: boolean; focused?: boolean };
export const hoverBg = (st: PState, base?: string) => (st.pressed ? colors.subtle : st.hovered ? colors.hover : base);

/**
 * Responsive card grid: fits as many columns as `min` allows and gives every item the same width,
 * so a short last row does not stretch.
 */
export function AutoGrid({ children, min = 240, gap = 16, max }: { children: React.ReactNode; min?: number; gap?: number; max?: number }) {
  const [w, setW] = React.useState(0);
  const items = React.Children.toArray(children).filter(Boolean);
  let cols = w ? Math.max(1, Math.floor((w + gap) / (min + gap))) : 1;
  if (max) cols = Math.min(cols, max);
  const itemW = w ? (w - gap * (cols - 1)) / cols : undefined;
  return (
    <View onLayout={e => setW(Math.floor(e.nativeEvent.layout.width))} style={{ flexDirection: 'row', flexWrap: 'wrap', gap }}>
      {w > 0 && items.map((c, i) => <View key={i} style={{ width: itemW }}>{c}</View>)}
    </View>
  );
}

/**
 * Two (or three) columns on wide screens, stacked on phones. `ratio` gives flex weights;
 * a number above 50 is read as a fixed pixel width (handy for side panels).
 */
export function Cols({ children, ratio = [2, 1], gap = 24, stackBelow = 'tablet', style }: {
  children: React.ReactNode; ratio?: number[]; gap?: number; stackBelow?: 'tablet' | 'desktop'; style?: StyleProp<ViewStyle>;
}) {
  const { bp } = useBP();
  const items = React.Children.toArray(children).filter(Boolean);
  const stack = bp === 'mobile' || (stackBelow === 'desktop' && bp === 'tablet');
  if (stack) return <View style={[{ gap }, style]}>{items}</View>;
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'flex-start', gap }, style]}>
      {items.map((c, i) => {
        const r = ratio[i] ?? 1;
        return <View key={i} style={r > 50 ? { width: r, flexShrink: 0, gap: 24 } : { flex: r, minWidth: 0, gap: 24 }}>{c}</View>;
      })}
    </View>
  );
}

export interface Col<T> {
  key: string; label: string; flex?: number; width?: number; align?: 'left' | 'right';
  render: (row: T) => React.ReactNode; /** Hidden on tablets to keep rows readable. */ wideOnly?: boolean;
}

/** Table for tablets and desktops. Phones keep the row lists each screen already has. */
export function DataTable<T>({ columns, rows, keyOf, onRowPress, rowLabel, empty }: {
  columns: Col<T>[]; rows: T[]; keyOf: (r: T) => string; onRowPress?: (r: T) => void; rowLabel?: (r: T) => string; empty?: React.ReactNode;
}) {
  const { desktop } = useBP();
  const cols = columns.filter(c => desktop || !c.wideOnly);
  const cell = (c: Col<T>): ViewStyle => (c.width ? { width: c.width, flexShrink: 0 } : { flex: c.flex ?? 1, minWidth: 0 });
  return (
    <View style={t.wrap} accessibilityRole={Platform.OS === 'web' ? ('table' as never) : undefined}>
      <View style={t.head}>
        {cols.map(c => <View key={c.key} style={[cell(c), c.align === 'right' && { alignItems: 'flex-end' }]}><Text style={t.th} numberOfLines={1}>{c.label}</Text></View>)}
        {onRowPress && <View style={{ width: 18 }} />}
      </View>
      {rows.length === 0 && empty}
      {rows.map((r, i) => {
        const inner = (
          <>
            {cols.map(c => {
              const v = c.render(r);
              return (
                <View key={c.key} style={[cell(c), c.align === 'right' && { alignItems: 'flex-end' }]}>
                  {typeof v === 'string' || typeof v === 'number' ? <Text style={t.td} numberOfLines={1}>{v}</Text> : v}
                </View>
              );
            })}
            {onRowPress && <Icon name="chevR" size={16} color={colors.ink3} />}
          </>
        );
        return onRowPress
          ? <Pressable key={keyOf(r)} onPress={() => onRowPress(r)} accessibilityRole="button" accessibilityLabel={rowLabel?.(r)}
              style={(st: PState) => [t.row, i > 0 && t.rowLine, { backgroundColor: hoverBg(st) }]}>{inner}</Pressable>
          : <View key={keyOf(r)} style={[t.row, i > 0 && t.rowLine]}>{inner}</View>;
      })}
    </View>
  );
}

/** Two-line cell: bold title and muted subtitle. */
export const Cell = ({ title, sub, left }: { title: string; sub?: string; left?: React.ReactNode }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minWidth: 0 }}>
    {left}
    <View style={{ flex: 1, minWidth: 0 }}>
      <Text style={[t.td, { fontWeight: '600' }]} numberOfLines={1}>{title}</Text>
      {!!sub && <Text style={t.sub} numberOfLines={1}>{sub}</Text>}
    </View>
  </View>
);

const t = StyleSheet.create({
  wrap: { backgroundColor: colors.surface, borderRadius: 10, borderWidth: 1, borderColor: colors.line, overflow: 'hidden' },
  head: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 20, height: 40, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.line },
  th: { fontFamily: FONT, fontSize: 12.5, fontWeight: '500', color: colors.ink3 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 20, minHeight: 64, paddingVertical: 10 },
  rowLine: { borderTopWidth: 1, borderTopColor: colors.line },
  td: { fontFamily: FONT, fontSize: 14, color: colors.ink },
  sub: { fontFamily: FONT, fontSize: 12.5, color: colors.ink2, marginTop: 2 },
});
