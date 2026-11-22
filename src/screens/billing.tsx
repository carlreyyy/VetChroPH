// Bills, payment by GCash / other e-wallet QR or bank transfer with proof upload, verification and receipts.
// The app never confirms an e-wallet or bank payment by itself: the owner uploads proof and the clinic checks its own account.
// Consultation D14: bills are paid in full (no partial payments).
import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { pickFile } from '../utils/files';
import { Banner, Btn, Card, Empty, Field, Group, IconBtn, KV, Pill, Row, Screen, Section, Stack, T, Tabs } from '../components/ui';
import { Sheet, useConfirm } from '../components/overlays';
import { BrandTile } from '../components/Brand';
import { Cell, Cols, DataTable, useBP } from '../components/responsive';
import { Icon } from '../components/Icon';
import { PetAvatar, QrArt } from '../components/PetArt';
import { useApp, sel } from '../store/AppStore';
import { useNav, useParams } from '../navigation/nav';
import { colors, radius, shadow, type, FONT, DISPLAY } from '../theme';
import type { BillItem, PayAccount } from '../types';
import { BILL, billBalance, billPaid, billState, billTotal, diff, fmtD, fmtDY, money } from '../utils/format';

const PAY_TONE = { pending: 'warn', confirmed: 'ok', rejected: 'bad' } as const;
const PAY_LABEL = { pending: 'Waiting for check', confirmed: 'Confirmed', rejected: 'Rejected' } as const;

export function BillDetail() {
  const nav = useNav(); const confirm = useConfirm(); const { db, user, act } = useApp();
  const { id } = useParams<{ id: string }>(); const b = sel.bill(db, id!)!;
  const pet = sel.pet(db, b.petId)!; const owner = sel.owner(db, b.ownerId)!;
  const clinic = user!.role !== 'owner'; const st = billState(b); const bal = billBalance(b);
  const pending = b.payments.find(p => p.status === 'pending');
  const [rejOpen, setRejOpen] = useState(false); const [why, setWhy] = useState(''); const [whyErr, setWhyErr] = useState('');

  let footer: React.ReactNode;
  if (!clinic && bal > 0 && !pending) footer = <Btn label={`Pay ${money(bal)}`} icon="wallet" style={{ flex: 1 }} onPress={() => nav.navigate('PayBill', { id: b.id })} />;
  else if (clinic && pending) footer = <><Btn label="Reject" kind="danger" style={{ flex: 1 }} onPress={() => setRejOpen(true)} /><Btn label="Confirm payment" style={{ flex: 1.5 }} onPress={() => confirm({ title: `Confirm ${money(pending.amount)}?`, body: `Only confirm if reference ${pending.ref} is in the clinic's ${pending.method} account.`, ok: 'Confirm', tone: 'ok', icon: 'check', onOk: () => act.verifyPayment(b.id, pending.id, true) })} /></>;
  else if (clinic && bal > 0) footer = <Btn label={`Record ${money(bal)} cash`} icon="banknote" style={{ flex: 1 }} onPress={() => confirm({ title: `Record ${money(bal)} cash?`, body: 'Bills are paid in full. A receipt is issued and the owner is notified.', ok: 'Record payment', tone: 'ok', icon: 'banknote', onOk: () => act.recordCash(b.id) })} />;
  else if (billPaid(b) > 0) footer = <Btn label="View receipt" icon="receipt" kind="line" style={{ flex: 1 }} onPress={() => nav.navigate('Receipt', { id: b.id })} />;

  return (
    <Screen title="Bill" footer={footer}>
      {/* Premium bill hero card */}
      <View style={{ borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface }}>
        <View style={{ backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.line, padding: 16, flexDirection: 'row', gap: 14, alignItems: 'center' }}>
          <View style={{ width: 52, height: 52, borderRadius: 13, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="receipt" size={24} color={colors.accent} strokeWidth={1.9} />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={{ fontFamily: DISPLAY, fontSize: 32, fontWeight: '600', color: colors.ink, letterSpacing: -0.6 }}>{money(billTotal(b))}</Text>
            <Text style={{ fontFamily: FONT, fontSize: 13, color: colors.ink2 }}>{fmtDY(b.date)}{clinic ? ` · ${owner.name}` : ''}</Text>
          </View>
          <Pill text={BILL[st][0]} tone={BILL[st][1]} badge />
        </View>
        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center', padding: 14, backgroundColor: colors.surface }}>
          <PetAvatar pet={pet} size={40} />
          <View style={{ flex: 1, gap: 1 }}>
            <Text style={type.h3}>{pet.name}</Text>
            <Text style={type.small} numberOfLines={1}>{pet.breed}</Text>
          </View>
          <Text style={{ fontFamily: FONT, fontSize: 14, fontWeight: '700', color: bal > 0 ? colors.bad : colors.ok }}>
            {bal > 0 ? `Due: ${money(bal)}` : 'Paid in full'}
          </Text>
        </View>
      </View>
      {clinic && pending && <Banner tone="warn" icon="shield" title="Check the clinic account first" sub={`Open the clinic's ${pending.method} account and look for reference ${pending.ref} for ${money(pending.amount)}. Screenshots can be edited, so always check the real account.`} />}
      {!clinic && pending && <Banner tone="warn" icon="clock" title="Payment proof sent" sub="The clinic is checking its account. You will get a notification when it is confirmed." />}
      <Card>
        {b.items.map((i, k) => (
          <View key={k} style={bl.item}><Text style={[type.body, { flex: 1 }]}>{i.name}{i.qty > 1 ? ` × ${i.qty}` : ''}</Text><Text style={type.body}>{money(i.price * i.qty)}</Text></View>
        ))}
        <View style={[bl.item, { borderBottomWidth: 0, paddingTop: 14 }]}><Text style={[type.h3, { flex: 1 }]}>Total</Text><Text style={type.h2}>{money(billTotal(b))}</Text></View>
        <KV rows={[['Paid', money(billPaid(b))], ['Balance', money(bal)]]} />
      </Card>
      {b.payments.length > 0 && <Section title="Payments">
        <Group>
          {b.payments.map(p => (
            <Row key={p.id} icon={p.method === 'Cash' ? 'banknote' : p.method === 'Bank transfer' ? 'bank' : 'qr'} title={`${money(p.amount)} · ${p.method}`}
              sub={[fmtD(p.date), p.ref && `Ref ${p.ref}`, p.proof && `Proof: ${p.proof}`, p.verifiedBy && `Checked by ${p.verifiedBy}`, p.reason && `Reason: ${p.reason}`].filter(Boolean).join(' · ')} subLines={3}
              right={<Pill text={PAY_LABEL[p.status]} tone={PAY_TONE[p.status]} />} />
          ))}
        </Group>
      </Section>}
      {clinic && pending && <Card style={{ alignItems: 'center', gap: 8 }}>
        <View style={bl.proof}><Icon name="image" size={30} color={colors.warmOrange} /><T.Small>{pending.proof}</T.Small></View>
        <T.Small>Screenshot uploaded by {pending.by} on {fmtD(pending.date)}</T.Small>
      </Card>}
      {!clinic && bal > 0 && !pending && <T.Small>You can also pay in cash at the clinic. Bills are paid in full.</T.Small>}
      {clinic && <Group><Row icon="user" title={owner.name} sub={owner.phone} onPress={() => nav.navigate('OwnerDetail', { id: owner.id })} /></Group>}

      <Sheet visible={rejOpen} onClose={() => setRejOpen(false)} title="Reject this payment" footer={<Btn label="Reject and notify owner" kind="dangerFill" style={{ flex: 1 }} onPress={() => {
        if (!why.trim()) return setWhyErr('Tell the owner why'); act.verifyPayment(b.id, pending!.id, false, why.trim()); setRejOpen(false);
      }} />}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {['Reference not found in our account', 'Amount does not match', 'Screenshot is unclear'].map(x => (
            <Pressable key={x} onPress={() => { setWhy(x); setWhyErr(''); }} style={[bl.chip, why === x && { backgroundColor: colors.bad, borderColor: colors.bad }]}><Text style={{ fontFamily: FONT, fontWeight: '600', fontSize: 13, color: why === x ? '#fff' : colors.ink }}>{x}</Text></Pressable>
          ))}
        </View>
        <Field label="Reason the owner will see" multiline value={why} onChangeText={v => { setWhy(v); setWhyErr(''); }} error={whyErr} />
        <T.Small>The owner can submit new proof after a rejection.</T.Small>
      </Sheet>
    </Screen>
  );
}

const KIND_ICON = { GCash: 'qr', 'Other e-wallet': 'phoneapp', 'Bank transfer': 'bank' } as const;
export function PayBill() {
  const nav = useNav(); const { db, act, toast } = useApp(); const { id } = useParams<{ id: string }>();
  const b = sel.bill(db, id!)!; const bal = billBalance(b);
  const accounts = db.clinic.accounts.filter(x => x.on);
  const [accId, setAccId] = useState(accounts[0]?.id || '');
  const acc = accounts.find(x => x.id === accId) as PayAccount;
  const [f, setF] = useState({ ref: '', proof: '' }); const [err, setErr] = useState<Record<string, string>>({});
  const chooseProof = async () => {
    const r = await pickFile('.jpg,.jpeg,.png');
    if (typeof r === 'string') return setErr({ ...err, proof: r });
    const name = r ? r.name : Platform.OS !== 'web' ? (bank ? 'bank-transfer.png' : `${acc?.provider.toLowerCase()}-screenshot.jpg`) : '';
    if (name) { setF(x => ({ ...x, proof: name })); setErr(x => ({ ...x, proof: '' })); }
  };
  const bank = acc?.kind === 'Bank transfer';
  const submit = () => {
    const e: Record<string, string> = {};
    if (f.ref.replace(/\W/g, '').length < 6) e.ref = 'Enter the reference number from your e-wallet or bank app';
    if (!f.proof) e.proof = 'Upload your payment screenshot';
    if (Object.keys(e).length) return setErr(e);
    act.submitProof(b.id, acc.kind, f.ref.trim(), f.proof); nav.goBack();
  };
  return (
    <Screen title="Pay bill" sub="Pay with an e-wallet or bank transfer, then send your proof of payment." footer={<Btn label="Submit payment proof" icon="upload" style={{ flex: 1 }} onPress={submit} />}>
      <View style={{ borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface }}>
        <View style={{ backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.line, padding: 18, flexDirection: 'row', gap: 14, alignItems: 'center' }}>
          <View style={{ width: 52, height: 52, borderRadius: 14, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="wallet" size={24} color={colors.accent} strokeWidth={1.9} />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={{ fontFamily: FONT, fontSize: 11.5, fontWeight: '600', color: colors.ink2 }}>Amount due</Text>
            <Text style={{ fontFamily: DISPLAY, fontSize: 38, fontWeight: '600', color: colors.ink, letterSpacing: -0.8 }}>{money(bal)}</Text>
          </View>
        </View>
        <View style={{ backgroundColor: colors.surface, paddingHorizontal: 18, paddingVertical: 12 }}>
          <Text style={type.small}>{sel.pet(db, b.petId)!.name} · visit on {fmtD(b.date)}</Text>
        </View>
      </View>
      <Section title="Payment method">
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {accounts.map(x => { const on = x.id === accId; return (
            <Pressable key={x.id} onPress={() => { setAccId(x.id); setF({ ...f, proof: '' }); }} style={[bl.method, on && bl.methodOn]} accessibilityRole="radio" accessibilityLabel={x.provider} accessibilityState={{ selected: on }}>
              {on && <View style={bl.methodCheck}><Icon name="check" size={10} color={colors.accentDeep} strokeWidth={3.2} /></View>}
              <Icon name={KIND_ICON[x.kind]} size={24} color={on ? '#fff' : colors.accent} />
              <Text style={[type.h3, { fontSize: 13.5, textAlign: 'center' }, on && { color: '#fff' }]} numberOfLines={1}>{x.kind === 'Bank transfer' ? 'Bank transfer' : x.provider}</Text>
            </Pressable>
          ); })}
        </View>
      </Section>
      {acc && <View style={bl.payCard}>
        {bank
          ? <View style={{ alignItems: 'center', gap: 4, paddingVertical: 8 }}><View style={bl.bankIcon}><Icon name="bank" size={24} color={colors.warmOrange} /></View><Text style={[type.small, { marginTop: 6 }]}>{acc.provider} account number</Text><Text style={{ fontFamily: FONT, fontSize: 22, fontWeight: '700', letterSpacing: 0.6, color: colors.ink }}>{acc.number}</Text></View>
          : <><View style={bl.qrBox}><QrArt size={168} seed={acc.qrSeed} /></View><Text style={[type.h3, { fontSize: 14, marginTop: 2 }]}>Scan to pay with {acc.provider}</Text></>}
        <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: colors.line, marginVertical: 4 }} />
        <View style={{ flexDirection: 'row', alignItems: 'center', alignSelf: 'stretch', gap: 10 }}>
          <View style={{ flex: 1 }}><Text style={type.h3}>{acc.accountName}</Text><T.Small>{acc.provider} · {acc.number} · Business account</T.Small></View>
        </View>
        <Pressable onPress={() => toast(`Copied ${acc.number}`)} accessibilityRole="button" accessibilityLabel="Copy account number" hitSlop={8} style={({ pressed }) => [{ flexDirection: 'row', alignItems: 'center', gap: 6 }, pressed && { opacity: 0.6 }]}>
          <Text style={{ fontFamily: FONT, color: colors.warmOrange, fontWeight: '600', fontSize: 14, textDecorationLine: 'underline' }}>Copy account number</Text><Icon name="copy" size={16} color={colors.warmOrange} />
        </Pressable>
      </View>}
      <Section title="How to pay">
        <View style={bl.steps}>
          {[bank ? 'Open your bank app and transfer to the account above.' : `Open ${acc?.provider || 'your e-wallet'} and scan the QR, or send to the number.`, `Send exactly ${money(bal)}, then take a screenshot.`, 'Enter the reference number and upload the screenshot below.'].map((t, i) => (
            <View key={i} style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}><View style={bl.step}><Text style={{ color: '#fff', fontWeight: '700', fontSize: 12 }}>{i + 1}</Text></View><Text style={[type.body, { flex: 1, fontSize: 14, lineHeight: 20 }]}>{t}</Text></View>
          ))}
        </View>
      </Section>
      <Section title="Proof of payment">
        <Field label="Reference number" placeholder="e.g. 5102 441 902" value={f.ref} onChangeText={v => { setF({ ...f, ref: v }); setErr({ ...err, ref: '' }); }} error={err.ref} />
        <Pressable onPress={chooseProof} style={[bl.drop, !!err.proof && { borderColor: colors.bad }, !!f.proof && { borderStyle: 'solid', borderColor: colors.warmOrange, backgroundColor: '#FFF8F3' }]} accessibilityRole="button">
          <Icon name={f.proof ? 'check' : 'upload'} size={20} color={colors.warmOrange} />
          <Text style={type.h3}>{f.proof || 'Upload payment screenshot'}</Text>
          <T.Small>{f.proof ? 'Click to choose another' : 'JPEG or PNG, up to 10 MB'}</T.Small>
        </Pressable>
        {!!err.proof && <T.Small color={colors.bad}>{err.proof}</T.Small>}
      </Section>
      <Banner icon="info" title="Paying does not confirm it in the app" sub="The clinic checks its own account, then confirms your payment and issues a receipt." />
    </Screen>
  );
}

export function Receipt() {
  const { db } = useApp(); const { id } = useParams<{ id: string }>();
  const b = sel.bill(db, id!)!; const pet = sel.pet(db, b.petId)!; const owner = sel.owner(db, b.ownerId)!;
  const paid = b.payments.filter(p => p.status === 'confirmed');
  return (
    <Screen title="Receipt">
      <Card style={{ gap: 14 }}>
        <View style={{ alignItems: 'center', gap: 4 }}>
          <BrandTile size={48} />
          <T.H2>{db.clinic.name}</T.H2>
          <T.Small>{db.clinic.address}</T.Small>
        </View>
        <View style={bl.dash} />
        <KV rows={[['Receipt no.', `OR-${b.id.toUpperCase()}`], ['Date', fmtDY(paid[paid.length - 1]?.date || b.date)], ['Owner', owner.name], ['Pet', `${pet.name} (${pet.breed})`]]} />
        <View style={bl.dash} />
        {b.items.map((i, k) => <View key={k} style={{ flexDirection: 'row' }}><Text style={[type.body, { flex: 1 }]}>{i.name}{i.qty > 1 ? ` × ${i.qty}` : ''}</Text><Text style={type.body}>{money(i.price * i.qty)}</Text></View>)}
        <View style={{ flexDirection: 'row' }}><Text style={[type.h3, { flex: 1 }]}>Total</Text><Text style={type.h3}>{money(billTotal(b))}</Text></View>
        <View style={bl.dash} />
        {paid.map(p => <View key={p.id} style={{ flexDirection: 'row' }}><Text style={[type.small, { flex: 1 }]}>{p.method}{p.ref ? ` · ${p.ref}` : ''} · checked by {p.verifiedBy}</Text><Text style={type.body}>{money(p.amount)}</Text></View>)}
        <View style={{ flexDirection: 'row' }}><Text style={[type.h3, { flex: 1 }]}>Balance</Text><Text style={type.h3}>{money(billBalance(b))}</Text></View>
      </Card>
      <T.Small>Saving or sharing the receipt as a PDF comes with the backend.</T.Small>
    </Screen>
  );
}

export function Billing() {
  const nav = useNav(); const { db } = useApp();
  const [tab, setTab] = useState<'verify' | 'unpaid' | 'paid'>('verify'); const [q, setQ] = useState('');
  const bills = db.bills.filter(b => { if (!q.trim()) return true; const s = q.toLowerCase(); return sel.pet(db, b.petId)!.name.toLowerCase().includes(s) || sel.owner(db, b.ownerId)!.name.toLowerCase().includes(s); })
    .sort((a, b) => b.date.localeCompare(a.date));
  const verify = bills.filter(b => billState(b) === 'pending'), unpaid = bills.filter(b => billState(b) === 'unpaid'), paid = bills.filter(b => billState(b) === 'paid');
  const list = { verify, unpaid, paid }[tab].slice(0, 40);
  const isTab = !nav.canGoBack(); const { wide } = useBP();
  return (
    <Screen title="Billing" back={!isTab} big={isTab} tabbed={isTab} wide sub="Bills, payment proofs to verify, and receipts." right={<Btn label="New bill" icon="plus" small={!wide} onPress={() => nav.navigate('CreateBill')} />}>
      <View style={wide ? { flexDirection: 'row', alignItems: 'flex-end', gap: 20 } : { gap: 16 }}>
        <View style={wide ? { width: 400 } : undefined}><Tabs options={[['verify', 'To verify', verify.length], ['unpaid', 'Unpaid'], ['paid', 'Paid']]} value={tab} onChange={setTab} /></View>
        <Field icon="search" placeholder="Search pet or owner" value={q} onChangeText={setQ} style={wide ? { flex: 1, maxWidth: 420, marginLeft: 'auto' } : undefined} />
      </View>
      {wide ? <DataTable rows={list} keyOf={b => b.id} onRowPress={b => nav.navigate('BillDetail', { id: b.id })} rowLabel={b => `Bill for ${sel.pet(db, b.petId)!.name}`}
          empty={<Empty icon="receipt" title={tab === 'verify' ? 'No payments to check' : 'Nothing here'} sub={tab === 'verify' ? 'E-wallet and bank transfer proofs from owners appear here.' : undefined} />}
          columns={[
            { key: 'd', label: 'Date', width: 110, render: b => fmtD(b.date) },
            { key: 'p', label: 'Patient', flex: 2, render: b => { const p = sel.pet(db, b.petId)!; return <Cell left={<PetAvatar pet={p} size={34} />} title={p.name} sub={sel.owner(db, b.ownerId)!.name} />; } },
            { key: 'pay', label: 'Payment', flex: 2, wideOnly: true, render: b => { const pay = b.payments.find(x => x.status === 'pending'); return pay ? <Cell title={`${pay.method} · Ref ${pay.ref}`} sub={`Sent ${fmtD(pay.date)}`} /> : '—'; } },
            { key: 't', label: 'Total', width: 110, align: 'right', render: b => money(billTotal(b)) },
            { key: 's', label: 'Status', width: 130, render: b => { const st = billState(b); return <Pill text={BILL[st][0]} tone={BILL[st][1]} badge />; } },
          ]} />
      : list.length === 0 ? <Empty icon="receipt" title={tab === 'verify' ? 'No payments to check' : 'Nothing here'} sub={tab === 'verify' ? 'E-wallet and bank transfer proofs from owners appear here.' : undefined} /> : (
        <Group>
          {list.map(b => { const p = sel.pet(db, b.petId)!; const pay = b.payments.find(x => x.status === 'pending'); const st = billState(b); return (
            <Row key={b.id} left={<PetAvatar pet={p} size={40} />} title={`${p.name} · ${sel.owner(db, b.ownerId)!.name}`}
              sub={pay ? `${money(pay.amount)} · ${pay.method} · Ref ${pay.ref}` : `${money(billTotal(b))} · ${fmtD(b.date)}`}
              right={<Pill text={BILL[st][0]} tone={BILL[st][1]} badge />} onPress={() => nav.navigate('BillDetail', { id: b.id })} />
          ); })}
        </Group>
      )}
    </Screen>
  );
}

export function CreateBill() {
  const nav = useNav(); const { db, act } = useApp(); const p = useParams<{ petId: string; apptId: string }>();
  const [petId, setPetId] = useState(p.petId || ''); const [q, setQ] = useState('');
  const appt = p.apptId ? sel.appt(db, p.apptId) : undefined;
  const [items, setItems] = useState<Record<string, number>>(() => { const s = appt && db.services.find(x => x.name === appt.service); return s ? { [s.id]: 1 } : {}; });
  const [err, setErr] = useState('');
  const pet = petId ? sel.pet(db, petId) : undefined;
  const lines: BillItem[] = db.services.filter(s => items[s.id]).map(s => ({ name: s.name, price: s.price, qty: items[s.id] }));
  const total = lines.reduce((s, i) => s + i.price * i.qty, 0);
  const needBill = db.appts.filter(a => a.status === 'completed' && diff(a.date) > -7 && !db.bills.some(b => b.apptId === a.id));
  const matches = q.trim().length >= 2 ? db.pets.filter(x => x.name.toLowerCase().includes(q.toLowerCase()) || sel.owner(db, x.ownerId)!.name.toLowerCase().includes(q.toLowerCase())) : [];
  const step = (id: string, d: number) => { const n = Math.max(0, (items[id] || 0) + d); setItems({ ...items, [id]: n }); setErr(''); };
  const create = () => {
    if (!pet) return setErr('Choose the pet'); if (!lines.length) return setErr('Add at least one service');
    const b = act.createBill(pet.id, lines, appt?.id || null); nav.replace('BillDetail', { id: b.id });
  };
  return (
    <Screen title="New bill" footer={<View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 }}><View style={{ flex: 1 }}><T.Small>Total</T.Small><Text style={type.h2}>{money(total)}</Text></View><Btn label="Create bill" onPress={create} /></View>}>
      {pet ? (
        <Group><Row left={<PetAvatar pet={pet} size={42} />} title={pet.name} sub={`${sel.owner(db, pet.ownerId)!.name}${appt ? ` · ${appt.service}, ${fmtD(appt.date)}` : ''}`} right={!p.petId ? <Btn label="Change" small kind="line" onPress={() => setPetId('')} /> : undefined} /></Group>
      ) : <>
        <Field icon="search" placeholder="Search pet or owner" value={q} onChangeText={setQ} />
        {matches.length > 0 && <Group>{matches.slice(0, 6).map(x => <Row key={x.id} left={<PetAvatar pet={x} size={40} />} title={x.name} sub={sel.owner(db, x.ownerId)!.name} onPress={() => setPetId(x.id)} />)}</Group>}
        {!q && needBill.length > 0 && <Section title="Completed visits without a bill">
          <Group>{needBill.map(a => { const x = sel.pet(db, a.petId)!; return <Row key={a.id} left={<PetAvatar pet={x} size={40} />} title={`${x.name} · ${a.service}`} sub={`${sel.owner(db, a.ownerId)!.name} · ${fmtD(a.date)}`} onPress={() => nav.replace('CreateBill', { petId: x.id, apptId: a.id })} />; })}</Group>
        </Section>}
      </>}
      <Section title="Services given">
        <Group>
          {db.services.filter(s => s.active).map(s => (
            <Row key={s.id} title={s.name} sub={money(s.price)} right={
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                {!!items[s.id] && <IconBtn name="x" size={16} label={`Remove ${s.name}`} onPress={() => step(s.id, -1)} />}
                {!!items[s.id] && <Text style={[type.h3, { minWidth: 16, textAlign: 'center' }]}>{items[s.id]}</Text>}
                <IconBtn name="plus" size={16} label={`Add ${s.name}`} onPress={() => step(s.id, 1)} />
              </View>} />
          ))}
        </Group>
      </Section>
      {!!err && <T.Small color={colors.bad}>{err}</T.Small>}
      <T.Small>Prices come from the clinic's services list. The owner is notified when the bill is created.</T.Small>
    </Screen>
  );
}

const bl = StyleSheet.create({
  item: { flexDirection: 'row', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.line, gap: 12 },
  proof: { width: '100%', height: 140, borderRadius: radius.lg, backgroundColor: colors.subtle, alignItems: 'center', justifyContent: 'center', gap: 6 },
  chip: { paddingHorizontal: 12, height: 34, justifyContent: 'center', borderRadius: 17, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface },
  qrBox: { padding: 10, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, backgroundColor: '#fff' },
  amount: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, padding: 20, ...shadow },
  amountIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: colors.tileOrange, alignItems: 'center', justifyContent: 'center' },
  payCard: { alignItems: 'center', gap: 10, padding: 16, backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, ...shadow },
  bankIcon: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.tileOrange, alignItems: 'center', justifyContent: 'center' },
  copy: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, height: 34, borderRadius: radius.md, backgroundColor: colors.tileOrange },
  steps: { gap: 12, padding: 16, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  method: { flex: 1, height: 80, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, padding: 8, gap: 6, alignItems: 'center', justifyContent: 'center', ...shadow },
  methodCheck: { position: 'absolute', top: 6, right: 6, width: 16, height: 16, borderRadius: 8, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  methodOn: { backgroundColor: colors.accentDeep, borderColor: colors.accentDeep },
  step: { width: 22, height: 22, borderRadius: 11, backgroundColor: colors.warmOrange, alignItems: 'center', justifyContent: 'center', marginTop: -1 },
  drop: { borderWidth: 1, borderStyle: 'dashed', borderColor: colors.lineStrong, borderRadius: radius.lg, padding: 18, alignItems: 'center', gap: 4, backgroundColor: colors.surface },
  dash: { borderBottomWidth: 1, borderStyle: 'dashed', borderColor: colors.line },
});
