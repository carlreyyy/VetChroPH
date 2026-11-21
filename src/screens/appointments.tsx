// Booking, appointment detail and the clinic schedule (list and calendar, consultation P7).
// Consultation D8: a booking is confirmed automatically when the time slot is free. Staff can still suggest another
// time, cancel with a reason, check the client in, or mark a no-show (which adds a note to the owner record, D10).
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Avatar, Banner, Btn, Card, Chips, Divider, Empty, Field, FieldError, Group, Hint, IconTile, KV, Pill, Row, Screen, Section, Seg, Stack, T } from '../components/ui';
import { Sheet, useConfirm } from '../components/overlays';
import { PetAvatar } from '../components/PetArt';
import { Cols, PState, useBP } from '../components/responsive';
import { ScheduleTable } from './clinic';
import { Icon, IconName } from '../components/Icon';
import { useApp, sel } from '../store/AppStore';
import { useNav, useParams } from '../navigation/nav';
import { colors, radius, shadow, space, type, FONT } from '../theme';
import type { Appt } from '../types';
import { APPT, D, DOW, MON, byDateTime, diff, fmtD, fmtDS, isUpcoming, money, normPhone, parseD, rel, t12, ymd } from '../utils/format';

/* ---------- date strip + time slots ---------- */
export function SlotPicker({ date, time, onDate, onTime, exceptId, days = 21 }: { date: string; time: string; onDate: (d: string) => void; onTime: (t: string) => void; exceptId?: string; days?: number }) {
  const { act, db } = useApp();
  const dates = useMemo(() => Array.from({ length: days }, (_, i) => D(i)), [days]);
  const slots = date ? act.slotsFor(date, exceptId) : null;
  const am = slots?.filter(s => Number(s.t.slice(0, 2)) < 12) || [], pm = slots?.filter(s => Number(s.t.slice(0, 2)) >= 12) || [];
  const grid = (list: typeof am) => (
    <View style={sp.slots}>
      {list.map(s => { const on = s.t === time; return (
        <Pressable key={s.t} disabled={s.off} onPress={() => onTime(s.t)} style={[sp.slot, on && sp.slotOn, s.off && sp.slotOff]} accessibilityRole="radio" accessibilityState={{ selected: on, disabled: s.off }}>
          <Text style={[sp.slotText, on && { color: '#fff' }, s.off && { color: colors.ink3, textDecorationLine: 'line-through' }]}>{t12(s.t)}</Text>
        </Pressable>
      ); })}
    </View>
  );
  return (
    <Stack gap={12}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: space.lg + 2 }} style={{ marginHorizontal: -(space.lg + 2), flexGrow: 0 }}>
        {dates.map(d => { const dt = parseD(d); const closed = !db.settings.days[dt.getDay()]?.open; const on = d === date; return (
          <Pressable key={d} disabled={closed} onPress={() => { onDate(d); onTime(''); }} style={[sp.day, on && sp.dayOn, closed && { opacity: 0.4 }]} accessibilityRole="radio" accessibilityState={{ selected: on }}>
            <Text style={[sp.dayDow, on && { color: 'rgba(255,255,255,0.7)' }]}>{diff(d) === 0 ? 'Today' : DOW[dt.getDay()]}</Text>
            <Text style={[sp.dayNum, on && { color: '#fff' }]}>{dt.getDate()}</Text>
          </Pressable>
        ); })}
      </ScrollView>
      {!date ? <T.Small>Choose a date to see open times.</T.Small>
        : !slots ? <T.Small>The clinic is closed on this day.</T.Small>
        : slots.every(s => s.off) ? <Banner tone="warn" icon="calendar" title="No open times left" sub="Try another day." />
        : <>{am.length > 0 && <><Text style={type.label}>Morning</Text>{grid(am)}</>}{pm.length > 0 && <><Text style={type.label}>Afternoon</Text>{grid(pm)}</>}</>}
    </Stack>
  );
}

const SVC_ICON: Record<string, 'steth' | 'syringe' | 'clip'> = { Consultation: 'steth', 'Preventive care': 'syringe', Procedures: 'clip' };

function Stepper({ steps, at }: { steps: string[]; at: number }) {
  return (
    <View style={bk.stepper} accessibilityLabel={`Step ${at + 1} of ${steps.length}: ${steps[at]}`}>
      {steps.map((l, i) => (
        <React.Fragment key={l}>
          {i > 0 && <View style={[bk.stepLine, i <= at && { backgroundColor: colors.teal }]} />}
          <View style={{ alignItems: 'center', gap: 5, width: 64 }}>
            <View style={[bk.stepDot, i < at && bk.stepDone, i === at && bk.stepNow]}>
              {i < at ? <Icon name="check" size={14} color="#fff" strokeWidth={2.8} /> : <Text style={[bk.stepNum, i === at && { color: '#fff' }]}>{i + 1}</Text>}
            </View>
            <Text style={[bk.stepLabel, i === at && { color: colors.ink, fontWeight: '600' }]} numberOfLines={1}>{l}</Text>
          </View>
        </React.Fragment>
      ))}
    </View>
  );
}

function TimeGrid({ date, time, onTime, exceptId }: { date: string; time: string; onTime: (t: string) => void; exceptId?: string }) {
  const { act } = useApp();
  const slots = date ? act.slotsFor(date, exceptId) : null;
  if (!date) return <T.Small>Choose a date to see open times.</T.Small>;
  if (!slots) return <T.Small>The clinic is closed on this day.</T.Small>;
  if (slots.every(x => x.off)) return <Banner tone="warn" icon="calendar" title="No open times left" sub="Please choose another day." />;
  const am = slots.filter(x => Number(x.t.slice(0, 2)) < 12), pm = slots.filter(x => Number(x.t.slice(0, 2)) >= 12);
  const grid = (list: typeof slots) => (
    <View style={sp.slots}>
      {list.map(x => { const on = x.t === time; return (
        <Pressable key={x.t} disabled={x.off} onPress={() => onTime(x.t)} style={[sp.slot, on && sp.slotOn, x.off && sp.slotOff]} accessibilityRole="radio" accessibilityLabel={t12(x.t)} accessibilityState={{ selected: on, disabled: x.off }}>
          <Text style={[sp.slotText, on && { color: '#fff' }, x.off && { color: colors.ink3, textDecorationLine: 'line-through' }]}>{t12(x.t)}</Text>
        </Pressable>
      ); })}
    </View>
  );
  return <Stack gap={10}>{am.length > 0 && <><Text style={type.label}>Morning</Text>{grid(am)}</>}{pm.length > 0 && <><Text style={type.label}>Afternoon</Text>{grid(pm)}</>}</Stack>;
}

/** Booking as a short wizard: (Client) → Service → Schedule → Confirm. Consultation D8: confirmed automatically. */
export function Book() {
  const nav = useNav(); const { db, user, act } = useApp();
  const p = useParams<{ petId: string; ownerId: string; staff: string; rescheduleId: string }>();
  const clinic = user!.role !== 'owner';
  const resched = p.rescheduleId ? sel.appt(db, p.rescheduleId) : undefined;
  const steps = resched ? ['Schedule', 'Confirm'] : clinic ? ['Client', 'Service', 'Schedule', 'Confirm'] : ['Service', 'Schedule', 'Confirm'];
  const presetOwner = clinic ? (p.ownerId || (p.petId ? sel.pet(db, p.petId)?.ownerId : '') || '') : user!.ownerId!;
  const [step, setStep] = useState(clinic && !resched && presetOwner ? 1 : 0);
  const [ownerId, setOwnerId] = useState(presetOwner);
  const [q, setQ] = useState('');
  const [f, setF] = useState({ petId: resched?.petId || p.petId || '', service: resched?.service || '', date: '', time: '', reason: resched?.reason || '' });
  const [err, setErr] = useState<Record<string, string>>({});
  const pets = ownerId ? sel.petsOf(db, ownerId).filter(x => x.status === 'active') : [];
  const service = db.services.find(x => x.name === f.service);
  const pet = f.petId ? sel.pet(db, f.petId) : undefined;
  const name = steps[step];
  const last = step === steps.length - 1;
  const maxD = D(db.settings.bookAheadDays);

  const next = () => {
    const e: Record<string, string> = {};
    if (name === 'Client' && !ownerId) e.owner = 'Find and choose the client first';
    if (name === 'Service') { if (!f.petId) e.petId = 'Choose a pet'; if (!f.service) e.service = 'Choose a service'; }
    if (name === 'Schedule') {
      if (!f.date || !f.time) e.slot = 'Choose a date and an open time';
      else if (act.hasClash(f.petId, f.date, f.time, resched?.id)) e.slot = 'This pet already has an appointment at that time';
    }
    if (Object.keys(e).length) return setErr(e);
    setErr({});
    if (!last) return setStep(step + 1);
    if (resched) { act.rescheduleByOwner(resched.id, f.date, f.time); nav.goBack(); return; }
    const ap = act.book(f, clinic);
    if (typeof ap === 'string') { setStep(steps.indexOf('Schedule')); return setErr({ slot: ap }); }
    nav.replace('BookSuccess', { id: ap.id });
  };

  const matches = q.trim().length >= 2 ? db.owners.filter(o => o.name.toLowerCase().includes(q.toLowerCase()) || normPhone(o.phone).replace(/\s/g, '').includes(q.replace(/\D/g, '') || '¤')) : [];
  const owner = ownerId ? sel.owner(db, ownerId) : undefined;
  const bp = useBP();
  const canBack = step > (clinic && presetOwner && !resched ? 1 : 0);
  const back = () => { setErr({}); setStep(step - 1); };
  const nextLabel = last ? (resched ? 'Move appointment' : 'Confirm appointment') : 'Continue';
  const actions = <>
    {canBack && <Btn label="Back" kind="line" style={{ flex: 1 }} onPress={back} />}
    <Btn label={nextLabel} iconRight={last ? undefined : 'chevR'} icon={last ? 'check' : undefined} style={{ flex: 2 }} onPress={next} />
  </>;

  const facts: [IconName, string, string | undefined, string | undefined][] = [
    ...(clinic ? [['user', 'Client', owner?.name, owner?.phone] as [IconName, string, string | undefined, string | undefined]] : []),
    ['paw', 'Pet', pet?.name, pet?.breed],
    ['steth', 'Service', service?.name, service ? `${money(service.price)} · about ${service.minutes} min` : undefined],
    ['calendar', 'Date and time', f.date ? `${fmtD(f.date)}${f.time ? ` · ${t12(f.time)}` : ''}` : undefined, f.date ? rel(f.date) : undefined],
    ['pin', 'Clinic', db.clinic.name, undefined],
  ];
  const summary = (
    <Card style={{ gap: 16 }}>
      <Text style={type.h2}>{resched ? 'Moving this visit' : clinic ? 'New appointment' : 'Your booking'}</Text>
      {facts.map(([i, l, v, sub]) => (
        <View key={l} style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
          <IconTile name={i} size={34} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[type.small, { fontSize: 12.5 }]}>{l}</Text>
            <Text style={[type.h3, { fontSize: 14.5 }, !v && { color: colors.ink3, fontWeight: '500' }]} numberOfLines={1}>{v || 'Not chosen yet'}</Text>
            {!!sub && v && <Text style={[type.small, { fontSize: 12.5 }]} numberOfLines={1}>{sub}</Text>}
          </View>
        </View>
      ))}
      <View style={{ height: 1, backgroundColor: colors.line }} />
      <View style={{ gap: 10 }}>
        <Btn label={nextLabel} iconRight={last ? undefined : 'chevR'} icon={last ? 'check' : undefined} full onPress={next} />
        {canBack && <Btn label="Back" kind="line" full onPress={back} />}
      </View>
      <Hint icon="shield">{clinic ? 'Confirmed right away. The owner is notified.' : 'Open times are confirmed right away. Reminders go out 1 day and 2 hours before.'}</Hint>
    </Card>
  );

  const body = <>
      {name === 'Client' && <Section title="Find the client">
        {owner ? (
          <Group><Row left={<Avatar name={owner.name} />} title={owner.name} sub={owner.phone} right={<Btn label="Change" small kind="line" onPress={() => { setOwnerId(''); setF({ ...f, petId: '' }); }} />} /></Group>
        ) : <>
          <Field icon="search" placeholder="Search by mobile number or name" value={q} onChangeText={setQ} error={err.owner} />
          {matches.length > 0 && <Group>{matches.slice(0, 5).map(o => <Row key={o.id} left={<Avatar name={o.name} />} title={o.name} sub={o.phone} onPress={() => { setOwnerId(o.id); setErr({}); }} />)}</Group>}
          {q.trim().length >= 2 && matches.length === 0 && <Banner icon="info" title="No client found" sub="Pet owners create their own account in the app. Ask the client to sign up, then search again." />}
          {q.trim().length < 2 && <T.Small>For phone and walk-in clients who already have an account.</T.Small>}
        </>}
      </Section>}

      {name === 'Service' && <>
        <Section title="Which pet is this for?">
          {pets.length === 0 ? <Card><Empty icon="paw" title="No active pets" sub="Add a pet first, then come back to book." action={<Btn label="Add a pet" icon="plus" small onPress={() => nav.navigate('PetForm', { ownerId })} />} /></Card> : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -space.lg, flexGrow: 0 }} contentContainerStyle={{ paddingHorizontal: space.lg, gap: 10, paddingVertical: 2 }}>
              {pets.map(x => { const on = f.petId === x.id; return (
                <Pressable key={x.id} onPress={() => { setF({ ...f, petId: x.id }); setErr({ ...err, petId: '' }); }} accessibilityRole="radio" accessibilityLabel={x.name} accessibilityState={{ selected: on }} style={(st: PState) => [bk.petChip, on ? bk.petChipOn : st.hovered ? { borderColor: colors.lineStrong } : null]}>
                  <PetAvatar pet={x} size={36} />
                  <View><Text style={[type.h3, { fontSize: 14 }]}>{x.name}</Text><Text style={[type.small, { fontSize: 12 }]} numberOfLines={1}>{x.breed}</Text></View>
                  {on && <View style={bk.tick}><Icon name="check" size={12} color="#fff" strokeWidth={3} /></View>}
                </Pressable>
              ); })}
            </ScrollView>
          )}
          {!!err.petId && <FieldError text={err.petId} />}
        </Section>
        <Section title="Service">
          {!!err.service && <FieldError text={err.service} />}
          <View style={{ gap: 10 }}>
            {db.services.filter(x => x.active).map(x => { const on = f.service === x.name; return (
              <Pressable key={x.id} onPress={() => { setF({ ...f, service: x.name }); setErr({ ...err, service: '' }); }} accessibilityRole="radio" accessibilityLabel={x.name} accessibilityState={{ selected: on }} style={(st: PState) => [bk.svc, on ? bk.svcOn : st.hovered ? { borderColor: colors.lineStrong } : null]}>
                <View style={[bk.svcIcon, on && { backgroundColor: '#fff' }]}><Icon name={SVC_ICON[x.category] || 'steth'} size={19} color={colors.accentDeep} strokeWidth={2.1} /></View>
                <View style={{ flex: 1, minWidth: 0 }}><Text style={type.h3}>{x.name}</Text><Text style={type.small}>{x.category} · about {x.minutes} min</Text></View>
                <Text style={[type.h3, { fontSize: 14 }]}>{money(x.price)}</Text>
                <View style={[bk.radio, on && bk.radioOn]}>{on && <Icon name="check" size={13} color="#fff" strokeWidth={3} />}</View>
              </Pressable>
            ); })}
          </View>
        </Section>
      </>}

      {name === 'Schedule' && (() => {
        const cal = (
          <Section title="Date">
            <MonthCalendar value={f.date || D(0)} onChange={d => { setF(x => ({ ...x, date: d, time: '' })); setErr({}); }} dots={false} selected={!!f.date}
              disabled={d => diff(d) < 0 || d > maxD || !db.settings.days[parseD(d).getDay()]?.open} />
          </Section>
        );
        const times = (
          <Section title="Available times" sub={f.date ? fmtD(f.date) : undefined}>
            <TimeGrid date={f.date} time={f.time} onTime={t => { setF(x => ({ ...x, time: t })); setErr({}); }} exceptId={resched?.id} />
            {!!err.slot && <FieldError text={err.slot} />}
          </Section>
        );
        return bp.desktop ? <Cols ratio={[1, 1]}>{cal}{times}</Cols> : <>{cal}{times}</>;
      })()}

      {name === 'Confirm' && pet && <>
        <Section title="Review your booking">
          <Group>
            <Row left={<PetAvatar pet={pet} size={44} />} title={pet.name} sub={`${pet.breed} · ${owner?.name || ''}`} />
            <Row icon={SVC_ICON[service?.category || ''] || 'steth'} title={f.service} sub={service ? `About ${service.minutes} min` : undefined} right={<Text style={[type.h3, { fontSize: 14 }]}>{service ? money(service.price) : ''}</Text>} />
            <Row icon="calendar" title={fmtD(f.date)} sub={`${t12(f.time)} · ${rel(f.date)}`} onPress={() => setStep(steps.indexOf('Schedule'))} right={<Text style={{ color: colors.accentDeep, fontWeight: '600', fontSize: 13.5 }}>Change</Text>} />
            <Row icon="pin" title={db.clinic.name} sub={db.clinic.address} />
          </Group>
        </Section>
        {!resched && <Field label="Note for the clinic (optional)" multiline placeholder="e.g. Scratching his left ear for 3 days" value={f.reason} onChangeText={v => setF({ ...f, reason: v })} />}
        <Hint icon="clock">{clinic ? 'The booking is confirmed right away and the owner is notified.' : `Open times are confirmed right away. You can cancel or change it up to ${db.settings.cancelCutoffHours} hours before. Reminders are sent 1 day and 2 hours before.`}</Hint>
      </>}
  </>;

  return (
    <Screen title={resched ? 'Change time' : clinic ? 'New appointment' : 'Book an appointment'} wide={bp.desktop}
      sub={resched ? 'Pick a new date and time for this visit.' : clinic ? 'Book for a phone or walk-in client.' : 'Choose a service and an open time. It is confirmed right away.'}
      footer={bp.desktop ? undefined : actions}>
      {bp.desktop ? (
        <Cols ratio={[1, 340]} gap={32}>
          <><Stepper steps={steps} at={step} />{body}</>
          {summary}
        </Cols>
      ) : <><Stepper steps={steps} at={step} />{body}</>}
    </Screen>
  );
}

/** Shown after a successful booking. */
export function BookSuccess() {
  const nav = useNav(); const { db, user } = useApp(); const { id } = useParams<{ id: string }>();
  const a = sel.appt(db, id!)!; const pet = sel.pet(db, a.petId)!;
  return (
    <Screen hideHeader wide={false} centerFooter footer={<View style={{ flex: 1, gap: 10 }}>
      <Btn label="View appointment" full onPress={() => nav.replace('ApptDetail', { id: a.id })} />
      <Btn label={user!.role === 'owner' ? 'Back to home' : 'Back to schedule'} kind="line" full onPress={() => nav.goBack()} />
    </View>}>
      <View style={{ alignItems: 'center', gap: 10, paddingTop: 40, paddingBottom: 4 }}>
        {/* Triple-ring celebration halo */}
        <View style={bk.ring2}>
          <View style={bk.halo}>
            <View style={bk.success}><Icon name="check" size={34} color="#fff" strokeWidth={2.8} /></View>
          </View>
        </View>
        <View style={{ alignItems: 'center', gap: 6, marginTop: 4 }}>
          <Text style={{ fontFamily: FONT, fontSize: 24, fontWeight: '700', color: colors.ink, letterSpacing: -0.5, textAlign: 'center' }}>Appointment confirmed</Text>
          <Text style={[type.body, { color: colors.ink2, textAlign: 'center', maxWidth: 300, lineHeight: 22 }]}>{user!.role === 'owner' ? 'Your booking is confirmed. We will remind you 1 day and 2 hours before.' : 'The booking is confirmed and the owner was notified.'}</Text>
        </View>
      </View>
      <View style={bk.summary}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, backgroundColor: colors.subtle }}>
          <PetAvatar pet={pet} size={64} />
          <View style={{ flex: 1 }}><Text style={type.h2}>{pet.name}</Text><T.Small>{pet.breed}</T.Small></View>
          <Pill text="Confirmed" tone="ok" />
        </View>
        {([['steth', 'Service', a.service + (db.services.find(x => x.name === a.service) ? ` · ${money(db.services.find(x => x.name === a.service)!.price)}` : '')], ['calendar', 'Date and time', `${fmtD(a.date)} · ${t12(a.time)}`], ['pin', 'Clinic', db.clinic.name]] as const).map(([i, l, v]) => (
          <View key={l} style={bk.sumRow}>
            <View style={bk.sumIcon}><Icon name={i} size={16} color={colors.accentDeep} /></View>
            <View style={{ flex: 1 }}><Text style={[type.small, { fontSize: 12 }]}>{l}</Text><Text style={[type.h3, { fontSize: 14.5 }]}>{v}</Text></View>
          </View>
        ))}
      </View>
      <T.Small>Need to change it? You can cancel or move the visit up to {db.settings.cancelCutoffHours} hours before.</T.Small>
    </Screen>
  );
}

export function ApptDetail() {
  const nav = useNav(); const confirm = useConfirm(); const { db, user, act } = useApp();
  const p = useParams<{ id: string; fresh: string }>();
  const a = sel.appt(db, p.id!)!; const pet = sel.pet(db, a.petId)!; const owner = sel.owner(db, a.ownerId)!;
  const role = user!.role; const clinic = role !== 'owner';
  const [sheet, setSheet] = useState<'' | 'cancel' | 'offer' | 'missed'>('');
  const [reason, setReason] = useState(''); const [rErr, setRErr] = useState('');
  const [offer, setOffer] = useState({ date: '', time: '' });
  const bill = db.bills.find(b => b.apptId === a.id);
  const canChange = act.canOwnerChange(a);
  const isToday = diff(a.date) <= 0;

  let footer: React.ReactNode;
  if (!clinic) {
    if (a.status === 'resched') footer = <><Btn label="Decline" kind="line" style={{ flex: 1 }} onPress={() => confirm({ title: 'Decline the new time?', body: 'Your appointment will be cancelled. You can book again anytime.', ok: 'Decline', tone: 'bad', icon: 'x', onOk: () => act.respondOffer(a.id, false) })} /><Btn label="Accept new time" style={{ flex: 1.4 }} onPress={() => act.respondOffer(a.id, true)} /></>;
    else if (a.status === 'confirmed' && canChange) footer = <><Btn label="Cancel" kind="danger" style={{ flex: 1 }} onPress={() => confirm({ title: 'Cancel this appointment?', body: `${pet.name} · ${fmtD(a.date)} at ${t12(a.time)}`, ok: 'Cancel appointment', cancel: 'Keep it', tone: 'bad', icon: 'calendar', onOk: () => act.cancelByOwner(a.id) })} /><Btn label="Change time" kind="line" style={{ flex: 1.3 }} onPress={() => nav.navigate('Book', { rescheduleId: a.id })} /></>;
  } else {
    if (a.status === 'confirmed') footer = isToday
      ? <><Btn label="Mark missed" kind="line" style={{ flex: 1 }} onPress={() => { setReason(''); setSheet('missed'); }} /><Btn label="Check in" icon="check" style={{ flex: 1.3 }} onPress={() => act.setApptStatus(a.id, 'checked_in')} /></>
      : <><Btn label="Cancel" kind="danger" style={{ flex: 1 }} onPress={() => { setReason(''); setSheet('cancel'); }} /><Btn label="Suggest new time" kind="line" style={{ flex: 1.4 }} onPress={() => setSheet('offer')} /></>;
    else if (a.status === 'resched') footer = <Btn label="Cancel appointment" kind="danger" style={{ flex: 1 }} onPress={() => { setReason(''); setSheet('cancel'); }} />;
    else if (a.status === 'checked_in') footer = <><Btn label={role === 'admin' ? 'Consultation' : 'Reason for visit'} icon={role === 'admin' ? 'steth' : 'clip'} kind="line" style={{ flex: 1.2 }} onPress={() => nav.navigate('ConsultForm', { petId: pet.id, apptId: a.id })} /><Btn label="Complete" style={{ flex: 1 }} onPress={() => act.setApptStatus(a.id, 'completed')} /></>;
    else if (a.status === 'completed') footer = bill ? <Btn label="View bill" icon="receipt" kind="line" style={{ flex: 1 }} onPress={() => nav.navigate('BillDetail', { id: bill.id })} /> : <Btn label="Create bill" icon="receipt" style={{ flex: 1 }} onPress={() => nav.navigate('CreateBill', { petId: pet.id, apptId: a.id })} />;
  }

  return (
    <Screen title="Appointment" footer={footer}>
      {p.fresh && <Banner tone="ok" icon="check" title="Appointment confirmed" sub={clinic ? 'The owner was notified.' : `The time was open, so it is confirmed. You will get reminders 1 day and 2 hours before.`} />}
      {/* Premium hero card: navy date/service band + white pet row */}
      <View style={ad.hero}>
        <View style={ad.heroTop}>
          <View style={ad.dateTile}>
            <Text style={ad.dateMon}>{MON[parseD(a.date).getMonth()]}</Text>
            <Text style={ad.dateDay}>{parseD(a.date).getDate()}</Text>
          </View>
          <View style={{ flex: 1, gap: 3 }}>
            <Text style={ad.heroSvc} numberOfLines={1}>{a.service}</Text>
            <Text style={ad.heroTime}>{t12(a.time)} · {rel(a.date)}</Text>
          </View>
          <Pill text={APPT[a.status][0]} tone={APPT[a.status][1]} badge />
        </View>
        <View style={ad.heroPet}>
          <PetAvatar pet={pet} size={48} square />
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={type.h3}>{pet.name}</Text>
            <Text style={type.small} numberOfLines={1}>{pet.breed}{clinic ? ` · ${owner.name}` : a.reason ? ` · ${a.reason}` : ''}</Text>
          </View>
        </View>
      </View>
      {a.status === 'resched' && a.offer && <Banner tone="info" icon="calendar" title="New time suggested" sub={`${fmtD(a.offer.date)} at ${t12(a.offer.time)}. ${clinic ? 'Waiting for the owner.' : 'Accept it or decline below.'}`} />}
      {a.status === 'cancelled' && a.note && <Banner icon="info" title="Cancelled" sub={a.note} />}
      {a.status === 'missed' && <Banner tone="bad" icon="info" title="Marked as missed" sub={a.note || 'The client did not arrive.'} />}
      <Card>
        <KV rows={[
          ['Date', `${fmtD(a.date)} (${rel(a.date)})`], ['Time', t12(a.time)], ['Service', a.service],
          clinic && ['Owner', `${owner.name} · ${owner.phone}`], ['Note', a.reason || undefined],
          ['Booked by', a.by === 'staff' ? 'Clinic staff (phone or walk-in)' : 'Owner, in the app'],
          clinic && a.handledBy ? ['Handled by', a.handledBy] : null,
        ]} />
      </Card>
      <Group>
        <Row icon="paw" title="Pet profile and history" onPress={() => nav.navigate('PetDetail', { id: pet.id })} />
        {clinic && <Row icon="user" title={`Owner: ${owner.name}`} onPress={() => nav.navigate('OwnerDetail', { id: owner.id })} />}
        {!clinic && <Row icon="pin" title="Clinic location and contact" onPress={() => nav.navigate('ClinicInfo')} />}
        {bill && !clinic && <Row icon="receipt" title="Bill for this visit" onPress={() => nav.navigate('BillDetail', { id: bill.id })} />}
      </Group>
      {!clinic && a.status === 'confirmed' && !canChange && <Banner icon="phone" title={`Less than ${db.settings.cancelCutoffHours} hours to go`} sub="To cancel or change this visit now, please call or message the clinic." />}
      {clinic && a.status === 'confirmed' && !isToday && <T.Small>Check-in and no-show open on the day of the visit.</T.Small>}

      <Sheet visible={sheet === 'cancel'} onClose={() => setSheet('')} title="Cancel this appointment" footer={<Btn label="Cancel and notify owner" kind="dangerFill" style={{ flex: 1 }} onPress={() => { if (!reason.trim()) return setRErr('Give the owner a reason'); act.setApptStatus(a.id, 'cancelled', { note: `Cancelled by the clinic: ${reason.trim()}`, offer: undefined }); setSheet(''); }} />}>
        <Chips options={(['Vet not available that day', 'Clinic closed', 'Owner asked by phone'] as const).map(x => [x, x] as [string, string])} value={reason} onChange={v => { setReason(v); setRErr(''); }} />
        <Field label="Reason the owner will see" multiline value={reason} onChangeText={v => { setReason(v); setRErr(''); }} error={rErr} />
      </Sheet>
      <Sheet visible={sheet === 'missed'} onClose={() => setSheet('')} title="Mark as missed" footer={<Btn label="Mark missed and add note" kind="dangerFill" style={{ flex: 1 }} onPress={() => { act.setApptStatus(a.id, 'missed', { note: reason.trim() || 'Did not arrive' }); setSheet(''); }} />}>
        <T.Body muted>{owner.name} did not come for {pet.name}'s visit. A note is added to the owner record for the clinic.</T.Body>
        <Chips options={(['Did not arrive', 'Tried calling, no answer', 'Will rebook later'] as const).map(x => [x, x] as [string, string])} value={reason} onChange={setReason} />
        <Field label="Note (clinic only)" multiline value={reason} onChangeText={setReason} />
      </Sheet>
      <Sheet visible={sheet === 'offer'} onClose={() => setSheet('')} title="Suggest another time" footer={<Btn label="Send to owner" style={{ flex: 1 }} disabled={!offer.date || !offer.time} onPress={() => { act.setApptStatus(a.id, 'resched', { offer }); setSheet(''); }} />}>
        <T.Small>The owner accepts or declines the new time in the app.</T.Small>
        <SlotPicker date={offer.date} time={offer.time} onDate={d => setOffer({ date: d, time: '' })} onTime={t => setOffer(o => ({ ...o, time: t }))} exceptId={a.id} days={14} />
      </Sheet>
    </Screen>
  );
}

/** Month calendar with a dot on days that have appointments. */
function MonthCalendar({ value, onChange, disabled, dots = true, selected = true }: { value: string; onChange: (d: string) => void; disabled?: (d: string) => boolean; dots?: boolean; selected?: boolean }) {
  const { db } = useApp();
  const [month, setMonth] = useState(() => { const d = parseD(value); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const first = month.getDay(); const daysIn = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells: (string | null)[] = [...Array(first).fill(null), ...Array.from({ length: daysIn }, (_, i) => ymd(new Date(month.getFullYear(), month.getMonth(), i + 1)))];
  while (cells.length % 7) cells.push(null);
  const count = (d: string) => db.appts.filter(a => a.date === d && !['cancelled'].includes(a.status)).length;
  const shift = (n: number) => setMonth(new Date(month.getFullYear(), month.getMonth() + n, 1));
  return (
    <Card style={{ padding: 12, gap: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Pressable onPress={() => shift(-1)} hitSlop={8} style={cal.nav} accessibilityLabel="Previous month"><Text style={cal.navT}>‹</Text></Pressable>
        <Text style={[type.h3, { flex: 1, textAlign: 'center' }]}>{MON[month.getMonth()]} {month.getFullYear()}</Text>
        <Pressable onPress={() => shift(1)} hitSlop={8} style={cal.nav} accessibilityLabel="Next month"><Text style={cal.navT}>›</Text></Pressable>
      </View>
      <View style={cal.row}>{DOW.map(d => <Text key={d} style={cal.dow}>{d}</Text>)}</View>
      {Array.from({ length: cells.length / 7 }, (_, w) => (
        <View key={w} style={cal.row}>
          {cells.slice(w * 7, w * 7 + 7).map((d, i) => {
            if (!d) return <View key={i} style={cal.cell} />;
            const on = selected && d === value, today = diff(d) === 0, n = dots ? count(d) : 0, off = disabled?.(d);
            return (
              <Pressable key={i} disabled={off} onPress={() => onChange(d)} style={[cal.cell, today && !on && cal.cellToday, on && cal.cellOn]} accessibilityRole="button" accessibilityLabel={`${fmtD(d)}${dots ? `, ${n} appointments` : ''}`} accessibilityState={{ selected: on, disabled: off }}>
                <Text style={[cal.num, off && { color: colors.ink3, fontWeight: '400' }, today && !on && { color: colors.accentDeep, fontWeight: '700' }, on && { color: '#fff', fontWeight: '700' }]}>{parseD(d).getDate()}</Text>
                <View style={[cal.dot, { opacity: n ? 1 : 0 }, on && { backgroundColor: '#fff' }]} />
              </Pressable>
            );
          })}
        </View>
      ))}
    </Card>
  );
}

/** Staff and Administrator schedule: list or calendar, with monitoring counts for the Administrator. */
export function ClinicAppts() {
  const nav = useNav(); const { db, user } = useApp();
  const admin = user!.role === 'admin';
  const [view, setView] = useState<'list' | 'cal'>('list');
  const [tab, setTab] = useState<'today' | 'up' | 'past'>('today');
  const [day, setDay] = useState(D(0));
  const [range, setRange] = useState<'day' | 'week'>('day');
  const [q, setQ] = useState(''); const { wide } = useBP();
  const match = (a: Appt) => { if (!q.trim()) return true; const s2 = q.toLowerCase(); return sel.pet(db, a.petId)!.name.toLowerCase().includes(s2) || sel.owner(db, a.ownerId)!.name.toLowerCase().includes(s2); };
  const today = db.appts.filter(a => diff(a.date) === 0).sort(byDateTime);
  const up = db.appts.filter(a => diff(a.date) > 0 && isUpcoming(a)).sort(byDateTime);
  const past = db.appts.filter(a => diff(a.date) < 0).sort(byDateTime).reverse().slice(0, 40);
  const list = (view === 'cal' ? db.appts.filter(a => a.date === day).sort(byDateTime) : ({ today, up, past }[tab])).filter(match);

  const inRange = db.appts.filter(a => range === 'day' ? diff(a.date) === 0 : diff(a.date) <= 0 && diff(a.date) > -7);
  const count = (st: Appt['status'][]) => inRange.filter(a => st.includes(a.status)).length;

  return (
    <Screen title="Schedule" back={false} big tabbed sub={wide ? 'Appointments booked online, by phone and walk-ins.' : undefined} right={<View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
      {wide ? <View style={{ width: 210 }}><Seg options={[['list', 'List'], ['cal', 'Calendar']]} value={view} onChange={setView} /></View> : <Pressable onPress={() => setView(view === 'list' ? 'cal' : 'list')} accessibilityRole="button" accessibilityLabel={view === 'list' ? 'Show calendar' : 'Show list'} style={ca.toggle}>
        <Icon name={view === 'list' ? 'calgrid' : 'list'} size={19} color={colors.accentDeep} />
      </Pressable>}
      <Btn label={wide ? 'New appointment' : 'New'} icon="plus" small={!wide} onPress={() => nav.navigate('Book', { staff: '1' })} />
    </View>}>
      {admin && <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <T.H3>Appointment monitoring</T.H3>
          <View style={{ flexDirection: 'row', gap: 4, backgroundColor: colors.subtle, padding: 3, borderRadius: 12 }}>
            {(['day', 'week'] as const).map(r => <Pressable key={r} onPress={() => setRange(r)} style={{ paddingHorizontal: 12, height: 30, justifyContent: 'center', borderRadius: 10, backgroundColor: range === r ? colors.surface : 'transparent' }}><Text style={{ fontWeight: '700', fontSize: 12.5, color: range === r ? colors.ink : colors.ink2 }}>{r === 'day' ? 'Today' : 'Last 7 days'}</Text></Pressable>)}
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {([['Confirmed', ['confirmed', 'checked_in', 'completed', 'resched'], colors.accentDeep], ['Completed', ['completed'], colors.ok], ['Cancelled', ['cancelled'], colors.ink2], ['Missed', ['missed'], colors.bad]] as const).map(([l, st, c]) => (
            <View key={l} style={{ flex: 1, alignItems: 'center', gap: 2 }}><Text style={{ fontFamily: FONT, fontSize: 22, fontWeight: '700', color: c }}>{count([...st])}</Text><Text style={[type.small, { fontSize: 12 }]}>{l}</Text></View>
          ))}
        </View>
      </Card>}
      {wide ? (view === 'cal' ? (
        <Cols ratio={[380, 1]}>
          <MonthCalendar value={day} onChange={setDay} />
          <>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
              <Text style={[type.h1, { flex: 1 }]}>{rel(day)} · {fmtD(day)}</Text>
              <Field icon="search" placeholder="Search pet or owner" value={q} onChangeText={setQ} style={{ width: 280 }} />
            </View>
            {list.length === 0 ? <Empty icon="calendar" title="No appointments" sub="Pick another day or add a booking." /> : <ScheduleTable list={list} showStaff={admin} />}
          </>
        </Cols>
      ) : <>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <View style={{ flex: 1 }}><Chips options={[['today', 'Today', today.length], ['up', 'Upcoming', up.length], ['past', 'Past']]} value={tab} onChange={setTab} /></View>
          <Field icon="search" placeholder="Search pet or owner" value={q} onChangeText={setQ} style={{ width: 320 }} />
        </View>
        {list.length === 0 ? <Empty icon="calendar" title="No appointments" /> : Array.from(new Set(list.map(a => a.date))).map(d => (
          <View key={d} style={{ gap: 10 }}>
            {tab !== 'today' && <Text style={type.eyebrow}>{rel(d)} · {fmtDS(d)}</Text>}
            <ScheduleTable list={list.filter(a => a.date === d)} showStaff={admin} />
          </View>
        ))}
      </>) : <>
      {view === 'cal'
        ? <><MonthCalendar value={day} onChange={setDay} /><Text style={type.h2}>{rel(day)} · {fmtD(day)}</Text></>
        : <Chips options={[['today', 'Today', today.length], ['up', 'Upcoming', up.length], ['past', 'Past']]} value={tab} onChange={setTab} />}
      <Field icon="search" placeholder="Search pet or owner" value={q} onChangeText={setQ} />
      {list.length === 0 ? <Empty icon="calendar" title="No appointments" sub={view === 'cal' ? 'Pick another day or add a booking.' : undefined} /> : (
        <Stack gap={14}>
          {Array.from(new Set(list.map(a => a.date))).map(d => (
            <View key={d} style={{ gap: 8 }}>
              {(view === 'list' && tab !== 'today') && <Text style={type.eyebrow}>{rel(d)} · {fmtDS(d)}</Text>}
              <Group>
                {list.filter(a => a.date === d).map(a => {
                  const p = sel.pet(db, a.petId)!; const o = sel.owner(db, a.ownerId)!;
                  return (
                    <Pressable key={a.id} onPress={() => nav.navigate('ApptDetail', { id: a.id })} accessibilityRole="button" style={({ pressed }) => [ca.row, pressed && { backgroundColor: colors.subtle }]}>
                      <View style={ca.time}><Text style={ca.timeText}>{t12(a.time).split(' ')[0]}</Text><Text style={ca.ampm}>{t12(a.time).split(' ')[1]}</Text></View>
                      <PetAvatar pet={p} size={40} />
                      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                        <Text style={type.h3} numberOfLines={1}>{p.name} <Text style={{ color: colors.ink2, fontWeight: '400' }}>· {o.name}</Text></Text>
                        <T.Small numberOfLines={1}>{a.service}{a.by === 'staff' ? ' · Phone/walk-in' : ''}{a.handledBy && admin ? ` · ${a.handledBy}` : ''}</T.Small>
                        <View style={{ marginTop: 2 }}><Pill text={APPT[a.status][0]} tone={APPT[a.status][1]} badge /></View>
                      </View>
                    </Pressable>
                  );
                })}
              </Group>
            </View>
          ))}
        </Stack>
      )}
      </>}
    </Screen>
  );
}

const sp = StyleSheet.create({
  day: { width: 56, height: 68, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', gap: 2 },
  dayOn: { backgroundColor: colors.teal, borderColor: colors.teal },
  dayDow: { fontFamily: FONT, fontSize: 12, fontWeight: '500', color: colors.ink2 },
  dayNum: { fontFamily: FONT, fontSize: 18, fontWeight: '700', color: colors.ink },
  slots: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  slot: { width: '31.6%', height: 42, borderRadius: 21, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  slotOn: { backgroundColor: colors.teal, borderColor: colors.teal },
  slotOff: { backgroundColor: colors.subtle, borderColor: colors.subtle },
  slotText: { fontFamily: FONT, fontSize: 14, fontWeight: '500', color: colors.ink },
});
const bk = StyleSheet.create({
  stepper: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 4 },
  stepLine: { flex: 1, height: 2, backgroundColor: '#C8D6E8', marginTop: 13, marginHorizontal: -16, maxWidth: 80 },
  stepDot: { width: 28, height: 28, borderRadius: 14, borderWidth: 1.5, borderColor: '#9FB4CF', backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  stepNow: { borderColor: colors.teal, backgroundColor: colors.teal },
  stepDone: { backgroundColor: colors.teal, borderColor: colors.teal },
  stepNum: { fontFamily: FONT, fontSize: 13, fontWeight: '700', color: colors.teal },
  stepLabel: { fontFamily: FONT, fontSize: 12, color: colors.ink2 },
  ring: { padding: 3, borderRadius: 34, borderWidth: 2, borderColor: 'transparent' },
  title: { fontFamily: FONT, fontSize: 20, lineHeight: 26, fontWeight: '700', color: colors.ink, letterSpacing: -0.3 },
  svc: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 16, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, ...shadow },
  svcOn: { borderColor: colors.accentDeep, borderWidth: 1.5, paddingVertical: 11.5, paddingHorizontal: 13.5, backgroundColor: colors.accentSoft },
  tip: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, backgroundColor: colors.subtle, borderWidth: 1, borderColor: colors.accentSoft },
  tipIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.accentDeep, alignItems: 'center', justifyContent: 'center' },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: colors.lineStrong, alignItems: 'center', justifyContent: 'center' },
  radioOn: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.accentDeep, alignItems: 'center', justifyContent: 'center' },
  petChip: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, paddingLeft: 8, paddingRight: 14, borderRadius: 28, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface },
  petChipOn: { borderColor: colors.accentDeep, borderWidth: 1.5, paddingVertical: 7.5, paddingLeft: 7.5, paddingRight: 13.5, backgroundColor: colors.accentSoft },
  tick: { width: 18, height: 18, borderRadius: 9, backgroundColor: colors.accentDeep, alignItems: 'center', justifyContent: 'center', marginLeft: 2 },
  picked: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, backgroundColor: colors.accentSoft, alignSelf: 'flex-start' },
  svcIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.subtle, alignItems: 'center', justifyContent: 'center' },
  ring2:   { width: 128, height: 128, borderRadius: 64, borderWidth: 2, borderColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
  halo: { width: 100, height: 100, borderRadius: 50, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
  success: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.accentDeep, alignItems: 'center', justifyContent: 'center' },
  summary: { backgroundColor: colors.surface, borderRadius: 18, borderWidth: 1, borderColor: colors.line, overflow: 'hidden', ...shadow },
  sumRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: colors.line },
  sumIcon: { width: 32, height: 32, borderRadius: 9, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
});
const cal = StyleSheet.create({
  row: { flexDirection: 'row' },
  dow: { fontFamily: FONT, flex: 1, textAlign: 'center', fontSize: 11.5, fontWeight: '500', color: colors.ink2, paddingVertical: 6 },
  cell: { flex: 1, height: 40, marginVertical: 2, marginHorizontal: 3, alignItems: 'center', justifyContent: 'center', borderRadius: 20, gap: 2 },
  cellOn: { backgroundColor: colors.accentDeep },
  cellToday: { borderWidth: 1.5, borderColor: colors.accent },
  num: { fontFamily: FONT, fontSize: 14, fontWeight: '500', color: colors.ink },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.accent },
  nav: { width: 34, height: 34, borderRadius: 11, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  navT: { fontFamily: FONT, fontSize: 20, lineHeight: 22, color: colors.ink, fontWeight: '600' },
});
const ca = StyleSheet.create({
  toggle: { width: 38, height: 38, borderRadius: 12, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 14 },
  time: { width: 46, alignItems: 'flex-start' },
  ampm: { fontFamily: FONT, fontSize: 11, color: colors.ink3, fontWeight: '500' },
  timeText: { fontFamily: FONT, fontSize: 15, fontWeight: '600', color: colors.ink },
});
const ad = StyleSheet.create({
  hero:     { borderRadius: 16, overflow: 'hidden', ...shadow },
  heroTop:  { backgroundColor: colors.accentDeep, padding: 16, flexDirection: 'row', gap: 14, alignItems: 'center' },
  dateTile: { width: 52, height: 58, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center', gap: 1 },
  dateMon:  { fontFamily: FONT, fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase' },
  dateDay:  { fontFamily: FONT, fontSize: 22, fontWeight: '700', color: '#fff' },
  heroSvc:  { fontFamily: FONT, fontSize: 16, fontWeight: '700', color: '#fff', letterSpacing: -0.3 },
  heroTime: { fontFamily: FONT, fontSize: 13, color: 'rgba(255,255,255,0.7)' },
  heroPet:  { backgroundColor: colors.surface, padding: 14, flexDirection: 'row', gap: 12, alignItems: 'center' },
});
