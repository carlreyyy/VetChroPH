// Bills and payments.
// Online: GCash, Maya, card and QR Ph through the payment gateway (see services/paymentService.ts). The gateway reports the result,
// so an online payment is never confirmed by staff. Manual: cash, and bank or e-wallet transfers where the owner uploads proof and
// the clinic checks its own account. Consultation D14: bills are paid in full (no partial payments).
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { FileThumb, FileViewer, UploadBox } from '../components/files';
import { Banner, Btn, Card, Chips, Empty, Field, Group, IconBtn, KV, Pill, Row, Screen, Section, T, Tabs } from '../components/ui';
import { Sheet, useConfirm } from '../components/overlays';
import { BrandTile } from '../components/Brand';
import { Cell, DataTable, useBP } from '../components/responsive';
import { Icon, type IconName } from '../components/Icon';
import { ClinicQr, PetAvatar, QrArt } from '../components/PetArt';
import { useApp, sel, gatewayOf } from '../store/AppStore';
import { useNav, useParams } from '../navigation/nav';
import { colors, radius, shadow, type, FONT, DISPLAY } from '../theme';
import type { BillItem, FileRef, OnlineMethod, PayAccount, Payment } from '../types';
import { ONLINE_METHODS, METHOD_LABEL, METHOD_SUB, isOnline, paymentService, type Checkout } from '../services/paymentService';
import { BILL, allPayments, billBalance, billPaid, billState, billTotal, diff, fmtD, fmtDT, fmtDY, isOnlinePay, isOwing, money, pad, payStatus } from '../utils/format';

const METHOD_ICON: Record<string, IconName> = { GCash: 'phoneapp', Maya: 'phoneapp', Card: 'card', 'QR Ph': 'qr', Cash: 'banknote', 'Bank transfer': 'bank', 'Other e-wallet': 'qr' };
const when = (p: Payment) => p.createdAt ? fmtDT(p.createdAt) : fmtD(p.date);

/** Time left on a checkout, as mm:ss. */
function useCountdown(until?: number) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  if (!until) return { text: '', over: false };
  const s = Math.max(0, Math.floor((until - now) / 1000));
  return { text: `${pad(Math.floor(s / 60))}:${pad(s % 60)}`, over: s === 0 };
}

export function BillDetail() {
  const nav = useNav(); const confirm = useConfirm(); const { db, user, act } = useApp();
  const [proofView, setProofView] = useState<FileRef | null>(null);
  const { id } = useParams<{ id: string }>(); const b = sel.bill(db, id!)!;
  const pet = sel.pet(db, b.petId)!; const owner = sel.owner(db, b.ownerId)!;
  const clinic = user!.role !== 'owner'; const isAdmin = user!.role === 'admin'; const st = billState(b); const bal = billBalance(b);
  const pending = b.payments.find(p => p.status === 'pending');
  const last = b.payments[b.payments.length - 1];
  const online = b.payments.filter(isOnlinePay);
  const [rejOpen, setRejOpen] = useState(false); const [why, setWhy] = useState(''); const [whyErr, setWhyErr] = useState('');
  const [refunding, setRefunding] = useState('');

  let footer: React.ReactNode;
  if (!clinic && isOwing(st)) footer = <Btn label={st === 'failed' || st === 'expired' ? `Try again · ${money(bal)}` : `Pay ${money(bal)}`} icon="wallet" style={{ flex: 1 }} onPress={() => nav.navigate('PayBill', { id: b.id })} />;
  else if (clinic && pending) footer = <><Btn label="Reject" kind="danger" style={{ flex: 1 }} onPress={() => setRejOpen(true)} /><Btn label="Confirm payment" style={{ flex: 1.5 }} onPress={() => confirm({ title: `Confirm ${money(pending.amount)}?`, body: `Only confirm if reference ${pending.ref} is in the clinic's ${pending.method} account.`, ok: 'Confirm', tone: 'ok', icon: 'check', onOk: () => act.verifyPayment(b.id, pending.id, true) })} /></>;
  else if (clinic && isOwing(st)) footer = <Btn label={`Record ${money(bal)} cash`} icon="banknote" style={{ flex: 1 }} onPress={() => confirm({ title: `Record ${money(bal)} cash?`, body: 'Bills are paid in full. A receipt is issued and the owner is notified.', ok: 'Record payment', tone: 'ok', icon: 'banknote', onOk: () => act.recordCash(b.id) })} />;
  else if (billPaid(b) > 0) footer = <Btn label="View receipt" icon="receipt" kind="line" style={{ flex: 1 }} onPress={() => nav.navigate('Receipt', { id: b.id })} />;

  const refund = (p: Payment) => confirm({
    title: `Refund ${money(p.amount)}?`,
    body: p.provider === 'paymongo' ? `The amount goes back to the owner's ${p.method} through the payment gateway. This cannot be undone.` : 'Record that this payment was returned to the owner. This cannot be undone.',
    ok: 'Refund', tone: 'bad', icon: 'banknote',
    onOk: async () => { setRefunding(p.id); await act.refundPayment(b.id, p.id); setRefunding(''); },
  });

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
          <Text style={{ fontFamily: FONT, fontSize: 14, fontWeight: '700', color: st === 'paid' ? colors.ok : st === 'refunded' ? colors.ink2 : bal > 0 ? colors.bad : colors.ok }}>
            {st === 'paid' ? 'Paid in full' : st === 'refunded' ? 'Refunded' : `Due: ${money(bal)}`}
          </Text>
        </View>
      </View>
      {st === 'processing' && <Banner tone="warn" icon="clock" title="Payment is processing" sub="This usually takes a few seconds. The bill updates by itself once the payment is confirmed." />}
      {(st === 'failed' || st === 'expired') && last && <Banner tone="bad" icon="alert" title={st === 'failed' ? 'The last payment failed' : 'The last payment expired'} sub={clinic ? `${last.method} payment ${last.ref}: ${last.reason}.` : `${last.reason}. You were not charged. You can try again.`} />}
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
          {[...b.payments].reverse().map(p => { const [label, tone] = payStatus(p); return (
            <Row key={p.id} icon={METHOD_ICON[p.method] || 'qr'} left={p.proofFile ? <FileThumb file={p.proofFile} size={40} /> : undefined} title={`${money(p.amount)} · ${p.method}`}
              sub={[when(p), p.ref && `Ref ${p.ref}`, p.proof && `Proof: ${p.proof}`, p.verifiedBy && `Checked by ${p.verifiedBy}`, p.reason && (p.status === 'rejected' ? `Reason: ${p.reason}` : p.reason)].filter(Boolean).join(' · ')} subLines={3}
              onPress={p.proofFile ? () => setProofView(p.proofFile!) : undefined}
              right={<Pill text={label} tone={tone} />} />
          ); })}
        </Group>
      </Section>}
      {clinic && online.length > 0 && <Section title="Gateway details" sub="Recorded from the payment gateway">
        {[...online].reverse().map(p => (
          <Card key={p.id}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingBottom: 6 }}>
              <Text style={[type.h3, { flex: 1 }]}>{p.ref}</Text><Pill text={payStatus(p)[0]} tone={payStatus(p)[1]} />
            </View>
            <KV rows={[
              ['Method', p.method], ['Gateway reference', p.providerRef],
              ['Amount', money(p.amount)], ['Gateway fee', p.fee != null ? money(p.fee) : undefined], ['Net amount', p.net != null ? money(p.net) : undefined],
              ['Started', p.createdAt ? fmtDT(p.createdAt) : undefined],
              p.paidAt ? [p.status === 'confirmed' || p.status === 'refunded' ? 'Webhook received' : 'Result received', fmtDT(p.paidAt)] : null,
              p.reason ? ['Reason', p.reason] : null,
              p.refundedAt ? ['Refunded', `${fmtDT(p.refundedAt)}${p.refundedBy ? ` by ${p.refundedBy}` : ''}`] : null,
            ]} />
            {isAdmin && p.status === 'confirmed' && <Btn label="Refund payment" icon="banknote" kind="danger" small loading={refunding === p.id} onPress={() => refund(p)} style={{ marginTop: 10, alignSelf: 'flex-start' }} />}
          </Card>
        ))}
      </Section>}
      {isAdmin && b.payments.some(p => p.status === 'confirmed' && !isOnlinePay(p)) && <Section title="Refund">
        {b.payments.filter(p => p.status === 'confirmed' && !isOnlinePay(p)).map(p => (
          <Row key={p.id} icon="banknote" title={`${money(p.amount)} · ${p.method}`} sub="Record a refund to the owner" right={<Btn label="Refund" kind="danger" small loading={refunding === p.id} onPress={() => refund(p)} />} />
        ))}
      </Section>}
      {clinic && pending && <Section title="Proof of payment" sub="Tap the screenshot to view it full size">
        <Pressable onPress={() => pending.proofFile && setProofView(pending.proofFile)} accessibilityRole="button" accessibilityLabel="View payment screenshot" style={bl.proofCard}>
          {pending.proofFile ? <FileThumb file={pending.proofFile} size={92} /> : <View style={bl.proof}><Icon name="image" size={30} color={colors.warmOrange} /></View>}
          <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
            <Text style={type.h3} numberOfLines={1}>{pending.proof || 'Screenshot'}</Text>
            <T.Small>Ref {pending.ref} · {money(pending.amount)}</T.Small>
            <T.Small>Uploaded by {pending.by} on {fmtD(pending.date)}</T.Small>
          </View>
          <Icon name="chevR" size={18} color={colors.ink3} />
        </Pressable>
      </Section>}
      <FileViewer file={proofView} meta="Proof of payment" onClose={() => setProofView(null)} />
      {!clinic && isOwing(st) && <T.Small>You can also pay in cash at the clinic. Bills are paid in full.</T.Small>}
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

/* ───────────── Pay a bill: choose a method ───────────── */
type Pick = OnlineMethod | 'manual';
export function PayBill() {
  const nav = useNav(); const { db, act, toast } = useApp(); const { id } = useParams<{ id: string }>();
  const b = sel.bill(db, id!)!; const bal = billBalance(b); const st = billState(b);
  const gw = gatewayOf(db);
  const accounts = db.clinic.accounts.filter(x => x.on);
  const tiles: [Pick, string, IconName][] = [
    ...ONLINE_METHODS.filter(m => gw.methods[m]).map(m => [m, m, METHOD_ICON[m]] as [Pick, string, IconName]),
    ...(accounts.length ? [['manual', 'Bank (manual)', 'bank'] as [Pick, string, IconName]] : []),
  ];
  const [pick, setPick] = useState<Pick>(tiles[0]?.[0] || 'manual');
  const [accId, setAccId] = useState(accounts[0]?.id || '');
  const acc = accounts.find(x => x.id === accId) as PayAccount | undefined;
  const [f, setF] = useState<{ ref: string; proof: FileRef | null }>({ ref: '', proof: null }); const [err, setErr] = useState<Record<string, string>>({});
  const bank = acc?.kind === 'Bank transfer';
  const manual = pick === 'manual';
  const retry = st === 'failed' || st === 'expired';
  const submit = () => {
    const e: Record<string, string> = {};
    if (f.ref.replace(/\W/g, '').length < 6) e.ref = 'Enter the reference number from your e-wallet or bank app';
    if (!f.proof) e.proof = 'Upload your payment screenshot';
    if (Object.keys(e).length) return setErr(e);
    act.submitProof(b.id, acc!.kind, f.ref.trim(), f.proof!); nav.goBack();
  };
  const footer = manual
    ? <Btn label="Submit payment proof" icon="upload" style={{ flex: 1 }} onPress={submit} />
    : <Btn label={`Pay ${money(bal)}`} icon="wallet" style={{ flex: 1 }} onPress={() => nav.navigate('PayCheckout', { id: b.id, method: pick })} />;

  if (bal <= 0 || st === 'processing' || st === 'pending') return (
    <Screen title="Pay bill">
      <Empty icon={st === 'paid' ? 'check' : 'clock'} title={st === 'paid' ? 'This bill is paid' : 'A payment is already in progress'} sub={st === 'paid' ? 'There is nothing left to pay.' : 'You can pay again if it does not go through.'} action={<Btn label="Back to bill" kind="line" onPress={() => nav.replace('BillDetail', { id: b.id })} />} />
    </Screen>
  );
  return (
    <Screen title="Pay bill" sub="Choose how you want to pay." footer={footer}>
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
      {retry && <Banner tone="bad" icon="alert" title={st === 'failed' ? 'Your last payment did not go through' : 'Your last payment expired'} sub={`${b.payments[b.payments.length - 1]?.reason || ''}. You were not charged. Choose a method to try again.`} />}
      <Section title="Payment method">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {tiles.map(([k, label, icon]) => { const on = k === pick; return (
            <Pressable key={k} onPress={() => { setPick(k); setF({ ...f, proof: null }); }} style={[bl.method, on && bl.methodOn]} accessibilityRole="radio" accessibilityLabel={label} accessibilityState={{ selected: on }}>
              {on && <View style={bl.methodCheck}><Icon name="check" size={10} color={colors.accentDeep} strokeWidth={3.2} /></View>}
              <Icon name={icon} size={24} color={on ? '#fff' : colors.accent} />
              <Text style={[type.h3, { fontSize: 13.5, textAlign: 'center' }, on && { color: '#fff' }]} numberOfLines={1}>{label}</Text>
            </Pressable>
          ); })}
        </View>
      </Section>

      {!manual && <>
        <Card style={{ gap: 10 }}>
          <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
            <View style={bl.bankIcon}><Icon name={METHOD_ICON[pick]} size={24} color={colors.warmOrange} /></View>
            <View style={{ flex: 1 }}><Text style={type.h3}>{METHOD_LABEL[pick]}</Text><T.Small>{METHOD_SUB[pick]}</T.Small></View>
          </View>
          <T.Small>You will go to a secure checkout page to finish the payment. Your payment is confirmed automatically and your receipt is ready right away.</T.Small>
        </Card>
        <Banner icon="shield" title="Secure payment" sub="Card and wallet details are entered only on the secure checkout page. The clinic never sees or stores them." />
      </>}

      {manual && acc && <>
        {accounts.length > 1 && <Chips options={accounts.map(x => [x.id, x.kind === 'Bank transfer' ? `${x.provider} transfer` : `${x.provider} QR`] as [string, string])} value={accId} onChange={v => { setAccId(v); setF({ ...f, proof: null }); }} />}
        <View style={bl.payCard}>
          {bank
            ? <View style={{ alignItems: 'center', gap: 4, paddingVertical: 8 }}><View style={bl.bankIcon}><Icon name="bank" size={24} color={colors.warmOrange} /></View><Text style={[type.small, { marginTop: 6 }]}>{acc.provider} account number</Text><Text style={{ fontFamily: FONT, fontSize: 22, fontWeight: '700', letterSpacing: 0.6, color: colors.ink }}>{acc.number}</Text></View>
            : <><View style={bl.qrBox}><ClinicQr acc={acc} size={168} /></View><Text style={[type.h3, { fontSize: 14, marginTop: 2 }]}>Scan to pay with {acc.provider}</Text></>}
          <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: colors.line, marginVertical: 4 }} />
          <View style={{ flexDirection: 'row', alignItems: 'center', alignSelf: 'stretch', gap: 10 }}>
            <View style={{ flex: 1 }}><Text style={type.h3}>{acc.accountName}</Text><T.Small>{acc.provider} · {acc.number} · Business account</T.Small></View>
          </View>
          <Pressable onPress={() => toast(`Copied ${acc.number}`)} accessibilityRole="button" accessibilityLabel="Copy account number" hitSlop={8} style={({ pressed }) => [{ flexDirection: 'row', alignItems: 'center', gap: 6 }, pressed && { opacity: 0.6 }]}>
            <Text style={{ fontFamily: FONT, color: colors.warmOrange, fontWeight: '600', fontSize: 14, textDecorationLine: 'underline' }}>Copy account number</Text><Icon name="copy" size={16} color={colors.warmOrange} />
          </Pressable>
        </View>
        <Section title="How to pay">
          <View style={bl.steps}>
            {[bank ? 'Open your bank app and transfer to the account above.' : `Open ${acc.provider} and scan the QR, or send to the number.`, `Send exactly ${money(bal)}, then take a screenshot.`, 'Enter the reference number and upload the screenshot below.'].map((t, i) => (
              <View key={i} style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}><View style={bl.step}><Text style={{ color: '#fff', fontWeight: '700', fontSize: 12 }}>{i + 1}</Text></View><Text style={[type.body, { flex: 1, fontSize: 14, lineHeight: 20 }]}>{t}</Text></View>
            ))}
          </View>
        </Section>
        <Section title="Proof of payment">
          <Field label="Reference number" placeholder="e.g. 5102 441 902" value={f.ref} onChangeText={v => { setF({ ...f, ref: v }); setErr({ ...err, ref: '' }); }} error={err.ref} />
          <UploadBox imagesOnly file={f.proof} error={err.proof} title="Upload payment screenshot" accent={colors.warmOrange}
            onPick={(file, e) => { setF(x => ({ ...x, proof: file })); setErr(x => ({ ...x, proof: e || '' })); }} />
        </Section>
        <Banner icon="info" title="The clinic confirms this payment" sub="The clinic checks its own account, then confirms your payment and issues a receipt." />
      </>}
    </Screen>
  );
}

/* ───────────── Hosted checkout page ───────────── */
export function PayCheckout() {
  const nav = useNav(); const { db, act } = useApp(); const { id, method } = useParams<{ id: string; method: string }>();
  const b = sel.bill(db, id!)!; const m = (isOnline(method || '') ? method : 'GCash') as OnlineMethod; const bal = billBalance(b);
  const [c, setC] = useState<Checkout | null>(null); const [busy, setBusy] = useState(false);
  const alive = useRef(true); const started = useRef(false);
  const left = useCountdown(c?.expiresAt);

  useEffect(() => {
    alive.current = true;
    paymentService.createCheckout({ billId: b.id, method: m, amount: bal, usedRefs: act.usedRefs() }).then(x => { if (alive.current) setC(x); });
    return () => { alive.current = false; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const approve = async () => {
    if (!c || started.current) return; started.current = true; setBusy(true);
    const y = await act.payOnline(c);
    if (!alive.current) return;
    if (y.status === 'confirmed') nav.replace('PaySuccess', { id: b.id, pid: y.id }); else nav.replace('PayCancelled', { id: b.id, pid: y.id });
  };
  // A QR Ph payment finishes when the owner scans it, so the page waits and then reports the result.
  useEffect(() => {
    if (m !== 'QR Ph' || !c) return; const t = setTimeout(approve, 6500); return () => clearTimeout(t);
  }, [c]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (left.over && c && !busy) nav.replace('PayCancelled', { id: b.id, reason: 'expired' }); }, [left.over]); // eslint-disable-line react-hooks/exhaustive-deps

  const cancel = () => { alive.current = false; nav.replace('PayCancelled', { id: b.id, reason: 'cancelled' }); };
  const waitingQr = m === 'QR Ph';
  const approveLabel = m === 'Card' ? `Pay ${money(bal)}` : `Approve in ${m}`;

  const footer = !c || busy ? undefined : waitingQr
    ? <Btn label="Cancel payment" kind="line" style={{ flex: 1 }} onPress={cancel} />
    : <><Btn label="Cancel" kind="line" style={{ flex: 1 }} onPress={cancel} /><Btn label={approveLabel} icon="shield" style={{ flex: 2 }} onPress={approve} /></>;

  return (
    <Screen title="Secure checkout" back={false} footer={footer}>
      <View style={bl.hero}>
        <Text style={{ fontFamily: FONT, fontSize: 12, fontWeight: '600', color: colors.ink2 }}>Pay {db.clinic.name}</Text>
        <Text style={{ fontFamily: DISPLAY, fontSize: 42, fontWeight: '600', color: colors.ink, letterSpacing: -1 }}>{money(bal)}</Text>
        <View style={{ flexDirection: 'row', gap: 14, flexWrap: 'wrap' }}>
          <T.Small>Ref {c?.ref || '…'}</T.Small>
          {!!c && <T.Small>Expires in {left.text}</T.Small>}
        </View>
      </View>

      {!c ? (
        <Card style={bl.center}><ActivityIndicator color={colors.accentDeep} /><Text style={type.h3}>Preparing your checkout</Text><T.Small>Please wait a moment.</T.Small></Card>
      ) : busy ? (
        <Card style={bl.center}>
          <ActivityIndicator size="large" color={colors.accentDeep} />
          <Text style={type.h2}>Processing your payment</Text>
          <T.Small>{m === 'Card' ? 'Verifying with your bank…' : `Waiting for ${m} to confirm…`}</T.Small>
          <T.Small>Please do not close or refresh this page.</T.Small>
        </Card>
      ) : waitingQr ? (
        <Card style={bl.center}>
          <View style={bl.qrBox}><QrArt size={188} seed={Number(c.ref.slice(-4)) + 11} /></View>
          <Text style={type.h3}>Scan with your bank or e-wallet app</Text>
          <T.Small>Any app that supports QR Ph works. This page updates when your payment is received.</T.Small>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}><ActivityIndicator size="small" color={colors.ink2} /><T.Small>Waiting for payment…</T.Small></View>
        </Card>
      ) : (
        <Card style={{ gap: 12 }}>
          <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
            <View style={bl.bankIcon}><Icon name={METHOD_ICON[m]} size={24} color={colors.warmOrange} /></View>
            <View style={{ flex: 1 }}><Text style={type.h3}>{METHOD_LABEL[m]}</Text><T.Small>{METHOD_SUB[m]}</T.Small></View>
          </View>
          <KV rows={[['Merchant', db.clinic.name], ['Amount', money(bal)], ['Reference', c.ref]]} />
          <T.Small>{m === 'Card' ? 'Your bank may ask you to verify this payment. Card details are never stored by the clinic.' : `You approve this payment inside your ${m} app. The clinic never sees your PIN or one-time code.`}</T.Small>
        </Card>
      )}
      {!!c && !busy && <Banner icon="shield" title="Secure payment" sub="Payments are processed by PayMongo. You will not be charged until you approve." />}
    </Screen>
  );
}

/** Return route /billing/:id/success. */
export function PaySuccess() {
  const nav = useNav(); const { db } = useApp(); const { id, pid } = useParams<{ id: string; pid: string }>();
  const b = sel.bill(db, id!)!; const pet = sel.pet(db, b.petId)!;
  const y = b.payments.find(p => p.id === pid) || [...b.payments].reverse().find(p => p.status === 'confirmed' || p.status === 'processing' || p.status === 'failed' || p.status === 'expired');
  // If the page is opened while the payment is still processing, wait for it. A failed result moves to the failure page.
  useEffect(() => { if (y && (y.status === 'failed' || y.status === 'expired')) nav.replace('PayCancelled', { id: b.id, pid: y.id }); }, [y?.status]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!y || y.status === 'processing' || y.status === 'failed' || y.status === 'expired') return (
    <Screen title="Payment" back={false}><Card style={bl.center}><ActivityIndicator size="large" color={colors.accentDeep} /><Text style={type.h2}>Processing your payment</Text><T.Small>This usually takes a few seconds.</T.Small></Card></Screen>
  );
  return (
    <Screen title="Payment" back={false} footer={<><Btn label="View receipt" icon="receipt" kind="line" style={{ flex: 1 }} onPress={() => nav.replace('Receipt', { id: b.id })} /><Btn label="Done" style={{ flex: 1 }} onPress={() => nav.replace('BillDetail', { id: b.id })} /></>}>
      <View style={{ alignItems: 'center', gap: 8, paddingVertical: 12 }} accessibilityLiveRegion="polite">
        <View style={[bl.resultIcon, { backgroundColor: colors.okBg }]}><Icon name="check" size={34} color={colors.ok} strokeWidth={2.6} /></View>
        <Text style={[type.h1, { textAlign: 'center' }]}>Payment received</Text>
        <Pill text="Paid" tone="ok" badge />
        <Text style={{ fontFamily: DISPLAY, fontSize: 40, fontWeight: '600', color: colors.ink, letterSpacing: -1 }}>{money(y.amount)}</Text>
      </View>
      <Card><KV rows={[['Reference', y.ref], ['Method', y.method], ['Paid on', y.paidAt ? fmtDT(y.paidAt) : fmtD(y.date)], ['Bill', `${pet.name} · ${fmtD(b.date)}`], ['Paid to', db.clinic.name]]} /></Card>
      <T.Small>A receipt was added to your bill. You will also get a notification.</T.Small>
    </Screen>
  );
}

/** Return route /billing/:id/cancelled. Covers cancelled, failed and expired payments. */
export function PayCancelled() {
  const nav = useNav(); const { db } = useApp(); const { id, pid, reason } = useParams<{ id: string; pid: string; reason: string }>();
  const b = sel.bill(db, id!)!; const y = b.payments.find(p => p.id === pid);
  const kind = y?.status === 'failed' ? 'failed' : y?.status === 'expired' || reason === 'expired' ? 'expired' : 'cancelled';
  const title = { failed: 'Payment failed', expired: 'Payment expired', cancelled: 'Payment cancelled' }[kind];
  const why = y?.reason || { failed: 'The payment did not go through.', expired: 'The checkout was open too long.', cancelled: 'You cancelled the payment.' }[kind];
  const paid = billState(b) === 'paid';
  return (
    <Screen title="Payment" back={false} footer={paid ? <Btn label="Back to bill" style={{ flex: 1 }} onPress={() => nav.replace('BillDetail', { id: b.id })} /> : <><Btn label="Back to bill" kind="line" style={{ flex: 1 }} onPress={() => nav.replace('BillDetail', { id: b.id })} /><Btn label="Try again" icon="repeat" style={{ flex: 1 }} onPress={() => nav.replace('PayBill', { id: b.id })} /></>}>
      <View style={{ alignItems: 'center', gap: 8, paddingVertical: 12 }} accessibilityLiveRegion="polite">
        <View style={[bl.resultIcon, { backgroundColor: kind === 'cancelled' ? colors.subtle : kind === 'expired' ? colors.warnBg : colors.badBg }]}>
          <Icon name={kind === 'cancelled' ? 'x' : 'alert'} size={32} color={kind === 'cancelled' ? colors.ink2 : kind === 'expired' ? colors.warn : colors.bad} strokeWidth={2.4} />
        </View>
        <Text style={[type.h1, { textAlign: 'center' }]}>{title}</Text>
        <Text style={[type.body, { textAlign: 'center', color: colors.ink2 }]}>{why}</Text>
        <Text style={[type.body, { textAlign: 'center', fontWeight: '600' }]}>You were not charged.</Text>
      </View>
      {y && <Card><KV rows={[['Amount', money(y.amount)], ['Method', y.method], ['Reference', y.ref], ['Status', payStatus(y)[0]]]} /></Card>}
      <T.Small>Your bill is still open. You can try again with the same or a different method, or pay in cash at the clinic.</T.Small>
    </Screen>
  );
}

export function Receipt() {
  const { db, user, toast } = useApp(); const { id } = useParams<{ id: string }>();
  const b = sel.bill(db, id!)!; const pet = sel.pet(db, b.petId)!; const owner = sel.owner(db, b.ownerId)!;
  const paid = b.payments.filter(p => p.status === 'confirmed');
  const refunded = b.payments.filter(p => p.status === 'refunded');
  const last = paid[paid.length - 1] || refunded[refunded.length - 1];
  return (
    <Screen title="Receipt" footer={<Btn label={`Email a copy to ${user!.role === 'owner' ? 'me' : 'the owner'}`} icon="mail" kind="line" style={{ flex: 1 }} onPress={() => toast(`Receipt sent to ${owner.email}`)} />}>
      <Card style={{ gap: 14 }}>
        <View style={{ alignItems: 'center', gap: 4 }}>
          <BrandTile size={48} />
          <T.H2>{db.clinic.name}</T.H2>
          <T.Small>{db.clinic.address}</T.Small>
        </View>
        <View style={bl.dash} />
        <KV rows={[['Receipt no.', `OR-${b.id.toUpperCase()}`], ['Date', last?.paidAt ? fmtDT(last.paidAt) : fmtDY(last?.date || b.date)], ['Owner', owner.name], ['Pet', `${pet.name} (${pet.breed})`]]} />
        <View style={bl.dash} />
        {b.items.map((i, k) => <View key={k} style={{ flexDirection: 'row' }}><Text style={[type.body, { flex: 1 }]}>{i.name}{i.qty > 1 ? ` × ${i.qty}` : ''}</Text><Text style={type.body}>{money(i.price * i.qty)}</Text></View>)}
        <View style={{ flexDirection: 'row' }}><Text style={[type.h3, { flex: 1 }]}>Total</Text><Text style={type.h3}>{money(billTotal(b))}</Text></View>
        <View style={bl.dash} />
        {paid.map(p => <View key={p.id} style={{ flexDirection: 'row', gap: 8 }}><Text style={[type.small, { flex: 1 }]}>{p.method}{p.ref ? ` · ${p.ref}` : ''}{isOnlinePay(p) ? ' · paid online' : p.verifiedBy ? ` · checked by ${p.verifiedBy}` : ''}</Text><Text style={type.body}>{money(p.amount)}</Text></View>)}
        {refunded.map(p => <View key={p.id} style={{ flexDirection: 'row', gap: 8 }}><Text style={[type.small, { flex: 1 }]}>Refunded · {p.method}{p.ref ? ` · ${p.ref}` : ''}</Text><Text style={type.body}>−{money(p.amount)}</Text></View>)}
        <View style={{ flexDirection: 'row' }}><Text style={[type.h3, { flex: 1 }]}>Balance</Text><Text style={type.h3}>{money(billBalance(b))}</Text></View>
      </Card>
    </Screen>
  );
}

/* ───────────── Staff and administrator billing list ───────────── */
type Tab = 'verify' | 'unpaid' | 'paid' | 'history';
export function Billing() {
  const nav = useNav(); const { db } = useApp();
  const [tab, setTab] = useState<Tab>('verify'); const [q, setQ] = useState('');
  const match = (b: typeof db.bills[0], extra = '') => { if (!q.trim()) return true; const s = q.toLowerCase(); return sel.pet(db, b.petId)!.name.toLowerCase().includes(s) || sel.owner(db, b.ownerId)!.name.toLowerCase().includes(s) || extra.toLowerCase().includes(s); };
  const bills = db.bills.filter(b => match(b, b.payments.map(p => p.ref).join(' '))).sort((a, b) => b.date.localeCompare(a.date));
  // To verify holds manual proofs only. Online payments are settled by the gateway.
  const verify = bills.filter(b => billState(b) === 'pending');
  const unpaid = bills.filter(b => { const s = billState(b); return isOwing(s) || s === 'processing'; });
  const paid = bills.filter(b => { const s = billState(b); return s === 'paid' || s === 'refunded'; });
  const history = allPayments(db.bills).filter(({ b }) => bills.includes(b)).slice(0, 60);
  const list = ({ verify, unpaid, paid, history: [] as typeof bills })[tab].slice(0, 40);
  const isTab = !nav.canGoBack(); const { wide } = useBP();
  const emptyVerify = <Empty icon="receipt" title="No payments to check" sub="Bank and e-wallet transfer proofs from owners appear here. Online payments are confirmed automatically." />;
  const lastPay = (b: typeof db.bills[0]) => b.payments[b.payments.length - 1];
  const petOf = (b: typeof db.bills[0]) => sel.pet(db, b.petId)!;
  const ownerOf = (b: typeof db.bills[0]) => sel.owner(db, b.ownerId)!.name;
  return (
    <Screen title="Billing" back={!isTab} big={isTab} tabbed={isTab} wide sub="Bills, manual payments to verify, online payments and receipts." right={<Btn label="New bill" icon="plus" small={!wide} onPress={() => nav.navigate('CreateBill')} />}>
      <View style={wide ? { flexDirection: 'row', alignItems: 'flex-end', gap: 20 } : { gap: 16 }}>
        <View style={wide ? { width: 480 } : undefined}><Tabs options={[['verify', 'To verify', verify.length], ['unpaid', 'Unpaid'], ['paid', 'Paid'], ['history', 'History']]} value={tab} onChange={setTab} /></View>
        <Field icon="search" placeholder="Search pet, owner or reference" value={q} onChangeText={setQ} style={wide ? { flex: 1, maxWidth: 420, marginLeft: 'auto' } : undefined} />
      </View>
      {tab === 'history' ? (
        wide ? <DataTable rows={history} keyOf={x => x.p.id} onRowPress={x => nav.navigate('BillDetail', { id: x.b.id })} rowLabel={x => `Payment ${x.p.ref || x.p.method} for ${petOf(x.b).name}`}
            empty={<Empty icon="history" title="No payments yet" />}
            columns={[
              { key: 'd', label: 'Date', width: 150, render: x => when(x.p) },
              { key: 'r', label: 'Reference', flex: 1.6, render: x => x.p.ref || '—' },
              { key: 'p', label: 'Patient', flex: 2, render: x => <Cell left={<PetAvatar pet={petOf(x.b)} size={32} />} title={petOf(x.b).name} sub={ownerOf(x.b)} /> },
              { key: 'm', label: 'Method', width: 120, render: x => x.p.method },
              { key: 'a', label: 'Amount', width: 100, align: 'right', render: x => money(x.p.amount) },
              { key: 'n', label: 'Net', width: 100, align: 'right', wideOnly: true, render: x => x.p.net != null ? money(x.p.net) : '—' },
              { key: 's', label: 'Status', width: 140, render: x => <Pill text={payStatus(x.p)[0]} tone={payStatus(x.p)[1]} badge /> },
            ]} />
        : history.length === 0 ? <Empty icon="history" title="No payments yet" /> : (
          <Group>{history.map(({ b, p }) => (
            <Row key={p.id} icon={METHOD_ICON[p.method] || 'qr'} title={`${money(p.amount)} · ${p.method}`} sub={`${petOf(b).name} · ${ownerOf(b)} · ${when(p)}${p.ref ? ` · ${p.ref}` : ''}`} subLines={2}
              right={<Pill text={payStatus(p)[0]} tone={payStatus(p)[1]} />} onPress={() => nav.navigate('BillDetail', { id: b.id })} />
          ))}</Group>
        )
      ) : wide ? <DataTable rows={list} keyOf={b => b.id} onRowPress={b => nav.navigate('BillDetail', { id: b.id })} rowLabel={b => `Bill for ${petOf(b).name}`}
          empty={tab === 'verify' ? emptyVerify : <Empty icon="receipt" title="Nothing here" />}
          columns={[
            { key: 'd', label: 'Date', width: 110, render: b => fmtD(b.date) },
            { key: 'p', label: 'Patient', flex: 2, render: b => <Cell left={<PetAvatar pet={petOf(b)} size={34} />} title={petOf(b).name} sub={ownerOf(b)} /> },
            { key: 'pay', label: 'Payment', flex: 2, wideOnly: true, render: b => { const pay = tab === 'verify' ? b.payments.find(x => x.status === 'pending') : lastPay(b); return pay ? <Cell title={`${pay.method}${pay.ref ? ` · ${pay.ref}` : ''}`} sub={when(pay)} /> : '—'; } },
            { key: 't', label: 'Total', width: 110, align: 'right', render: b => money(billTotal(b)) },
            { key: 's', label: 'Status', width: 140, render: b => { const st = billState(b); return <Pill text={BILL[st][0]} tone={BILL[st][1]} badge />; } },
          ]} />
      : list.length === 0 ? (tab === 'verify' ? emptyVerify : <Empty icon="receipt" title="Nothing here" />) : (
        <Group>
          {list.map(b => { const p = petOf(b); const pay = tab === 'verify' ? b.payments.find(x => x.status === 'pending') : lastPay(b); const st = billState(b); return (
            <Row key={b.id} left={<PetAvatar pet={p} size={40} />} title={`${p.name} · ${ownerOf(b)}`}
              sub={pay ? `${money(pay.amount)} · ${pay.method}${pay.ref ? ` · ${pay.ref}` : ''}` : `${money(billTotal(b))} · ${fmtD(b.date)}`}
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
  proofCard: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 12, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface },
  proof: { width: '100%', height: 140, borderRadius: radius.lg, backgroundColor: colors.subtle, alignItems: 'center', justifyContent: 'center', gap: 6 },
  chip: { paddingHorizontal: 12, height: 34, justifyContent: 'center', borderRadius: 17, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface },
  qrBox: { padding: 10, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, backgroundColor: '#fff' },
  hero: { gap: 4, padding: 18, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface },
  center: { alignItems: 'center', gap: 10, paddingVertical: 28 },
  resultIcon: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  payCard: { alignItems: 'center', gap: 10, padding: 16, backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, ...shadow },
  bankIcon: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.tileOrange, alignItems: 'center', justifyContent: 'center' },
  steps: { gap: 12, padding: 16, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  method: { flexGrow: 1, flexBasis: '30%', minWidth: 96, height: 80, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, padding: 8, gap: 6, alignItems: 'center', justifyContent: 'center', ...shadow },
  methodCheck: { position: 'absolute', top: 6, right: 6, width: 16, height: 16, borderRadius: 8, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  methodOn: { backgroundColor: colors.accentDeep, borderColor: colors.accentDeep },
  step: { width: 22, height: 22, borderRadius: 11, backgroundColor: colors.warmOrange, alignItems: 'center', justifyContent: 'center', marginTop: -1 },
  dash: { borderBottomWidth: 1, borderStyle: 'dashed', borderColor: colors.line },
});
