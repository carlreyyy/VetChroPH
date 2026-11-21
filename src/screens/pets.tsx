// Pet profile with Info / History / Follow-ups / Files tabs, add-edit pet, visit record and consultation form.
// What each role may do follows the final consultation:
//   owner  - reads records (read-only), uploads documents, books visits
//   staff  - edits pet details, enters the reason for visit only (no weight), sets due dates, uploads documents
//   admin  - the vet owner/manager: full consultation records (edits logged), progress notes, follow-ups and due dates
// Vaccines and deworming are not a separate module: their next due dates are follow-ups that drive reminders.
import React, { useState } from 'react';
import { Image, Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Icon, IconName } from '../components/Icon';
import { PET_COVERS } from '../data/photos';
import { Cols, useBP } from '../components/responsive';
import { pickFile, fileSize } from '../utils/files';
import { SexMark } from './owner';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Banner, Btn, Card, Chips, Empty, Field, Group, Hint, IconBtn, Pill, Row, Screen, Section, Seg, T, Tabs, useWide } from '../components/ui';
import { Sheet, useConfirm } from '../components/overlays';
import { PetArt, PetAvatar, coatsFor } from '../components/PetArt';
import { useApp, sel } from '../store/AppStore';
import { useNav, useParams } from '../navigation/nav';
import { colors, radius, shadow, type, FONT } from '../theme';
import type { FollowKind, Pet, Species } from '../types';
import { D, FOLLOW_ICON, ago, ageOf, cap, diff, fmtD, fmtDS, fmtDY, followStatus, parseD } from '../utils/format';

type PetTab = 'info' | 'history' | 'follow' | 'docs';
const DUE_PICKS: [string, string][] = [['7', '1 week'], ['14', '2 weeks'], ['30', '1 month'], ['90', '3 months'], ['180', '6 months'], ['365', '1 year']];

export function PetDetail() {
  const nav = useNav(); const { db, user, act } = useApp(); const confirm = useConfirm(); const insets = useSafeAreaInsets(); const wide = useWide(); const { width } = useWindowDimensions(); const bp = useBP();
  const p = useParams<{ id: string; tab: PetTab }>();
  const pet = sel.pet(db, p.id!)!; const owner = sel.owner(db, pet.ownerId)!;
  const role = user!.role; const clinic = role !== 'owner';
  const [tab, setTab] = useState<PetTab>(p.tab || 'info');
  const [sheet, setSheet] = useState<'' | 'note' | 'follow' | 'doc' | 'status'>('');
  const visits = db.visits.filter(v => v.petId === pet.id).sort((a, b) => b.date.localeCompare(a.date));
  const notes = db.notes.filter(n => n.petId === pet.id).sort((a, b) => b.date.localeCompare(a.date));
  const follows = db.followups.filter(f => f.petId === pet.id);
  const openF = follows.filter(f => f.status === 'open').sort((a, b) => a.date.localeCompare(b.date));
  const doneF = follows.filter(f => f.status === 'done').sort((a, b) => b.date.localeCompare(a.date));
  const docs = db.docs.filter(d => d.petId === pet.id);

  const footer = pet.status === 'active' ? (
    role === 'owner' ? <Btn label="Book a visit" icon="calendar" style={{ flex: 1 }} onPress={() => nav.navigate('Book', { petId: pet.id })} />
    : role === 'admin' ? <><Btn label="Book" kind="line" style={{ flex: 1 }} onPress={() => nav.navigate('Book', { petId: pet.id, staff: '1' })} /><Btn label="New consultation" style={{ flex: 1.5 }} onPress={() => nav.navigate('ConsultForm', { petId: pet.id })} /></>
    : <><Btn label="Reason for visit" kind="line" style={{ flex: 1.3 }} onPress={() => nav.navigate('ConsultForm', { petId: pet.id })} /><Btn label="Book" style={{ flex: 1 }} onPress={() => nav.navigate('Book', { petId: pet.id, staff: '1' })} /></>
  ) : null;
  const src = PET_COVERS[pet.id];
  const canEdit = role === 'owner' ? pet.ownerId === user!.ownerId : true;
  const INFO_FACTS: [IconName, string, string][] = [
    ['paw', 'Species', cap(pet.species)],
    [pet.sex === 'Male' ? 'male' : 'female', 'Sex', pet.sex],
    ['scale', 'Weight', `${pet.weight} kg`],
    ['calendar', 'Birthday', fmtDY(pet.birth)],
    ['clock', 'Age', ageOf(pet.birth)],
    ['info', 'Breed', pet.breed],
  ];
  const infoBlock = <>
          <View style={bp.wide ? pd.infoFlat : pd.info}>
            {INFO_FACTS.map(([icon, label, value], idx) => (
              <View key={label} style={[pd.factRow, idx === 0 && { borderTopWidth: 0 }]}>
                <View style={pd.factIcon}>
                  <Icon name={icon} size={14} color={colors.accentDeep} strokeWidth={2.2} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: FONT, fontSize: 11.5, color: colors.ink3 }}>{label}</Text>
                  <Text style={{ fontFamily: FONT, fontSize: 14, fontWeight: '600', color: colors.ink }} numberOfLines={1}>{value}</Text>
                </View>
              </View>
            ))}
          </View>

          {openF[0] && <Section title="Next due">
            <Group><Row icon={FOLLOW_ICON[openF[0].kind]} title={openF[0].reason} sub={`${openF[0].kind} · ${fmtD(openF[0].date)}`} right={<Pill text={followStatus(openF[0]).label} tone={followStatus(openF[0]).tone} />} onPress={() => setTab('follow')} /></Group>
          </Section>}
          {clinic && <Section title="Owner">
            <Group><Row icon="user" title={owner.name} sub={owner.phone} onPress={() => nav.navigate('OwnerDetail', { id: owner.id })} /></Group>
          </Section>}
          {clinic && pet.status === 'active' && <Btn label="Mark as inactive or deceased" kind="line" onPress={() => setSheet('status')} />}
          {clinic && pet.status !== 'active' && <Btn label="Mark as active again" kind="line" onPress={() => act.setPetStatus(pet.id, 'active')} />}
</>;
  const historyBlock = <>
          {visits.length === 0 ? <Empty icon="clip" title="No visits yet" sub="Consultation records appear here after each visit." /> : (
            <Group>
              {visits.map(v => (
                <Pressable key={v.id} onPress={() => nav.navigate('VisitDetail', { id: v.id })} accessibilityRole="button" style={({ pressed }) => [pd.visit, pressed && { backgroundColor: colors.subtle }]}>
                  <View style={pd.dateBox}><Text style={pd.dateMon}>{fmtDS(v.date).split(' ')[0]}</Text><Text style={pd.dateDay}>{parseD(v.date).getDate()}</Text></View>
                  <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                    <Text style={type.h3} numberOfLines={1}>{v.diagnosis || 'Waiting for the veterinarian'}</Text>
                    <T.Small numberOfLines={1}>{v.complaint}</T.Small>
                    <Text style={[type.small, { fontSize: 12, color: colors.ink3 }]}>{parseD(v.date).getFullYear()} · {v.vet}{v.edits.length ? ' · Edited' : ''}</Text>
                  </View>
                  <Icon name="chevR" size={18} color={colors.ink3} />
                </Pressable>
              ))}
            </Group>
          )}
          <Section title="Progress notes" action={role === 'admin' && pet.status === 'active' ? 'Add note' : undefined} onAction={() => setSheet('note')}>
            {notes.length === 0 ? <T.Small>No progress notes yet.</T.Small> : (
              <Group>{notes.map(n => <Row key={n.id} icon="note" title={n.text} sub={`${fmtD(n.date)} · ${n.by}`} subLines={1} />)}</Group>
            )}
          </Section>
</>;
  const followBlock = <>
          <Hint icon="bell">{clinic ? 'Owners are reminded automatically before each due date, including vaccines and deworming.' : 'You get a reminder before each due date, including vaccines and deworming.'}</Hint>
          <Section title="Coming up" action={clinic && pet.status === 'active' ? 'Set date' : undefined} onAction={() => setSheet('follow')}>
            {openF.length === 0 ? <Empty icon="check" title="Nothing due" sub="Return visits and vaccine or deworming due dates appear here." /> : (
              <Group>{openF.map(f => { const st = followStatus(f); return (
                <Row key={f.id} icon={FOLLOW_ICON[f.kind]} title={f.reason} sub={`${f.kind} · ${fmtD(f.date)}${f.notes ? `\n${f.notes}` : ''}`} subLines={2}
                  right={clinic ? <Pressable accessibilityRole="button" accessibilityLabel={`Mark ${f.reason} done`} onPress={() => confirm({ title: 'Mark as done?', body: `${f.reason} for ${pet.name}. Set the next due date afterwards if needed.`, ok: 'Mark done', icon: 'check', tone: 'ok', onOk: () => act.setFollowUpDone(f.id) })}><Pill text={st.label} tone={st.tone} /></Pressable> : <Pill text={st.label} tone={st.tone} />} />
              ); })}</Group>
            )}
            {clinic && openF.length > 0 && <T.Small>Tap a status to mark it done.</T.Small>}
          </Section>
          {doneF.length > 0 && <Section title="Done">
            <Group>{doneF.map(f => <Row key={f.id} icon={FOLLOW_ICON[f.kind]} title={f.reason} sub={`${f.kind} · ${fmtD(f.date)} · set by ${f.setBy}`} right={<Pill text="Done" tone="ok" />} />)}</Group>
          </Section>}
</>;
  const docsBlock = <>
          {docs.length === 0 ? <Empty icon="file" title="No files yet" sub="Lab results, vaccination cards and photos (JPEG, PNG or PDF). Owners and the clinic can both upload and view." /> : (
            <Group>{docs.map(d => (
              <Row key={d.id} icon={d.name.endsWith('.pdf') ? 'file' : 'image'} title={d.name} sub={`${d.kind} · ${d.size} · ${fmtD(d.date)} · ${d.by}`} subLines={2}
                right={(clinic || d.by === user!.name) ? <IconBtn name="trash" size={17} label="Remove file" onPress={() => confirm({ title: 'Remove this file?', body: d.name, ok: 'Remove', tone: 'bad', icon: 'trash', onOk: () => act.removeDoc(d.id) })} /> : undefined} />
            ))}</Group>
          )}
          <Btn label="Upload a file" icon="upload" kind="soft" onPress={() => setSheet('doc')} />
</>;
  const sheets = <>
      <NoteSheet visible={sheet === 'note'} onClose={() => setSheet('')} pet={pet} />
      <FollowSheet visible={sheet === 'follow'} onClose={() => setSheet('')} pet={pet} />
      <DocSheet visible={sheet === 'doc'} onClose={() => setSheet('')} petId={pet.id} />
      <Sheet visible={sheet === 'status'} onClose={() => setSheet('')} title={`Change ${pet.name}'s status`}>
        <T.Body muted>The pet stays on file and its medical history is never deleted. It is hidden from booking and reminders.</T.Body>
        <Btn label="Mark as inactive" kind="line" onPress={() => { act.setPetStatus(pet.id, 'inactive'); setSheet(''); }} />
        <Btn label="Mark as deceased" kind="danger" onPress={() => { act.setPetStatus(pet.id, 'deceased'); setSheet(''); }} />
      </Sheet>
  </>;
  if (bp.wide) {
    const wTab = tab === 'info' ? 'history' : tab;
    return (
      <Screen title={pet.name} wide sub={clinic ? `${cap(pet.species)} · Owner: ${owner.name}` : `${cap(pet.species)} · ${pet.breed}`}
        right={canEdit ? <Btn label="Edit pet" icon="edit" kind="line" small onPress={() => nav.navigate('PetForm', { id: pet.id, ownerId: pet.ownerId })} /> : undefined}>
        <Cols ratio={[bp.desktop ? 360 : 300, 1]}>
          <View style={pd.side}>
            {src ? <Image source={src} style={pd.sideImg} resizeMode="cover" accessibilityLabel={`Photo of ${pet.name}`} /> : <View style={[pd.sideImg, { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.subtle }]}><Icon name="paw" size={48} color={colors.ink3} /></View>}
            <View style={{ padding: 18, gap: 4 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}><Text style={[pd.name, { fontSize: 22 }]}>{pet.name}</Text><SexMark sex={pet.sex} size={18} /></View>
              <Text style={type.small}>{pet.breed} · {ageOf(pet.birth)} · {pet.weight} kg</Text>
              <View style={{ marginTop: 8 }}><Pill chip text={pet.status === 'active' ? 'Active' : pet.status === 'deceased' ? 'Deceased' : 'Inactive'} tone={pet.status === 'active' ? 'ok' : ''} /></View>
            </View>
            <View style={{ paddingHorizontal: 18, paddingBottom: 18, gap: 16 }}>
              {infoBlock}
              {footer && <View style={{ flexDirection: 'row', gap: 10 }}>{footer}</View>}
            </View>
          </View>
          <>
            <Tabs options={[['history', 'History'], ['follow', 'Reminders', openF.filter(f => diff(f.date) < 0).length], ['docs', 'Files']]} value={wTab} onChange={setTab} />
            {wTab === 'history' && historyBlock}{wTab === 'follow' && followBlock}{wTab === 'docs' && docsBlock}
          </>
        </Cols>
        {sheets}
      </Screen>
    );
  }
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={[pd.hero, { height: (src ? Math.min(270, Math.round(Math.min(width, 760) / 1.5)) : 150) + insets.top, paddingTop: insets.top }]}>
          {src ? <View style={{ position: 'absolute', top: insets.top, left: 0, right: 0, bottom: 0 }}><Image source={src} style={{ width: '100%', height: '100%' }} resizeMode="cover" accessibilityLabel={`Photo of ${pet.name}`} /></View> : <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center', paddingTop: insets.top }]}><Icon name="paw" size={56} color={colors.ink3} /></View>}
          <View style={[pd.heroBtns, { top: insets.top + 8 }]}>
            <Pressable onPress={() => nav.goBack()} accessibilityRole="button" accessibilityLabel="Back" style={pd.round}><Icon name="chevL" size={22} color={colors.ink} /></Pressable>
            {canEdit && <Pressable onPress={() => nav.navigate('PetForm', { id: pet.id, ownerId: pet.ownerId })} accessibilityRole="button" accessibilityLabel="Edit pet" style={pd.round}><Icon name="edit" size={18} color={colors.ink} /></Pressable>}
          </View>
        </View>
        <View style={[pd.sheet, wide && { maxWidth: 760, width: '100%', alignSelf: 'center' }]}>
          <View style={{ gap: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={pd.name}>{pet.name}</Text>
              <SexMark sex={pet.sex} size={22} />
            </View>
            <Text style={[type.small, { fontSize: 14 }]}>{pet.breed} · {ageOf(pet.birth)} · {pet.weight} kg</Text>
            <View style={{ marginTop: 4 }}><Pill chip text={pet.status === 'active' ? 'Active' : pet.status === 'deceased' ? 'Deceased' : 'Inactive'} tone={pet.status === 'active' ? 'ok' : ''} /></View>
          </View>
        <Tabs options={[['info', 'Info'], ['history', 'History'], ['follow', 'Reminders', openF.filter(f => diff(f.date) < 0).length], ['docs', 'Files']]} value={tab} onChange={setTab} />
        {tab === 'info' && infoBlock}{tab === 'history' && historyBlock}{tab === 'follow' && followBlock}{tab === 'docs' && docsBlock}




        </View>
      </ScrollView>
      {footer && <View style={[pd.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}><View style={[{ flexDirection: 'row', gap: 10 }, wide && { maxWidth: 760, width: '100%', alignSelf: 'center' }]}>{footer}</View></View>}

      {sheets}
    </View>
  );
}

function NoteSheet({ visible, onClose, pet }: { visible: boolean; onClose: () => void; pet: Pet }) {
  const { act } = useApp(); const [text, setText] = useState(''); const [err, setErr] = useState('');
  const save = () => { if (!text.trim()) return setErr('Write a short note'); act.addNote(pet.id, text.trim()); setText(''); onClose(); };
  return (
    <Sheet visible={visible} onClose={onClose} title={`Progress note for ${pet.name}`} footer={<Btn label="Add note" style={{ flex: 1 }} onPress={save} />}>
      <Field label="How is the condition progressing?" multiline placeholder="e.g. Less head shaking after two days of ear drops." value={text} onChangeText={v => { setText(v); setErr(''); }} error={err} />
      <T.Small>Dated and signed with your name. The owner can read it in the pet's history.</T.Small>
    </Sheet>
  );
}

export const KINDS: [FollowKind, string][] = [['Recheck', 'Return visit'], ['Vaccination', 'Vaccine due'], ['Deworming', 'Deworming due']];
function FollowSheet({ visible, onClose, pet }: { visible: boolean; onClose: () => void; pet: Pet }) {
  const { act } = useApp();
  const [f, setF] = useState<{ kind: FollowKind; reason: string; days: string; notes: string }>({ kind: 'Recheck', reason: '', days: '7', notes: '' }); const [err, setErr] = useState('');
  const save = () => {
    const reason = f.kind === 'Deworming' && !f.reason.trim() ? 'Deworming' : f.reason.trim();
    if (!reason) return setErr(f.kind === 'Vaccination' ? 'Enter the vaccine, e.g. Anti-rabies booster' : 'Enter the reason for the return visit');
    act.addFollowUp({ petId: pet.id, kind: f.kind, date: D(Number(f.days)), reason, notes: f.notes.trim() }); onClose(); setF({ kind: 'Recheck', reason: '', days: '7', notes: '' });
  };
  const vaccines = pet.species === 'cat' ? ['4-in-1 (Feline) booster', 'Anti-rabies booster'] : ['5-in-1 (DHPPi) booster', 'Anti-rabies booster'];
  return (
    <Sheet visible={visible} onClose={onClose} title={`Set a due date for ${pet.name}`} footer={<Btn label="Save and remind owner" style={{ flex: 1 }} onPress={save} />}>
      <Seg label="Type" options={KINDS} value={f.kind} onChange={v => { setF({ ...f, kind: v, reason: '', days: v === 'Recheck' ? '7' : v === 'Deworming' ? '90' : '365' }); setErr(''); }} />
      {f.kind === 'Vaccination' && <Seg wrap options={vaccines.map(x => [x, x] as [string, string])} value={f.reason} onChange={v => { setF({ ...f, reason: v }); setErr(''); }} />}
      {f.kind !== 'Deworming' && <Field label={f.kind === 'Vaccination' ? 'Vaccine' : 'Reason'} placeholder={f.kind === 'Vaccination' ? 'Or type another vaccine' : 'e.g. Ear recheck after treatment'} value={f.reason} onChangeText={v => { setF({ ...f, reason: v }); setErr(''); }} error={err} />}
      <Seg label="Due in" wrap options={DUE_PICKS} value={f.days} onChange={v => setF({ ...f, days: v })} />
      <T.Small>Due date: {fmtD(D(Number(f.days)))}</T.Small>
      <Field label="Notes for the owner (optional)" multiline value={f.notes} onChangeText={v => setF({ ...f, notes: v })} />
    </Sheet>
  );
}

function DocSheet({ visible, onClose, petId }: { visible: boolean; onClose: () => void; petId: string }) {
  const { act } = useApp();
  const [kind, setKind] = useState('Laboratory result'); const [file, setFile] = useState(''); const [size, setSize] = useState(''); const [err, setErr] = useState('');
  const choose = async () => {
    const r = await pickFile();
    if (typeof r === 'string') return setErr(r);
    if (r) { setFile(r.name); setSize(fileSize(r.size)); setErr(''); return; }
    if (Platform.OS !== 'web') { setFile(samples[kind]); setErr(''); }
  };
  const samples: Record<string, string> = { 'Laboratory result': 'lab-result.pdf', 'Vaccination card': 'vaccination-card.jpg', 'Pet photo': 'pet-photo.jpg', Other: 'document.pdf' };
  const save = () => { if (!file) return setErr('Choose a file first'); act.addDoc(petId, kind, file, size || undefined); setFile(''); setSize(''); onClose(); };
  return (
    <Sheet visible={visible} onClose={onClose} title="Upload a file" footer={<Btn label="Upload" icon="upload" style={{ flex: 1 }} onPress={save} />}>
      <Seg label="What is it?" wrap options={Object.keys(samples).map(k => [k, k] as [string, string])} value={kind} onChange={k => { setKind(k); setFile(''); }} />
      <Pressable onPress={choose} style={[pd.drop, !!err && { borderColor: colors.dot }]} accessibilityRole="button">
        <Text style={type.h3}>{file || 'Choose a file or take a photo'}</Text>
        <T.Small>{file ? `${size ? `${size} · ` : ''}Click to choose a different file` : 'JPEG, PNG or PDF, up to 10 MB'}</T.Small>
      </Pressable>
      {!!err && <T.Small color={colors.bad}>{err}</T.Small>}
      <T.Small>Prototype: the file's name and size are recorded; the file itself is not stored until a backend is connected.</T.Small>
    </Sheet>
  );
}

export function PetForm() {
  const nav = useNav(); const { db, act, user } = useApp(); const p = useParams<{ id: string; ownerId: string }>(); const bp = useBP();
  const existing = p.id ? sel.pet(db, p.id) : undefined;
  const [f, setF] = useState({
    name: existing?.name || '', species: (existing?.species || 'dog') as Species, breed: existing?.breed || '', sex: existing?.sex || 'Male',
    birth: existing?.birth || '', ageYears: '', weight: existing ? String(existing.weight) : '', coat: existing?.coat || 'golden',
  });
  const [unknownBirth, setUnknownBirth] = useState(false);
  const [err, setErr] = useState<Record<string, string>>({});
  const set = (k: keyof typeof f, v: string) => { setF({ ...f, [k]: v }); setErr({ ...err, [k]: '' }); };
  const dup = !existing && f.name.trim() && sel.petsOf(db, p.ownerId!).some(x => x.name.toLowerCase() === f.name.trim().toLowerCase());
  const save = () => {
    const e: Record<string, string> = {};
    if (!f.name.trim()) e.name = 'Enter the pet name';
    if (!unknownBirth && !/^\d{4}-\d{2}-\d{2}$/.test(f.birth)) e.birth = 'Use the format YYYY-MM-DD, e.g. 2023-04-15';
    else if (!unknownBirth && diff(f.birth) > 0) e.birth = 'Birthdate cannot be in the future';
    if (unknownBirth && !(Number(f.ageYears) > 0)) e.ageYears = 'Enter an estimated age in years';
    if (!(Number(f.weight) > 0)) e.weight = 'Enter the weight in kg';
    if (Object.keys(e).length) return setErr(e);
    const birth = unknownBirth ? D(-Math.round(Number(f.ageYears) * 365)) : f.birth;
    const saved = act.savePet({ id: existing?.id, ownerId: p.ownerId!, name: f.name.trim(), species: f.species, breed: f.breed.trim() || 'Mixed breed', sex: f.sex as Pet['sex'], birth, weight: Number(f.weight), coat: f.coat });
    if (existing) nav.goBack(); else nav.replace('PetDetail', { id: saved.id });
  };
  const pair = (a: React.ReactNode, b: React.ReactNode) => bp.wide
    ? <View style={{ flexDirection: 'row', gap: 16, alignItems: 'flex-start' }}><View style={{ flex: 1 }}>{a}</View><View style={{ flex: 1 }}>{b}</View></View>
    : <>{a}{b}</>;
  return (
    <Screen title={existing ? `Edit ${existing.name}` : 'Add a pet'} sub={existing ? 'Update your pet’s details. Medical records are kept by the clinic.' : 'Add your pet to book visits and keep their records in one place.'}
      footer={<Btn label={existing ? 'Save changes' : 'Save pet'} style={{ flex: 1 }} onPress={save} />}>
      {user!.role !== 'owner' && !existing && <Banner icon="user" title={`Owner: ${sel.owner(db, p.ownerId!)?.name}`} />}
      <Card style={{ gap: 18 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <PetAvatar pet={{ id: existing?.id, species: f.species }} size={64} square />
          <View style={{ flex: 1 }}><Text style={type.h2}>{f.name.trim() || (existing ? existing.name : 'New pet')}</Text><T.Small>The clinic currently accepts dogs and cats.</T.Small></View>
        </View>
        {pair(
          <Field label="Pet name" placeholder="e.g. Bingo" value={f.name} onChangeText={v => set('name', v)} error={err.name} hint={dup ? 'This owner already has a pet with this name. You can still save.' : undefined} />,
          <Field label="Breed" placeholder="e.g. Aspin, Puspin, Shih Tzu" value={f.breed} onChangeText={v => set('breed', v)} />,
        )}
        {pair(
          <Seg label="Species" options={[['dog', 'Dog'], ['cat', 'Cat']]} value={f.species} onChange={v => setF({ ...f, species: v, coat: coatsFor(v)[0] || '' })} />,
          <Seg label="Sex" options={[['Male', 'Male'], ['Female', 'Female']]} value={f.sex} onChange={v => set('sex', v)} />,
        )}
        {pair(
          <View style={{ gap: 8 }}>
            {!unknownBirth
              ? <Field label="Birthdate" placeholder="YYYY-MM-DD" value={f.birth} onChangeText={v => set('birth', v)} error={err.birth} />
              : <Field label="Estimated age (years)" keyboardType="decimal-pad" value={f.ageYears} onChangeText={v => set('ageYears', v)} error={err.ageYears} />}
            <Pressable onPress={() => setUnknownBirth(x => !x)} accessibilityRole="button" hitSlop={6} style={{ alignSelf: 'flex-start' }}><Text style={{ color: colors.accentDeep, fontWeight: '600', fontSize: 13.5 }}>{unknownBirth ? 'I know the birthdate' : "I don't know the exact birthdate"}</Text></Pressable>
          </View>,
          <Field label="Weight (kg)" keyboardType="decimal-pad" placeholder="e.g. 8.5" value={f.weight} onChangeText={v => set('weight', v)} error={err.weight} />,
        )}
      </Card>
      <Hint icon="camera">Prototype: pet photos come from the sample data. The real app lets you take or choose a photo.</Hint>
    </Screen>
  );
}

export function VisitDetail() {
  const nav = useNav(); const { db, user } = useApp(); const p = useParams<{ id: string }>();
  const v = db.visits.find(x => x.id === p.id)!; const pet = sel.pet(db, v.petId)!;
  const follows = db.followups.filter(f => f.petId === pet.id && f.status === 'open');
  return (
    <Screen title="Visit record" right={user!.role === 'admin' ? <Btn label="Edit" icon="edit" small kind="line" onPress={() => nav.navigate('ConsultForm', { petId: pet.id, visitId: v.id })} /> : undefined}>
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
        <PetAvatar pet={pet} size={52} />
        <View style={{ flex: 1 }}><T.H2>{pet.name}</T.H2><T.Small>{fmtDY(v.date)} · {v.vet}</T.Small></View>
      </View>
      {!v.diagnosis && <Banner tone="warn" icon="clock" title="Waiting for the veterinarian" sub={`${v.enteredBy || 'Staff'} entered the reason for visit. The veterinarian completes the rest.`} />}
      <Card style={{ gap: 14 }}>
        {[['Reason for visit', v.complaint], ['Findings', v.findings], ['Diagnosis', v.diagnosis], ['Treatment', v.treatment], ['Medication', v.medication], ['Weight', v.weight ? `${v.weight} kg` : '']].map(([k, val]) => (
          <View key={k} style={{ gap: 3 }}><Text style={type.label}>{k}</Text><T.Body>{val || '—'}</T.Body></View>
        ))}
      </Card>
      {follows.length > 0 && <Section title="Coming up for this pet"><Group>{follows.slice(0, 3).map(f => <Row key={f.id} icon={FOLLOW_ICON[f.kind]} title={f.reason} sub={`${f.kind} · ${fmtD(f.date)}`} />)}</Group></Section>}
      {v.edits.length > 0 && <Section title="Edit history">
        <Group>{v.edits.slice().reverse().map((e, i) => <Row key={i} icon="history" title={`Edited by ${e.by}`} sub={ago(e.at)} />)}</Group>
      </Section>}
      {user!.role === 'owner' && <T.Small>Records are written by the clinic and are read-only. Message or call the clinic if something looks wrong.</T.Small>}
    </Screen>
  );
}

export function ConsultForm() {
  const nav = useNav(); const confirm = useConfirm(); const { db, user, act } = useApp();
  const p = useParams<{ petId: string; visitId: string; apptId: string }>();
  const pet = sel.pet(db, p.petId!)!; const existing = p.visitId ? db.visits.find(v => v.id === p.visitId) : undefined;
  const draft = !existing ? db.visits.find(v => v.petId === pet.id && v.date === D(0) && !v.diagnosis) : undefined;
  const base = existing || draft;
  const full = user!.role === 'admin';
  const [f, setF] = useState({
    complaint: base?.complaint || (p.apptId ? sel.appt(db, p.apptId)?.reason || '' : ''), weight: base?.weight ? String(base.weight) : '',
    findings: base?.findings || '', diagnosis: base?.diagnosis || '', treatment: base?.treatment || '', medication: base?.medication || '',
  });
  const [fu, setFu] = useState<{ kind: FollowKind | ''; reason: string; days: string }>({ kind: '', reason: '', days: '14' });
  const [err, setErr] = useState<Record<string, string>>({});
  const set = (k: keyof typeof f, v: string) => { setF({ ...f, [k]: v }); setErr({ ...err, [k]: '' }); };
  const save = () => {
    const e: Record<string, string> = {};
    if (!f.complaint.trim()) e.complaint = 'Enter the reason for the visit';
    if (full && f.weight && !(Number(f.weight) > 0)) e.weight = 'Enter a valid weight';
    if (full && !f.diagnosis.trim()) e.diagnosis = 'Enter the diagnosis';
    if (fu.kind && fu.kind !== 'Deworming' && !fu.reason.trim()) e.fu = 'Enter what the due date is for';
    if (Object.keys(e).length) return setErr(e);
    const v = act.saveVisit({ id: base?.id, petId: pet.id, complaint: f.complaint.trim(),
      ...(full ? { weight: Number(f.weight) || 0, findings: f.findings.trim(), diagnosis: f.diagnosis.trim(), treatment: f.treatment.trim(), medication: f.medication.trim(), vet: user!.name } : { enteredBy: user!.name, vet: 'Dr. Elena Ybañez' }) }, p.apptId);
    if (fu.kind) act.addFollowUp({ petId: pet.id, kind: fu.kind, date: D(Number(fu.days)), reason: fu.reason.trim() || 'Deworming', notes: '' }, true);
    nav.goBack();
    if (!existing && full) {
      const appt = p.apptId ? sel.appt(db, p.apptId) : undefined;
      confirm({ title: 'Create the bill now?', body: `Add the services given to ${pet.name} so the owner can pay.`, ok: 'Create bill', cancel: 'Later', icon: 'receipt',
        onOk: () => nav.navigate('CreateBill', { petId: pet.id, apptId: appt?.id, visitId: v.id }) });
    }
  };
  return (
    <Screen title={existing ? 'Edit consultation' : full ? 'Consultation record' : 'Reason for visit'} footer={<Btn label="Save record" style={{ flex: 1 }} onPress={save} />}>
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
        <PetAvatar pet={pet} size={48} />
        <View><T.H3>{pet.name}</T.H3><T.Small>{cap(pet.species)} · {ageOf(pet.birth)} · last weight {pet.weight} kg</T.Small></View>
      </View>
      {!full && <Banner icon="info" title="Staff enter the reason for visit only" sub="The veterinarian records findings, diagnosis, treatment and medication. The owner and administrator can see the reason." />}
      {existing && <Banner tone="warn" icon="history" title="Edits are logged" sub="Your name and the time of this change are saved with the record." />}
      <Field label="Reason for visit / complaint" multiline value={f.complaint} onChangeText={v => set('complaint', v)} error={err.complaint} />
      {full && <>
        <Field label="Weight (kg, optional)" keyboardType="decimal-pad" value={f.weight} onChangeText={v => set('weight', v)} error={err.weight} />
        <Field label="Findings" multiline value={f.findings} onChangeText={v => set('findings', v)} />
        <Field label="Diagnosis" value={f.diagnosis} onChangeText={v => set('diagnosis', v)} error={err.diagnosis} />
        <Field label="Treatment (include any vaccine or deworming given)" multiline value={f.treatment} onChangeText={v => set('treatment', v)} />
        <Field label="Medication" multiline placeholder="Name, dose and how long" value={f.medication} onChangeText={v => set('medication', v)} />
      </>}
      {!existing && <Section title="Next due date (optional)">
        <Seg wrap options={[['', 'None'], ['Recheck', 'Recheck'], ['Vaccination', 'Vaccine'], ['Deworming', 'Deworming']] as [FollowKind | '', string][]} value={fu.kind} onChange={v => setFu({ kind: v, reason: '', days: v === 'Recheck' ? '14' : v === 'Deworming' ? '90' : '365' })} />
        {fu.kind !== '' && fu.kind !== 'Deworming' && <Field placeholder={fu.kind === 'Vaccination' ? 'e.g. Anti-rabies booster' : 'e.g. Ear recheck'} value={fu.reason} onChangeText={v => { setFu({ ...fu, reason: v }); setErr({ ...err, fu: '' }); }} error={err.fu} />}
        {fu.kind !== '' && <><Seg wrap options={DUE_PICKS} value={fu.days} onChange={v => setFu({ ...fu, days: v })} /><T.Small>Due {fmtD(D(Number(fu.days)))}. The owner gets a reminder.</T.Small></>}
      </Section>}
    </Screen>
  );
}

const pd = StyleSheet.create({
  hero: { backgroundColor: colors.subtle, overflow: 'hidden' },
  heroBtns: { position: 'absolute', left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between' },
  round: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.94)', borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  sheet: { marginTop: -26, borderTopLeftRadius: 26, borderTopRightRadius: 26, backgroundColor: colors.bg, paddingHorizontal: 20, paddingTop: 22, gap: 18 },
  nameCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 16, paddingVertical: 14 },
  name: { fontFamily: FONT, fontSize: 26, fontWeight: '700', letterSpacing: -0.6, color: colors.ink },
  info: { backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 16, ...shadow },
  infoFlat: { borderTopWidth: 1, borderTopColor: colors.line },
  fact: { width: '50%', paddingVertical: 12, gap: 2 },
  factRow:  { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.line },
  factIcon: { width: 32, height: 32, borderRadius: 9, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  side: { backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.line, overflow: 'hidden', ...shadow },
  sideImg: { width: '100%', height: 230 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.line, overflow: 'hidden' },
  cell: { width: '50%', flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 13 },
  cellIcon: { width: 32, height: 32, borderRadius: 9, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
  footer: { paddingHorizontal: 16, paddingTop: 12, backgroundColor: colors.surface, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
  visit: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12, paddingHorizontal: 16 },
  dateBox: { width: 46, height: 50, borderRadius: 10, backgroundColor: colors.subtle, alignItems: 'center', justifyContent: 'center' },
  dateMon: { fontFamily: FONT, fontSize: 11, fontWeight: '600', color: colors.ink2, textTransform: 'uppercase', letterSpacing: 0.4 },
  dateDay: { fontFamily: FONT, fontSize: 18, fontWeight: '700', color: colors.ink, marginTop: -1 },
  drop: { borderWidth: 1, borderStyle: 'dashed', borderColor: colors.lineStrong, borderRadius: 12, padding: 20, alignItems: 'center', gap: 4, backgroundColor: colors.surface },
});
