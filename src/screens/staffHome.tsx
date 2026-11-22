// Clinic Staff "Today": a calm operations view for the front desk.
// The day's queue runs down a time rail with a "now" marker; patients who have checked in are lit in calamansi.
// Each row carries its next step (check in, open, done) so the desk rarely needs to leave this page.
// The side column replaces KPI boxes with plain sentences: what needs a hand, and which pets are due.
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Btn, LinkBtn, Screen, Skeleton, Stack, useFirstLoad } from '../components/ui';
import { Icon, IconName } from '../components/Icon';
import { PetAvatar } from '../components/PetArt';
import { HealthRing, StageLine } from '../components/care';
import { Cols, PState, useBP } from '../components/responsive';
import { HomeHeader } from './common';
import { useDueList } from './clinic';
import { useApp, sel } from '../store/AppStore';
import { useNav } from '../navigation/nav';
import { colors, type, FONT, DISPLAY } from '../theme';
import type { Appt } from '../types';
import { billState, byDateTime, D, diff, DOWL, MON, parseD, t12 } from '../utils/format';

const STAGE: Partial<Record<Appt['status'], 0 | 1 | 2>> = { confirmed: 0, resched: 0, checked_in: 1, completed: 2 };
const minutes = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
const nowLabel = () => { const d = new Date(); return t12(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`); };

function QueueRow({ a, first, last }: { a: Appt; first: boolean; last: boolean }) {
  const nav = useNav(); const { db, act } = useApp(); const { mobile } = useBP();
  const p = sel.pet(db, a.petId)!; const o = sel.owner(db, a.ownerId)!;
  const [hm, ap] = t12(a.time).split(' ');
  const waiting = a.status === 'checked_in';
  const done = a.status === 'completed';
  const stage = STAGE[a.status];
  const node = waiting ? <View style={q.nodeNow} /> : done ? <View style={q.nodeDone} /> : a.status === 'missed' ? <View style={[q.nodeOpen, { borderColor: colors.bad, borderStyle: 'dashed' }]} /> : <View style={q.nodeOpen} />;
  const action = a.status === 'confirmed'
    ? <Btn label="Check in" kind="line" small icon="check" onPress={() => act.setApptStatus(a.id, 'checked_in')} />
    : waiting ? <Btn label="Open visit" small onPress={() => nav.navigate('ApptDetail', { id: a.id })} />
    : done ? <Text style={[q.state, { color: colors.ok }]}>Done</Text>
    : a.status === 'missed' ? <Text style={[q.state, { color: colors.bad }]}>Missed</Text>
    : a.status === 'resched' ? <Text style={q.state}>Waiting on owner</Text> : null;
  return (
    <View style={[q.row, waiting && q.rowNow]}>
      <View style={q.time}>
        <Text style={[q.timeHM, done && { color: colors.ink3 }]}>{hm}</Text>
        <Text style={q.timeAP}>{ap}</Text>
      </View>
      <View style={q.rail}>
        <View style={[q.railLine, { top: first ? '50%' : 0, bottom: last ? '50%' : 0 }]} />
        {node}
      </View>
      {mobile ? (
        <View style={[q.body, { flexDirection: 'column', alignItems: 'stretch', gap: 10 }, !first && !waiting && q.bodyRule]}>
          <Pressable onPress={() => nav.navigate('ApptDetail', { id: a.id })} accessibilityRole="button"
            accessibilityLabel={`${t12(a.time)}, ${p.name}, ${a.service}, ${o.name}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <PetAvatar pet={p} size={40} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={[q.pet, done && { color: colors.ink2 }]} numberOfLines={1}>{p.name}</Text>
              <Text style={type.small} numberOfLines={2}>{a.service}, {o.name}</Text>
            </View>
          </Pressable>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, minHeight: 40 }}>
            {stage != null ? <StageLine stage={stage} width={84} /> : <View />}
            {action}
          </View>
        </View>
      ) : (
        <>
          <Pressable onPress={() => nav.navigate('ApptDetail', { id: a.id })} accessibilityRole="button"
            accessibilityLabel={`${t12(a.time)}, ${p.name}, ${a.service}, ${o.name}`}
            style={(st: PState) => [q.body, !first && !waiting && q.bodyRule, st.hovered && { backgroundColor: waiting ? '#E9EFC0' : colors.hover }]}>
            <PetAvatar pet={p} size={44} />
            <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
              <Text style={[q.pet, done && { color: colors.ink2 }]} numberOfLines={1}>{p.name}<Text style={q.owner}>{`  ${o.name}`}</Text></Text>
              <Text style={type.small} numberOfLines={1}>{a.service}{a.reason ? `. ${a.reason}` : ''}</Text>
            </View>
            {stage != null && <StageLine stage={stage} />}
          </Pressable>
          {action && <View style={q.action}>{action}</View>}
        </>
      )}
    </View>
  );
}

function NowMarker() {
  return (
    <View style={q.nowRow} accessible accessibilityLabel={`Now, ${nowLabel()}`}>
      <View style={q.time}><Text style={q.nowText} numberOfLines={1}>{nowLabel()}</Text></View>
      <View style={q.rail}><View style={q.nowDot} /></View>
      <View style={q.nowLine} />
    </View>
  );
}

function NeedRow({ n, label, icon, onPress }: { n: number; label: string; icon: IconName; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`${n} ${label}`}
      style={(st: PState) => [q.need, st.hovered && { backgroundColor: colors.hover }]}>
      <Text style={[q.needN, n === 0 && { color: colors.ink3 }]}>{n}</Text>
      <Text style={[type.body, { flex: 1, color: n ? colors.ink : colors.ink2 }]}>{label}</Text>
      {n > 0 && <View style={q.needDot} />}
      <Icon name={icon} size={18} color={colors.ink3} />
    </Pressable>
  );
}

export function StaffHome() {
  const nav = useNav(); const { db, user } = useApp(); const due = useDueList();
  const loading = useFirstLoad('staffHome'); const { mobile, desktop } = useBP();
  const today = db.appts.filter(a => diff(a.date) === 0 && a.status !== 'cancelled').sort(byDateTime);
  const waiting = today.filter(a => a.status === 'checked_in');
  const doneN = today.filter(a => a.status === 'completed').length;
  const toCome = today.filter(a => a.status === 'confirmed' || a.status === 'resched');
  const verify = db.bills.filter(b => billState(b) === 'pending').length;
  const unread = sel.unreadMsgs(db, user!);
  const d = parseD(D(0));

  // Where "now" falls in today's list
  const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
  const nowAt = today.findIndex(a => minutes(a.time) > nowMin);
  const nowIndex = nowAt === -1 ? today.length : nowAt;

  const nextUp = toCome.find(a => minutes(a.time) >= nowMin) || toCome[0];
  const summary = [
    `${doneN} done`,
    `${toCome.length} still to come`,
    nextUp ? `next is ${sel.pet(db, nextUp.petId)!.name} at ${t12(nextUp.time)}` : '',
  ].filter(Boolean).join(', ') + '.';

  const header = (
    <View style={[{ gap: 20 }, desktop && { flexDirection: 'row', alignItems: 'flex-end', gap: 32 }]}>
      <View style={{ flex: desktop ? 1 : undefined, minWidth: 0, gap: 10 }}>
        <Text style={q.date}>{DOWL[d.getDay()]}, {MON[d.getMonth()]} {d.getDate()}</Text>
        <Text style={[q.headline, mobile && { fontSize: 36, lineHeight: 38, letterSpacing: -1.3 }]} accessibilityRole="header">
          {today.length} {today.length === 1 ? 'visit' : 'visits'} today.{'\n'}
          <Text style={{ color: waiting.length ? colors.ink : colors.ink3 }}>{waiting.length} waiting now.</Text>
        </Text>
        <Text style={[type.body, { color: colors.ink2 }]}>{summary}</Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Btn label="Walk-in" icon="userplus" kind="line" onPress={() => nav.navigate('Book', { staff: '1' })} style={mobile ? { flex: 1 } : undefined} />
        <Btn label="New appointment" icon="plus" onPress={() => nav.navigate('Book', { staff: '1' })} style={mobile ? { flex: 1.3 } : undefined} />
      </View>
    </View>
  );

  const queue = (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <Text style={q.sectionTitle} accessibilityRole="header">The queue</Text>
        <LinkBtn label="Full schedule" onPress={() => nav.navigate('Main', { screen: 'Appointments' } as never)} />
      </View>
      {today.length === 0 ? (
        <Text style={[type.body, { color: colors.ink2, paddingVertical: 24 }]}>No visits booked for today. Walk-ins can be added any time.</Text>
      ) : (
        <View accessibilityRole={'list' as never}>
          {today.map((a, i) => (
            <View key={a.id}>
              {i === nowIndex && <NowMarker />}
              <QueueRow a={a} first={i === 0 && nowIndex !== 0} last={i === today.length - 1 && nowIndex !== today.length} />
            </View>
          ))}
          {nowIndex === today.length && <NowMarker />}
        </View>
      )}
    </View>
  );

  const dueRows = [...due.overdue, ...due.soon].slice(0, desktop ? 5 : 4);
  const side = (
    <View style={[q.side, !desktop && q.sideStacked]}>
      <View style={{ gap: 4 }}>
        <Text style={q.sideTitle} accessibilityRole="header">Needs a hand</Text>
        <NeedRow n={verify} label={verify === 1 ? 'payment to verify' : 'payments to verify'} icon="wallet" onPress={() => nav.navigate('Main', { screen: 'Billing' } as never)} />
        <NeedRow n={unread} label={unread === 1 ? 'unread message' : 'unread messages'} icon="chat" onPress={() => nav.navigate('Main', { screen: 'Messages' } as never)} />
        <NeedRow n={due.overdue.length} label={due.overdue.length === 1 ? 'overdue follow-up' : 'overdue follow-ups'} icon="bell" onPress={() => nav.navigate('CareMonitor')} />
      </View>
      {dueRows.length > 0 && (
        <View style={{ gap: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <Text style={q.sideTitle} accessibilityRole="header">Due and overdue</Text>
            <LinkBtn label="Due list" onPress={() => nav.navigate('CareMonitor')} />
          </View>
          {dueRows.map(({ f, pet, s: st }) => (
            <Pressable key={f.id} onPress={() => nav.navigate('PetDetail', { id: pet.id, tab: 'follow' })} accessibilityRole="button"
              accessibilityLabel={`${pet.name}, ${f.reason}, ${st.label}`}
              style={(ps: PState) => [q.due, ps.hovered && { backgroundColor: colors.hover }]}>
              <HealthRing pet={pet} health={st.key === 'overdue' ? 'overdue' : 'soon'} size={40} ring={2.5} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={type.h3} numberOfLines={1}>{pet.name}</Text>
                <Text style={type.small} numberOfLines={1}>{f.reason}</Text>
              </View>
              <Text style={[q.dueWhen, { color: st.key === 'overdue' ? colors.bad : colors.warn }]}>{st.key === 'overdue' ? `${-diff(f.date)}d late` : st.label.replace('Due in ', 'in ')}</Text>
            </Pressable>
          ))}
        </View>
      )}
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        <Btn label="New bill" icon="receipt" kind="line" small onPress={() => nav.navigate('CreateBill')} />
        <Btn label="Find a patient" icon="search" kind="line" small onPress={() => nav.navigate('Main', { screen: 'Patients' } as never)} />
      </View>
    </View>
  );

  if (loading) return (
    <Screen hideHeader tabbed>
      {mobile && <HomeHeader />}
      <Stack gap={20}><Skeleton h={14} w={180} /><Skeleton h={88} w={420} r={8} /><Skeleton h={320} r={10} /></Stack>
    </Screen>
  );
  return (
    <Screen hideHeader tabbed>
      {mobile && <HomeHeader />}
      {header}
      {desktop ? <Cols ratio={[2, 1]} gap={48}>{queue}{side}</Cols> : <>{queue}{side}</>}
    </Screen>
  );
}

const q = StyleSheet.create({
  date:        { fontFamily: FONT, fontSize: 15, fontWeight: '500', color: colors.accent },
  headline:    { fontFamily: DISPLAY, fontSize: 52, lineHeight: 54, fontWeight: '600', color: colors.ink, letterSpacing: -2 },
  sectionTitle:{ fontFamily: DISPLAY, fontSize: 22, lineHeight: 28, fontWeight: '600', color: colors.ink, letterSpacing: -0.4 },

  row:      { flexDirection: 'row', alignItems: 'stretch', minHeight: 76, borderRadius: 10 },
  rowNow:   { backgroundColor: colors.nowSoft },
  time:     { width: 66, paddingTop: 18, paddingLeft: 6 },
  timeHM:   { fontFamily: DISPLAY, fontSize: 19, lineHeight: 22, fontWeight: '600', color: colors.ink, fontVariant: ['tabular-nums'], letterSpacing: -0.4 },
  timeAP:   { fontFamily: FONT, fontSize: 11.5, color: colors.ink3 },
  rail:     { width: 24, alignItems: 'center', justifyContent: 'center' },
  railLine: { position: 'absolute', width: 1.5, backgroundColor: colors.lineStrong },
  nodeDone: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.blue },
  nodeOpen: { width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: colors.blue, backgroundColor: colors.bg },
  nodeNow:  { width: 16, height: 16, borderRadius: 8, backgroundColor: colors.now, borderWidth: 2, borderColor: colors.accentDeep },
  body:     { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12, paddingHorizontal: 12, borderRadius: 8 },
  bodyRule: { borderTopWidth: 1, borderTopColor: colors.line, borderRadius: 0 },
  pet:      { fontFamily: FONT, fontSize: 15.5, fontWeight: '600', color: colors.ink },
  owner:    { fontFamily: FONT, fontSize: 13.5, fontWeight: '400', color: colors.ink2 },
  action:   { width: 132, alignItems: 'flex-end', justifyContent: 'center', paddingRight: 8 },
  state:    { fontFamily: FONT, fontSize: 13.5, fontWeight: '600', color: colors.ink2 },

  nowRow:   { flexDirection: 'row', alignItems: 'center', height: 28 },
  nowText:  { fontFamily: FONT, fontSize: 12, fontWeight: '600', color: colors.accentDeep, fontVariant: ['tabular-nums'] },
  nowDot:   { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.accentDeep },
  nowLine:  { flex: 1, height: 1, backgroundColor: colors.accentDeep },

  side:        { gap: 32, paddingLeft: 32, borderLeftWidth: 1, borderLeftColor: colors.line },
  sideStacked: { paddingLeft: 0, borderLeftWidth: 0, borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 24 },
  sideTitle:   { fontFamily: DISPLAY, fontSize: 21, lineHeight: 26, fontWeight: '600', color: colors.ink, letterSpacing: -0.4, marginBottom: 4 },
  need:     { flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 52, paddingHorizontal: 8, marginHorizontal: -8, borderRadius: 8, borderBottomWidth: 1, borderBottomColor: colors.line },
  needN:    { fontFamily: DISPLAY, fontSize: 28, lineHeight: 32, fontWeight: '600', color: colors.ink, width: 36, fontVariant: ['tabular-nums'], letterSpacing: -0.8 },
  needDot:  { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.dot },
  due:      { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56, paddingHorizontal: 8, marginHorizontal: -8, borderRadius: 8 },
  dueWhen:  { fontFamily: FONT, fontSize: 13, fontWeight: '600', fontVariant: ['tabular-nums'] },
});
