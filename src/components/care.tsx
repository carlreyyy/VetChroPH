// The Care Line: VetChroPH's signature element.
// A thin line through time. Filled dots are visits that happened, the calamansi marker is today, open rings are
// what comes next. The same language shows up on the welcome page, each pet, the staff queue and reports, so the
// app reads as one chronicle of care.
//
// Also here: HealthRing (a pet photo wrapped in its status ring: whole = up to date, half = due soon,
// broken = overdue) and the helpers that turn store data into care-line nodes.
import React from 'react';
import { Image, StyleSheet, Text, View, ViewStyle, StyleProp } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors, FONT, DISPLAY } from '../theme';
import { PET_PHOTOS } from '../data/photos';
import { Icon } from './Icon';
import type { DB, Pet } from '../types';
import { diff, fmtDS, followStatus, isUpcoming, t12 } from '../utils/format';

/* ---------- health status ---------- */
export type Health = 'ok' | 'soon' | 'overdue' | 'off';
export const HEALTH_COLOR: Record<Health, string> = { ok: colors.ok, soon: colors.warn, overdue: colors.bad, off: colors.lineStrong };

/** The single most urgent thing about a pet, in words, plus its ring state. */
export function petHealth(db: DB, p: Pet): { key: Health; label: string; detail?: string } {
  if (p.status !== 'active') return { key: 'off', label: p.status === 'deceased' ? 'Deceased' : 'Inactive' };
  const open = db.followups.filter(f => f.petId === p.id && f.status === 'open').sort((a, b) => a.date.localeCompare(b.date));
  const over = open.find(f => diff(f.date) < 0);
  if (over) return { key: 'overdue', label: `${over.reason} is overdue`, detail: `${-diff(over.date)} days late` };
  const soon = open.find(f => followStatus(f).key === 'soon');
  if (soon) { const n = diff(soon.date); return { key: 'soon', label: `${soon.reason} ${n === 0 ? 'is due today' : `due in ${n} ${n === 1 ? 'day' : 'days'}`}` }; }
  return { key: 'ok', label: 'Up to date' };
}

/** Pet photo inside its status ring. */
export function HealthRing({ pet, health, size = 56, ring = 3 }: { pet: Pet; health: Health; size?: number; ring?: number }) {
  const gap = ring + 2; const inner = size - gap * 2;
  const r = (size - ring) / 2; const c = 2 * Math.PI * r;
  const dash = health === 'soon' ? `${c / 2} ${c / 2}` : health === 'overdue' ? `${c / 10} ${c / 14}` : undefined;
  const src = PET_PHOTOS[pet.id];
  return (
    <View style={{ width: size, height: size }} accessible accessibilityLabel={`${pet.name}, ${health === 'ok' ? 'up to date' : health === 'soon' ? 'care due soon' : health === 'overdue' ? 'care overdue' : 'inactive'}`}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.line} strokeWidth={ring} fill="none" />
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={HEALTH_COLOR[health]} strokeWidth={ring} fill="none"
          strokeDasharray={dash} strokeLinecap={health === 'overdue' ? 'butt' : 'round'} rotation={-90} origin={`${size / 2}, ${size / 2}`} />
      </Svg>
      <View style={{ position: 'absolute', left: gap, top: gap, width: inner, height: inner, borderRadius: inner / 2, overflow: 'hidden', backgroundColor: colors.subtle, alignItems: 'center', justifyContent: 'center' }}>
        {src ? <Image source={src} style={{ width: inner, height: inner }} resizeMode="cover" accessibilityIgnoresInvertColors />
          : <Icon name="paw" size={inner * 0.4} color={colors.accent} />}
      </View>
    </View>
  );
}

/** Small inline glyph of the ring language, for status text. */
export function RingGlyph({ health, size = 12 }: { health: Health; size?: number }) {
  const r = size / 2 - 1.5; const c = 2 * Math.PI * r;
  const dash = health === 'soon' ? `${c / 2} ${c / 2}` : health === 'overdue' ? `${c / 8} ${c / 12}` : undefined;
  return (
    <Svg width={size} height={size}>
      <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.line} strokeWidth={2} fill="none" />
      <Circle cx={size / 2} cy={size / 2} r={r} stroke={HEALTH_COLOR[health]} strokeWidth={2} fill="none" strokeDasharray={dash} rotation={-90} origin={`${size / 2}, ${size / 2}`} />
    </Svg>
  );
}

/* ---------- care line ---------- */
export type NodeState = 'past' | 'overdue' | 'next' | 'later';
export interface CareNode { key: string; date: string; label: string; state: NodeState; time?: string }

/** Builds a pet's care line: the last visits, anything overdue, then what is booked or due next. */
export function careNodes(db: DB, petId: string, { past = 2, future = 2 } = {}): CareNode[] {
  const visits = db.visits.filter(v => v.petId === petId && diff(v.date) < 0).sort((a, b) => b.date.localeCompare(a.date)).slice(0, past).reverse()
    .map<CareNode>(v => ({ key: v.id, date: v.date, label: (v.diagnosis || v.complaint || 'Visit').split(/[,.;]/)[0], state: 'past' }));
  const open = db.followups.filter(f => f.petId === petId && f.status === 'open');
  const overdue = open.filter(f => diff(f.date) < 0).sort((a, b) => a.date.localeCompare(b.date)).slice(-1)
    .map<CareNode>(f => ({ key: f.id, date: f.date, label: f.reason, state: 'overdue' }));
  const appts = db.appts.filter(a => a.petId === petId && isUpcoming(a) && diff(a.date) >= 0)
    .map<CareNode>(a => ({ key: a.id, date: a.date, time: a.time, label: a.service, state: 'later' }));
  const due = open.filter(f => diff(f.date) >= 0).map<CareNode>(f => ({ key: f.id, date: f.date, label: f.reason, state: 'later' }));
  const ahead = [...appts, ...due].sort((a, b) => a.date.localeCompare(b.date)).slice(0, future);
  if (ahead[0]) ahead[0] = { ...ahead[0], state: 'next' };
  return [...visits, ...overdue, ...ahead];
}

const whenLabel = (n: CareNode) => {
  const d = diff(n.date);
  if (n.state === 'overdue') return `${-d}d late`;
  if (d === 0) return n.time ? `Today, ${t12(n.time)}` : 'Today';
  if (d === 1) return 'Tomorrow';
  if (d > 1 && d <= 14) return `In ${d} days`;
  return fmtDS(n.date);
};

/**
 * Horizontal care line. Nodes are spaced evenly (not to scale) with today pinned between past and future.
 * `dense` drops secondary text for tight spaces. `onDark` flips colors for photo or navy backgrounds.
 */
export function CareLine({ nodes, dense, onDark, style, todayLabel = 'Today', minNode = 84 }: { nodes: CareNode[]; dense?: boolean; onDark?: boolean; style?: StyleProp<ViewStyle>; todayLabel?: string; minNode?: number }) {
  // Never squeeze labels: keep only as many nodes as fit, dropping the oldest visits and the furthest plans first.
  const [w, setW] = React.useState(0);
  const fit = w ? Math.max(2, Math.floor(w / minNode)) - 1 : nodes.length;
  let before = nodes.filter(n => n.state === 'past' || n.state === 'overdue');
  let after = nodes.filter(n => n.state === 'next' || n.state === 'later');
  while (before.length + after.length > fit) {
    const pastIdx = before.findIndex(n => n.state === 'past');
    if (after.length > 1) after = after.slice(0, -1);
    else if (pastIdx !== -1) before = before.filter((_, i) => i !== pastIdx);
    else if (before.length > 1) before = before.slice(1);
    else break;
  }
  const items: (CareNode | 'today')[] = [...before, 'today', ...after];
  const ink = onDark ? '#FFFFFF' : colors.ink;
  const ink2 = onDark ? 'rgba(255,255,255,0.72)' : colors.ink2;
  const rail = onDark ? 'rgba(255,255,255,0.35)' : colors.lineStrong;
  return (
    <View onLayout={e => setW(Math.floor(e.nativeEvent.layout.width))} style={[{ flexDirection: 'row' }, style]} accessibilityRole={'list' as never} accessibilityLabel="Care line">
      {items.map((n, i) => {
        const first = i === 0, last = i === items.length - 1;
        const isToday = n === 'today';
        const future = !isToday && (n.state === 'next' || n.state === 'later');
        return (
          <View key={isToday ? 'today' : n.key} style={{ flex: 1, minWidth: 0 }} accessible
            accessibilityLabel={isToday ? todayLabel : `${n.label}, ${whenLabel(n)}`}>
            {/* rail segments either side of the dot; future rail is dashed */}
            <View style={{ height: 18, justifyContent: 'center' }}>
              {!first && <View style={[cl.rail, { left: 0, right: '50%', borderColor: rail }, future && cl.dashed]} />}
              {!last && <View style={[cl.rail, { left: '50%', right: 0, borderColor: rail }, (isToday || future) && cl.dashed]} />}
              <View style={{ alignSelf: 'center' }}>
                {isToday ? <View style={[cl.today, onDark && { borderColor: '#fff' }]} />
                  : n.state === 'past' ? <View style={[cl.dot, { backgroundColor: onDark ? '#fff' : colors.blue }]} />
                  : n.state === 'overdue' ? <View style={[cl.ring, { borderColor: colors.bad, borderStyle: 'dashed', backgroundColor: onDark ? 'transparent' : colors.bg }]} />
                  : <View style={[cl.ring, { borderColor: onDark ? '#fff' : colors.blue, backgroundColor: onDark ? 'transparent' : colors.bg }, n.state === 'next' && { borderWidth: 2.5 }]} />}
              </View>
            </View>
            <View style={{ alignItems: 'center', paddingHorizontal: 4, marginTop: 8, gap: 2 }}>
              <Text style={[cl.when, { color: isToday ? ink : n.state === 'overdue' ? (onDark ? '#FFD2C9' : colors.bad) : ink2 }, isToday && { fontWeight: '600' }]} numberOfLines={1}>
                {isToday ? todayLabel : whenLabel(n)}
              </Text>
              {!isToday && !dense && <Text style={[cl.label, { color: ink }]} numberOfLines={2}>{n.label}</Text>}
            </View>
          </View>
        );
      })}
    </View>
  );
}

/** Visit progress for the staff queue: Booked, Checked in, Done (with the current stage marked as "now"). */
export function StageLine({ stage, width = 92 }: { stage: 0 | 1 | 2; width?: number }) {
  const names = ['Booked', 'Checked in', 'Done'];
  return (
    <View style={{ width, height: 14, flexDirection: 'row', alignItems: 'center' }} accessible accessibilityLabel={`Stage: ${names[stage]}`}>
      <View style={[cl.rail, { left: 6, right: 6, borderColor: colors.lineStrong }]} />
      <View style={[cl.rail, { left: 6, width: `${stage * 50}%`, borderColor: colors.blue, borderTopWidth: 2, marginTop: -0.5 }]} />
      {[0, 1, 2].map(i => (
        <View key={i} style={{ flex: 1, alignItems: i === 0 ? 'flex-start' : i === 2 ? 'flex-end' : 'center' }}>
          {i === stage && stage === 1 ? <View style={[cl.today, { width: 13, height: 13, borderRadius: 7 }]} />
            : i === stage && stage === 0 ? <View style={[cl.ring, { width: 11, height: 11, borderColor: colors.accentDeep, backgroundColor: colors.surface }]} />
            : i < stage || (i === 2 && stage === 2) ? <View style={[cl.dot, { width: 9, height: 9, backgroundColor: colors.blue }]} />
            : <View style={[cl.ring, { width: 9, height: 9, borderWidth: 1.5, borderColor: colors.lineStrong, backgroundColor: colors.surface }]} />}
        </View>
      ))}
    </View>
  );
}

/** Big tabular number with a quiet word after it, used in sentences instead of KPI boxes. */
export function Figure({ n, label, tone, size = 34 }: { n: number | string; label: string; tone?: string; size?: number }) {
  return (
    <Text style={{ fontFamily: FONT, fontSize: 15, color: colors.ink2 }}>
      <Text style={{ fontFamily: DISPLAY, fontSize: size, lineHeight: size * 1.1, fontWeight: '600', letterSpacing: -size * 0.03, color: tone || colors.ink, fontVariant: ['tabular-nums'] }}>{n}</Text>
      {' '}{label}
    </Text>
  );
}

const cl = StyleSheet.create({
  rail:   { position: 'absolute', top: 8.5, borderTopWidth: 1.5 },
  dashed: { borderStyle: 'dashed' },
  dot:    { width: 10, height: 10, borderRadius: 5 },
  ring:   { width: 12, height: 12, borderRadius: 6, borderWidth: 2 },
  today:  { width: 18, height: 18, borderRadius: 9, backgroundColor: colors.now, borderWidth: 2, borderColor: colors.accentDeep },
  when:   { fontFamily: FONT, fontSize: 12, lineHeight: 16, textAlign: 'center', fontVariant: ['tabular-nums'] },
  label:  { fontFamily: FONT, fontSize: 12.5, lineHeight: 16, fontWeight: '500', textAlign: 'center' },
});
