// Administrator statistics (DESIGN.md §10): profit and loss, revenue, receivables, visits, care follow-ups, payments, staff.
// Cash basis. Everything is derived from existing records, except expenses, which the administrator records here.
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Polyline } from 'react-native-svg';
import { Icon } from '../components/Icon';
import { Avatar, Btn, Chips, Field, Group, Pill, Row, Screen, Section, T } from '../components/ui';
import { CollectionBars, LedgerRow } from '../components/care';
import { Sheet, useConfirm } from '../components/overlays';
import { Cols, useBP } from '../components/responsive';
import { useDueList } from './clinic';
import { useApp } from '../store/AppStore';
import { useNav } from '../navigation/nav';
import { colors, type, DISPLAY } from '../theme';
import type { DB, Expense, ExpenseCategory, PayMethod } from '../types';
import { D, DOW, DOWL, MON, billBalance, billPaid, billState, billTotal, diff, fmtD, isOwing, money, parseD, ymd } from '../utils/format';

type Period = 'today' | 'week' | 'month' | 'last' | 'year';
const PERIODS: [Period, string][] = [['today', 'Today'], ['week', '7 days'], ['month', 'This month'], ['last', 'Last month'], ['year', 'This year']];
const CATEGORIES: ExpenseCategory[] = ['Medicines and vaccines', 'Supplies', 'Salaries', 'Rent', 'Utilities', 'Equipment', 'Marketing', 'Other'];
const COST_OF_GOODS: ExpenseCategory[] = ['Medicines and vaccines', 'Supplies'];

interface Range { from: string; to: string; label: string; days: number }
const addDays = (s: string, n: number) => { const d = parseD(s); d.setDate(d.getDate() + n); return ymd(d); };
const spanDays = (from: string, to: string) => Math.round((parseD(to).getTime() - parseD(from).getTime()) / 864e5) + 1;

/** The chosen period, and the equal-length period right before it (for "up 12% on the previous period"). */
function rangesOf(p: Period): { now: Range; prev: Range } {
  const t = parseD(D(0)); let from = D(0), to = D(0), label = 'today';
  if (p === 'week') { from = D(-6); label = 'the last 7 days'; }
  if (p === 'month') { from = ymd(new Date(t.getFullYear(), t.getMonth(), 1)); label = MON[t.getMonth()]; }
  if (p === 'last') { from = ymd(new Date(t.getFullYear(), t.getMonth() - 1, 1)); to = ymd(new Date(t.getFullYear(), t.getMonth(), 0)); label = MON[parseD(from).getMonth()]; }
  if (p === 'year') { from = ymd(new Date(t.getFullYear(), 0, 1)); label = String(t.getFullYear()); }
  const days = spanDays(from, to); const pTo = addDays(from, -1);
  return { now: { from, to, label, days }, prev: { from: addDays(pTo, -(days - 1)), to: pTo, label: 'the previous period', days } };
}
const within = (r: Range) => (d: string) => d >= r.from && d <= r.to;

/** The profit and loss statement for one period. */
function pnl(db: DB, r: Range) {
  const inR = within(r);
  const pays = db.bills.flatMap(b => b.payments).filter(p => inR(p.date));
  const received = pays.filter(p => p.status === 'confirmed' || p.status === 'refunded');
  const gross = received.reduce((s, p) => s + p.amount, 0);
  const refunds = pays.filter(p => p.status === 'refunded').reduce((s, p) => s + p.amount, 0);
  const fees = received.reduce((s, p) => s + (p.fee || 0), 0);
  const net = gross - refunds - fees;
  const exp = (db.expenses || []).filter(e => inR(e.date));
  const spend = (cats: ExpenseCategory[]) => exp.filter(e => cats.includes(e.category)).reduce((s, e) => s + e.amount, 0);
  const cogs = spend(COST_OF_GOODS); const opex = exp.reduce((s, e) => s + e.amount, 0) - cogs;
  const gp = net - cogs; const profit = gp - opex;
  return { gross, refunds, fees, net, cogs, gp, opex, profit, exp, margin: net > 0 ? gp / net : 0, netMargin: net > 0 ? profit / net : 0 };
}

const pct = (n: number) => `${(n * 100).toFixed(1)}%`;
const change = (now: number, prev: number) => {
  if (prev === 0 && now === 0) return 'No change on the previous period';
  if (prev === 0) return 'No figure for the previous period to compare with';
  const c = (now - prev) / Math.abs(prev);
  return `${c >= 0 ? 'Up' : 'Down'} ${Math.abs(c * 100).toFixed(1)}% on the previous period (${money(prev)})`;
};

/** Evenly split bars for the chart: days for short periods, weeks for a month, months for a year. */
function buckets(r: Range): { label: string; from: string; to: string }[] {
  if (r.days <= 7) { const n = Math.max(r.days, 7); return Array.from({ length: n }, (_, i) => { const d = addDays(r.to, i - (n - 1)); return { label: d === D(0) ? 'Today' : DOW[parseD(d).getDay()], from: d, to: d }; }); }
  if (r.days > 62) {
    const y = parseD(r.from).getFullYear(); const last = r.to === D(0) ? parseD(r.to).getMonth() : 11;
    return Array.from({ length: last + 1 }, (_, m) => ({ label: MON[m], from: ymd(new Date(y, m, 1)), to: ymd(new Date(y, m + 1, 0)) }));
  }
  const out: { label: string; from: string; to: string }[] = [];
  for (let f = r.from, i = 1; f <= r.to; f = addDays(f, 7), i++) out.push({ label: `Wk ${i}`, from: f, to: addDays(f, 6) > r.to ? r.to : addDays(f, 6) });
  return out;
}

/** Horizontal bar rows: label, share of the largest value, amount. One colour. */
function HBars({ rows, format = money }: { rows: { label: string; value: number }[]; format?: (n: number) => string }) {
  const max = Math.max(...rows.map(r => r.value), 1);
  if (rows.every(r => r.value === 0)) return <T.Small>No data in this period.</T.Small>;
  return (
    <View style={{ gap: 12 }}>
      {rows.filter(r => r.value > 0).map(r => (
        <View key={r.label} style={{ gap: 4 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
            <Text style={[type.body, { flex: 1 }]} numberOfLines={1}>{r.label}</Text>
            <Text style={[type.h3, { fontVariant: ['tabular-nums'] }]}>{format(r.value)}</Text>
          </View>
          <View style={st.track}><View style={[st.fill, { width: `${Math.max(3, (r.value / max) * 100)}%` }]} /></View>
        </View>
      ))}
    </View>
  );
}

/** Up/down arrow versus the previous period. `goodUp` false means a rise is bad (e.g. money out, unpaid). */
function Delta({ now, prev, goodUp = true }: { now: number; prev: number; goodUp?: boolean }) {
  if (prev === 0 && now === 0) return <Text style={type.small}>No change</Text>;
  if (prev === 0) return <Text style={type.small}>Nothing to compare</Text>;
  const c = (now - prev) / Math.abs(prev); if (Math.abs(c) < 0.0005) return <Text style={type.small}>No change</Text>;
  const good = (c > 0) === goodUp;
  return <Text style={[type.small, { color: good ? colors.ok : colors.bad, fontWeight: '600' }]}>{c > 0 ? '▲' : '▼'} {Math.abs(c * 100).toFixed(0)}% vs. before</Text>;
}

/** Tiny line inside a headline number. Values only; the number beside it carries the meaning. */
function Spark({ values, color }: { values: number[]; color: string }) {
  const w = 80, h = 24; const max = Math.max(...values, 1), min = Math.min(...values, 0); const span = max - min || 1;
  const pts = values.map((v, i) => `${values.length > 1 ? (i / (values.length - 1)) * w : w / 2},${h - 2 - ((v - min) / span) * (h - 4)}`).join(' ');
  return <Svg width={w} height={h} accessible={false}><Polyline points={pts} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" /></Svg>;
}

/** Several lines on one chart, with a legend that carries the latest value so colour is never the only cue. */
function TrendLines({ labels, series, height = 130 }: { labels: string[]; series: { name: string; color: string; values: number[]; format?: (n: number) => string; dash?: string }[]; height?: number }) {
  const [w, setW] = useState(320); const pad = 8;
  const all = series.flatMap(s => s.values); const max = Math.max(...all, 1), min = Math.min(...all, 0); const span = max - min || 1;
  const n = labels.length; const x = (i: number) => pad + (n > 1 ? (i / (n - 1)) * (w - pad * 2) : (w - pad * 2) / 2);
  const y = (v: number) => height - pad - ((v - min) / span) * (height - pad * 2);
  const a11y = series.map(s => `${s.name}: ${s.values.map((v, i) => `${labels[i]} ${(s.format || money)(v)}`).join(', ')}`).join('. ');
  return (
    <View style={{ gap: 8 }}>
      <View onLayout={e => setW(Math.max(120, e.nativeEvent.layout.width))} accessibilityRole={'image' as never} accessibilityLabel={a11y}>
        <Svg width={w} height={height}>
          {min < 0 && <Polyline points={`${pad},${y(0)} ${w - pad},${y(0)}`} stroke={colors.lineStrong} strokeWidth={1} strokeDasharray="3 3" />}
          {series.map(s => <Polyline key={s.name} points={s.values.map((v, i) => `${x(i)},${y(v)}`).join(' ')} fill="none" stroke={s.color} strokeWidth={2.5} strokeDasharray={s.dash} strokeLinejoin="round" strokeLinecap="round" />)}
          {series.map(s => s.values.map((v, i) => <Circle key={`${s.name}${i}`} cx={x(i)} cy={y(v)} r={i === n - 1 ? 4 : 2.5} fill={s.color} />))}
        </Svg>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={type.small}>{labels[0]}</Text>{n > 2 && <Text style={type.small}>{labels[Math.floor(n / 2)]}</Text>}<Text style={type.small}>{labels[n - 1]}</Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: 18, rowGap: 6 }}>
        {series.map(s => (
          <View key={s.name} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ width: 16, height: 0, borderTopWidth: 3, borderColor: s.color, borderStyle: s.dash ? 'dashed' : 'solid' }} />
            <Text style={type.small}>{s.name}: <Text style={{ fontWeight: '700', color: colors.ink }}>{(s.format || money)(s.values[s.values.length - 1] ?? 0)}</Text></Text>
          </View>
        ))}
      </View>
    </View>
  );
}

/** One stacked bar for receivables by age, with a labelled value for each part. */
function AgingBar({ parts }: { parts: { label: string; value: number; color: string }[] }) {
  const total = parts.reduce((s, p) => s + p.value, 0);
  if (!total) return <T.Small>No data yet.</T.Small>;
  return (
    <View style={{ gap: 10 }} accessible accessibilityLabel={parts.map(p => `${p.label}: ${money(p.value)}`).join(', ')}>
      <View style={{ flexDirection: 'row', height: 14, borderRadius: 7, overflow: 'hidden', backgroundColor: colors.subtle }}>
        {parts.filter(p => p.value > 0).map(p => <View key={p.label} style={{ flex: p.value, backgroundColor: p.color }} />)}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: 18, rowGap: 6 }}>
        {parts.map(p => (
          <View key={p.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: p.color }} />
            <Text style={type.small}>{p.label}: <Text style={{ fontWeight: '700', color: colors.ink }}>{money(p.value)}</Text></Text>
          </View>
        ))}
      </View>
    </View>
  );
}

/** A plain label with a tap-for-meaning ⓘ. */
function Term({ text, meaning, onInfo }: { text: string; meaning: string; onInfo: (t: string, m: string) => void }) {
  return (
    <Pressable onPress={() => onInfo(text, meaning)} accessibilityRole="button" accessibilityLabel={`${text}. What does this mean?`} hitSlop={8} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <Text style={type.small}>{text}</Text><Icon name="info" size={14} color={colors.ink3} />
    </Pressable>
  );
}

/** One row of the statement: label on the left, amount on the right. */
function Line({ label, value, bold, minus, tone, note }: { label: string; value: number; bold?: boolean; minus?: boolean; tone?: string; note?: string }) {
  return (
    <View style={[st.line, bold && st.lineTotal]} accessible accessibilityLabel={`${label}: ${money(value)}`}>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[type.body, bold && { fontWeight: '700', color: colors.ink }]}>{minus ? 'Less: ' : ''}{label}</Text>
        {!!note && <Text style={type.small}>{note}</Text>}
      </View>
      <Text style={[type.h3, { fontVariant: ['tabular-nums'] }, bold && { fontWeight: '700' }, tone ? { color: tone } : null]}>{minus && value > 0 ? '−' : ''}{money(Math.abs(value))}</Text>
    </View>
  );
}

export function Statistics() {
  const nav = useNav(); const { db, act } = useApp(); const due = useDueList(); const { mobile } = useBP(); const confirm = useConfirm();
  const [period, setPeriod] = useState<Period>('month');
  const [sheet, setSheet] = useState(false);
  const [form, setForm] = useState<{ category: ExpenseCategory; amount: string; note: string; date: string }>({ category: 'Supplies', amount: '', note: '', date: D(0) });
  const [err, setErr] = useState<Record<string, string>>({});
  const [help, setHelp] = useState(false);
  const [info, setInfo] = useState<{ t: string; m: string } | null>(null);
  const showInfo = (t: string, m: string) => setInfo({ t, m });
  const { now, prev } = rangesOf(period); const inR = within(now);
  const cur = pnl(db, now), old = pnl(db, prev);
  const loss = cur.profit < 0;

  const bars = buckets(now).map(b => ({ ...b, v: pnl(db, { from: b.from, to: b.to, label: '', days: 1 }), visits: db.appts.filter(a => a.status === 'completed' && a.date >= b.from && a.date <= b.to).length }));
  const moneyOut = cur.cogs + cur.opex, moneyOutOld = old.cogs + old.opex;
  const unit = now.days <= 7 ? 'day' : now.days > 62 ? 'month' : 'week';
  const profitTone = loss ? colors.bad : colors.ok;

  // Revenue breakdowns.
  const bills = db.bills.filter(b => inR(b.date));
  const byService = new Map<string, number>(); const byCategory = new Map<string, number>();
  bills.forEach(b => {
    const total = billTotal(b); if (!total) return; const share = Math.min(1, billPaid(b) / total);
    b.items.forEach(i => {
      const amt = i.qty * i.price * share; byService.set(i.name, (byService.get(i.name) || 0) + amt);
      const c = db.services.find(s => s.name === i.name)?.category || 'Other'; byCategory.set(c, (byCategory.get(c) || 0) + amt);
    });
  });
  const ranked = (m: Map<string, number>) => [...m].map(([label, value]) => ({ label, value: Math.round(value) })).sort((a, b) => b.value - a.value);
  const byMethod = new Map<PayMethod, number>();
  db.bills.flatMap(b => b.payments).filter(p => p.status === 'confirmed' && inR(p.date)).forEach(p => byMethod.set(p.method, (byMethod.get(p.method) || 0) + p.amount));
  const paidBills = bills.filter(b => billState(b) === 'paid');
  const avgBill = paidBills.length ? Math.round(paidBills.reduce((s, b) => s + billTotal(b), 0) / paidBills.length) : 0;
  const billed = bills.reduce((s, b) => s + billTotal(b), 0);
  const collected = bills.reduce((s, b) => s + Math.min(billPaid(b), billTotal(b)), 0);

  // Receivables, with age buckets from the bill date.
  const owing = db.bills.filter(b => isOwing(billState(b)));
  const age = (lo: number, hi: number) => owing.filter(b => { const d = -diff(b.date); return d >= lo && d <= hi; }).reduce((s, b) => s + billBalance(b), 0);
  const outstanding = owing.reduce((s, b) => s + billBalance(b), 0);
  const summary = cur.net === 0 && moneyOut === 0 ? `No money in or out yet for ${now.label}.`
    : `You earned ${money(cur.net)} and spent ${money(moneyOut)}, so you ${loss ? `lost ${money(Math.abs(cur.profit))}` : `kept ${money(cur.profit)}`}.`;

  // Visits.
  const appts = db.appts.filter(a => inR(a.date) && diff(a.date) <= 0);
  const count = (s: string) => appts.filter(a => a.status === s).length;
  const completed = count('completed'), cancelled = count('cancelled'), missed = count('missed');
  const booked = completed + cancelled + missed;
  const doneAppts = appts.filter(a => a.status === 'completed');
  const seen = new Set(doneAppts.map(a => a.ownerId));
  const returning = [...seen].filter(o => db.appts.some(a => a.ownerId === o && a.status === 'completed' && a.date < now.from)).length;
  const weekdays = DOWL.map((label, i) => ({ label, value: appts.filter(a => a.status !== 'cancelled' && parseD(a.date).getDay() === i).length }));

  // Payments through the gateway.
  const online = db.bills.flatMap(b => b.payments).filter(p => p.provider === 'paymongo' && inR(p.date));
  const failed = online.filter(p => p.status === 'failed' || p.status === 'expired').length;
  const vax = [...due.overdue, ...due.soon].filter(x => x.f.kind !== 'Recheck');
  const staff = db.users.filter(u => u.role === 'staff' && u.status === 'active');

  const catSpend = CATEGORIES.map(c => ({ label: c, value: cur.exp.filter(e => e.category === c).reduce((s, e) => s + e.amount, 0) })).sort((a, b) => b.value - a.value);

  const openForm = () => { setErr({}); setForm({ category: 'Supplies', amount: '', note: '', date: D(0) }); setSheet(true); };
  const save = () => {
    const e: Record<string, string> = {};
    if (!(Number(form.amount) > 0)) e.amount = 'Enter the amount';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.date) || Number.isNaN(parseD(form.date).getTime())) e.date = 'Use the format YYYY-MM-DD';
    else if (form.date > D(0)) e.date = 'The date cannot be in the future';
    if (Object.keys(e).length) return setErr(e);
    act.addExpense({ category: form.category, amount: Math.round(Number(form.amount) * 100) / 100, note: form.note.trim(), date: form.date }); setSheet(false);
  };
  const remove = (e: Expense) => confirm({ title: 'Remove this expense?', body: `${money(e.amount)} for ${e.category.toLowerCase()} on ${fmtD(e.date)} will be taken out of the profit and loss.`, ok: 'Remove', tone: 'bad', icon: 'trash', onOk: () => act.removeExpense(e.id) });

  return (
    <Screen title="Statistics" back={false} big tabbed sub="Profit and loss, revenue, receivables, visits and care follow-ups."
      right={<View style={{ flexDirection: 'row', gap: 8 }}><Btn label="How to read this" icon="info" kind="line" small onPress={() => setHelp(true)} /><Btn label="Add expense" icon="plus" small onPress={openForm} /></View>}>
      <Chips options={PERIODS} value={period} onChange={setPeriod} />

      <View style={st.panel} accessibilityLabel="At a glance">
        <Text style={st.h2} accessibilityRole="header">At a glance, {now.label}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 20 }}>
          {([
            { k: 'in', label: 'Money in', value: cur.net, prev: old.net, series: bars.map(b => b.v.net), tone: colors.ink, goodUp: true, meaning: 'Payments received, after refunds and gateway fees.' },
            { k: 'out', label: 'Money out', value: moneyOut, prev: moneyOutOld, series: bars.map(b => b.v.cogs + b.v.opex), tone: colors.ink, goodUp: false, meaning: 'Everything recorded as an expense: supplies, salaries, rent and so on.' },
            { k: 'profit', label: loss ? 'Loss' : 'Profit', value: cur.profit, prev: old.profit, series: bars.map(b => b.v.profit), tone: profitTone, goodUp: true, meaning: 'Money in minus money out. Negative means you spent more than you received.' },
            { k: 'unpaid', label: 'Unpaid', value: outstanding, prev: 0, series: [] as number[], tone: outstanding ? colors.warn : colors.ink, goodUp: false, meaning: 'What customers still owe on open bills, as of today.' },
          ] as const).map(c => (
            <View key={c.k} style={{ gap: 4, minWidth: mobile ? '42%' : 150, flexGrow: 1 }} accessible accessibilityLabel={`${c.label}: ${c.value < 0 ? 'minus ' : ''}${money(Math.abs(c.value))}`}>
              <Term text={c.label} meaning={c.meaning} onInfo={showInfo} />
              <Text style={[st.big, { fontSize: mobile ? 30 : 38, lineHeight: mobile ? 34 : 42, color: c.tone }]}>{c.value < 0 ? '−' : ''}{money(Math.abs(c.value))}</Text>
              {c.k === 'unpaid' ? <Text style={type.small}>{owing.length} open {owing.length === 1 ? 'bill' : 'bills'}</Text> : <Delta now={c.value} prev={c.prev} goodUp={c.goodUp} />}
              {c.series.length > 1 && <Spark values={c.series} color={c.tone === colors.ink ? colors.blue : c.tone} />}
            </View>
          ))}
        </View>
        <Text style={type.body}>{summary}</Text>
      </View>

      <View style={st.panel}>
        <Text style={st.h2} accessibilityRole="header">Money in and out over time</Text>
        <TrendLines labels={bars.map(b => b.label)} series={[
          { name: 'Money in', color: colors.accent, values: bars.map(b => b.v.net) },
          { name: 'Money out', color: colors.warn, values: bars.map(b => b.v.cogs + b.v.opex), dash: '5 4' },
          { name: loss ? 'Loss' : 'Profit', color: colors.ok, values: bars.map(b => b.v.profit) },
        ]} />
        <Text style={type.small}>Each point is one {unit}. {change(cur.profit, old.profit)}.</Text>
      </View>

      <View style={st.panel}>
        <Text style={st.h2} accessibilityRole="header">Visits over time</Text>
        <TrendLines labels={bars.map(b => b.label)} height={110} series={[{ name: 'Visits completed', color: colors.accentDeep, values: bars.map(b => b.visits), format: n => String(n) }]} />
        <Text style={type.small}>{completed} {completed === 1 ? 'visit' : 'visits'} completed in {now.label}.</Text>
      </View>

      <View style={{ gap: 4 }}>
        <Text style={st.h2} accessibilityRole="header">Net revenue per {unit}</Text>
        <CollectionBars values={bars.map(b => b.v.net)} labels={bars.map(b => b.label)} format={v => `₱${(v / 1000).toFixed(1)}k`} height={mobile ? 90 : 120} />
        <Text style={type.small}>Money received each {unit}, after refunds and gateway fees.</Text>
      </View>

      <Cols ratio={[1.2, 1]} stackBelow="desktop" gap={40}>
        <Section title="Profit and loss" sub={`${summary} Counted when money actually arrives.`}>
          <View>
            <Line label="Money received" value={cur.gross} note="Confirmed payments" />
            <Line label="Refunds" value={cur.refunds} minus />
            <Line label="Payment fees" value={cur.fees} minus note="Charged by the online payment provider" />
            <Line label="Money kept after fees" value={cur.net} bold />
            <Line label="Medicines and supplies used" value={cur.cogs} minus note="Medicines, vaccines and supplies" />
            <Line label="Left after medicines and supplies" value={cur.gp} bold note={`${money(Math.round(cur.margin * 100))} left of every ₱100 earned`} />
            <Line label="Running costs" value={cur.opex} minus note="Salaries, rent, utilities, equipment, marketing, other" />
            <Line label={loss ? 'Loss' : 'Profit'} value={cur.profit} bold tone={profitTone} note={`${money(Math.round(cur.netMargin * 100))} profit per ₱100 earned`} />
          </View>
        </Section>
        <Section title="Where the money went" sub={`${money(moneyOut)} spent. ${catSpend[0]?.value ? `Most went to ${catSpend[0].label.toLowerCase()} (${money(catSpend[0].value)}).` : ''}`}>
          <HBars rows={catSpend} />
        </Section>
      </Cols>

      <Section title="Expenses" sub={`${cur.exp.length} recorded in ${now.label}`} action="Add expense" onAction={openForm}>
        {cur.exp.length === 0 ? <T.Small>No expenses recorded in this period. Add rent, salaries and supplies so the profit is accurate.</T.Small> : (
          <Group>{cur.exp.slice(0, 10).map(e => (
            <Row key={e.id} icon="receipt" title={`${e.category}, ${money(e.amount)}`} sub={`${fmtD(e.date)}${e.note ? ` · ${e.note}` : ''} · ${e.by}`} subLines={2}
              right={<Btn label="Remove" kind="line" small onPress={() => remove(e)} />} />
          ))}</Group>
        )}
      </Section>

      <Cols ratio={[1, 1]} stackBelow="desktop" gap={40}>
        <Section title="Revenue by service" sub={ranked(byService)[0] ? `${ranked(byService)[0].label} brought in the most: ${money(ranked(byService)[0].value)}.` : 'No paid services yet.'}><HBars rows={ranked(byService).slice(0, 6)} /></Section>
        <Section title="Revenue by payment method" sub={ranked(byMethod as Map<string, number>)[0] ? `Most people paid by ${ranked(byMethod as Map<string, number>)[0].label}.` : 'No payments yet.'}><HBars rows={ranked(byMethod as Map<string, number>)} /></Section>
      </Cols>

      <Cols ratio={[1, 1]} stackBelow="desktop" gap={40}>
        <View style={{ gap: 4 }}>
          <Text style={st.h2} accessibilityRole="header">Revenue summary</Text>
          <LedgerRow n={paidBills.length} label={paidBills.length === 1 ? 'bill fully paid' : 'bills fully paid'} icon="receipt" />
          <LedgerRow n={money(avgBill)} label="average bill" icon="banknote" />
          <LedgerRow n={billed ? pct(collected / billed) : '0.0%'} label={`collection rate on ${money(billed)} billed`} icon="chart" tone={colors.ok} />
          {ranked(byCategory).slice(0, 3).map(c => <LedgerRow key={c.label} n={money(c.value)} label={c.label.toLowerCase()} />)}
        </View>
        <View style={{ gap: 4 }}>
          <Text style={st.h2} accessibilityRole="header">Unpaid bills</Text>
          <Text style={[type.small, { marginBottom: 6 }]}>{outstanding ? `Customers owe ${money(outstanding)}. ${money(age(31, 99999))} of it is over 30 days old.` : 'Nobody owes the clinic anything right now.'}</Text>
          <LedgerRow alert n={money(outstanding)} label={`unpaid in ${owing.length} ${owing.length === 1 ? 'bill' : 'bills'}`} icon="wallet" onPress={() => nav.navigate('BillingList')} />
          <AgingBar parts={[
            { label: '0 to 7 days', value: age(0, 7), color: colors.blue },
            { label: '8 to 30 days', value: age(8, 30), color: colors.warn },
            { label: '31+ days', value: age(31, 99999), color: colors.bad },
          ]} />
        </View>
      </Cols>

      <Cols ratio={[1, 1]} stackBelow="desktop" gap={40}>
        <View style={{ gap: 4 }}>
          <Text style={st.h2} accessibilityRole="header">Visits and patients</Text>
          <LedgerRow n={completed} label={completed === 1 ? 'visit completed' : 'visits completed'} tone={colors.ok} />
          <LedgerRow n={cancelled} label="cancelled" />
          <LedgerRow alert n={missed} label="missed" />
          <LedgerRow n={booked ? pct(missed / booked) : '0.0%'} label="no-show rate" />
          <LedgerRow n={seen.size} label={seen.size === 1 ? 'owner seen' : 'owners seen'} icon="users" />
          <LedgerRow n={seen.size ? pct(returning / seen.size) : '0.0%'} label="were returning owners" icon="history" />
        </View>
        <Section title="Busiest days" sub={[...weekdays].sort((a, b) => b.value - a.value)[0]?.value ? `${[...weekdays].sort((a, b) => b.value - a.value)[0].label} is the busiest day.` : 'No appointments yet.'}><HBars rows={weekdays} format={n => String(n)} /></Section>
      </Cols>

      <Cols ratio={[1, 1]} stackBelow="desktop" gap={40}>
        <View style={{ gap: 4 }}>
          <Text style={st.h2} accessibilityRole="header">Care follow-ups</Text>
          <LedgerRow alert n={due.overdue.length} label={due.overdue.length === 1 ? 'pet overdue for care' : 'pets overdue for care'} icon="bell" onPress={() => nav.navigate('CareMonitor')} />
          <LedgerRow alert n={vax.length} label="vaccines and deworming due or overdue" icon="syringe" onPress={() => nav.navigate('CareMonitor')} />
        </View>
        <View style={{ gap: 4 }}>
          <Text style={st.h2} accessibilityRole="header">Online payments</Text>
          <LedgerRow n={money(cur.gross - cur.refunds)} label="collected online and in clinic" icon="wallet" tone={colors.ok} />
          <LedgerRow n={money(cur.fees)} label="gateway fees" icon="receipt" />
          <LedgerRow alert n={failed} label="failed or expired attempts" icon="alert" />
        </View>
      </Cols>

      <Section title="Staff" sub={`Work recorded in ${now.label}`}>
        <Group>{staff.map(u => {
          const handled = db.appts.filter(a => inR(a.date) && a.handledBy === u.name).length;
          const verified = db.bills.flatMap(b => b.payments).filter(p => inR(p.date) && p.verifiedBy === u.name).length;
          return <Row key={u.id} left={<Avatar name={u.name} size={36} />} title={u.name} sub={`${handled} appointments handled, ${verified} payments checked`} right={<Pill text={`${handled + verified}`} tone="info" />} />;
        })}</Group>
      </Section>

      <Sheet visible={help} onClose={() => setHelp(false)} title="How to read this" footer={<Btn label="Got it" onPress={() => setHelp(false)} style={{ flex: 1 }} />}>
        <Text style={type.body}>Pick a period at the top. Every number covers that period, and the ▲ ▼ arrows compare it with the period of the same length just before.</Text>
        <Text style={type.body}><Text style={{ fontWeight: '700' }}>Money in</Text> is what the clinic received, after refunds and payment fees.</Text>
        <Text style={type.body}><Text style={{ fontWeight: '700' }}>Money out</Text> is every expense you have recorded. Add expenses so the profit is right.</Text>
        <Text style={type.body}><Text style={{ fontWeight: '700' }}>Profit</Text> is money in minus money out. If it is negative it shows as a loss.</Text>
        <Text style={type.body}><Text style={{ fontWeight: '700' }}>Unpaid</Text> is what customers still owe, as of today. It is not counted as money in until it is paid.</Text>
        <Text style={type.body}>Green means good news and red means attention. Every chart has the numbers beside it, so you never need to rely on colour.</Text>
      </Sheet>
      <Sheet visible={!!info} onClose={() => setInfo(null)} title={info?.t || ''} footer={<Btn label="Close" onPress={() => setInfo(null)} style={{ flex: 1 }} />}>
        <Text style={type.body}>{info?.m}</Text>
      </Sheet>

      <Sheet visible={sheet} onClose={() => setSheet(false)} title="Add expense" footer={<><Btn label="Cancel" kind="line" onPress={() => setSheet(false)} style={{ flex: 1 }} /><Btn label="Save expense" onPress={save} style={{ flex: 1 }} /></>}>
        <Chips options={CATEGORIES.map(c => [c, c] as [ExpenseCategory, string])} value={form.category} onChange={c => setForm({ ...form, category: c })} />
        <Field label="Amount (₱)" keyboardType="decimal-pad" value={form.amount} onChangeText={v => setForm({ ...form, amount: v.replace(/[^0-9.]/g, '') })} error={err.amount} placeholder="0.00" />
        <Field label="Date" value={form.date} onChangeText={v => setForm({ ...form, date: v })} error={err.date} hint="YYYY-MM-DD" />
        <Field label="Note (optional)" value={form.note} onChangeText={v => setForm({ ...form, note: v })} placeholder="What was it for?" />
      </Sheet>
    </Screen>
  );
}

const st = StyleSheet.create({
  big:       { fontFamily: DISPLAY, fontSize: 56, lineHeight: 58, fontWeight: '600', letterSpacing: -2, fontVariant: ['tabular-nums'] },
  h2:        { fontFamily: DISPLAY, fontSize: 21, lineHeight: 26, fontWeight: '600', color: colors.ink, letterSpacing: -0.4, marginBottom: 4 },
  panel:     { gap: 16, paddingVertical: 20, borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.line },
  line:      { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 48, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.line },
  lineTotal: { borderTopWidth: 1, borderTopColor: colors.lineStrong, backgroundColor: colors.subtle },
  track:     { height: 8, borderRadius: 4, backgroundColor: colors.subtle, overflow: 'hidden' },
  fill:      { height: 8, borderRadius: 4, backgroundColor: colors.accentDeep || colors.blue },
});
