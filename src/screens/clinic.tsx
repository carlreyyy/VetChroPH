// Clinic-side screens used by Staff and the Administrator: daily dashboard, patients, owner record, due and overdue list.
import { useState } from 'react';
import { Linking, Pressable, Text, View } from 'react-native';
import { Avatar, Banner, Btn, Card, Chips, Empty, Field, Group, Hint, IconBtn, Pill, QuickActions, Row, Screen, Section, Skeleton, Stack, Stat, StatGrid, T, Tabs, useFirstLoad } from '../components/ui';
import { Sheet } from '../components/overlays';
import { PetAvatar } from '../components/PetArt';
import { Greeting, HomeHeader } from './common';
import { Cell, Cols, DataTable, useBP } from '../components/responsive';
import type { Appt, Doc } from '../types';
import { FileThumb, FileViewer } from '../components/files';
import { isPdf, RULES_ANY } from '../utils/files';
import { useApp, sel } from '../store/AppStore';
import { useNav, useParams } from '../navigation/nav';
import { colors, shadow, type, FONT, DISPLAY } from '../theme';
import {
  APPT, BILL, D, FOLLOW_ICON, ago, ageOf, billBalance, billState, byDateTime, cap, diff, fmtD, followStatus, isEmail, isPhone, money, normPhone, t12,
} from '../utils/format';

/** Open follow-ups (rechecks, vaccines, deworming) grouped by status. */
export function useDueList() {
  const { db } = useApp();
  const all = sel.openFollowUps(db).map(f => ({ f, pet: sel.pet(db, f.petId)!, s: followStatus(f) }));
  return { overdue: all.filter(x => x.s.key === 'overdue'), soon: all.filter(x => x.s.key === 'soon'), later: all.filter(x => x.s.key === 'later') };
}

/** Today's appointments as a table (tablet and desktop). */
export function ScheduleTable({ list, showStaff }: { list: Appt[]; showStaff?: boolean }) {
  const nav = useNav(); const { db } = useApp();
  return (
    <DataTable rows={list} keyOf={a => a.id} onRowPress={a => nav.navigate('ApptDetail', { id: a.id })} rowLabel={a => `${t12(a.time)} ${sel.pet(db, a.petId)!.name}`}
      columns={[
        { key: 't', label: 'Time', width: 84, render: a => <Text style={{ fontFamily: FONT, fontSize: 14, fontWeight: '600', color: colors.ink }}>{t12(a.time)}</Text> },
        { key: 'p', label: 'Patient', flex: 2, render: a => { const p = sel.pet(db, a.petId)!; return <Cell left={<PetAvatar pet={p} size={36} />} title={p.name} sub={sel.owner(db, a.ownerId)!.name} />; } },
        { key: 's', label: 'Service', flex: 2, render: a => a.service },
        ...(showStaff ? [{ key: 'h', label: 'Handled by', flex: 1.3, wideOnly: true, render: (a: Appt) => a.handledBy || '—' }] : []),
        { key: 'st', label: 'Status', width: 120, render: a => <Pill text={APPT[a.status][0]} tone={APPT[a.status][1]} badge /> },
      ]} />
  );
}

export function DashSkeleton() {
  return (
    <Stack gap={20}>
      <Skeleton h={14} w={180} />
      <Skeleton h={160} r={14} />
      <Skeleton h={76} r={14} />
      <Skeleton h={220} r={14} />
    </Stack>
  );
}

export function Patients() {
  const nav = useNav(); const { db } = useApp();
  const [tab, setTab] = useState<'pets' | 'owners'>('pets'); const [q, setQ] = useState('');
  const s = q.trim().toLowerCase(); const digits = q.replace(/\D/g, '');
  const ownerMatch = (o: typeof db.owners[0]) => !s || o.name.toLowerCase().includes(s) || (digits.length >= 3 && normPhone(o.phone).replace(/\s/g, '').includes(digits));
  const pets = db.pets.filter(p => !s || p.name.toLowerCase().includes(s) || ownerMatch(sel.owner(db, p.ownerId)!)).sort((a, b) => a.name.localeCompare(b.name));
  const owners = db.owners.filter(ownerMatch).sort((a, b) => a.name.localeCompare(b.name));
  const { wide } = useBP();
  const status = (p: typeof pets[0]) => <Pill text={cap(p.status)} tone={p.status === 'active' ? 'ok' : ''} />;
  return (
    <Screen title="Patients" back={false} big tabbed sub="Every pet and owner on file. Search by name or mobile number.">
      <View style={wide ? { flexDirection: 'row', alignItems: 'flex-end', gap: 20 } : { gap: 16 }}>
        <View style={wide ? { width: 340 } : undefined}><Tabs options={[['pets', `Pets (${pets.length})`], ['owners', `Owners (${owners.length})`]]} value={tab} onChange={setTab} /></View>
        <Field icon="search" placeholder="Search name or mobile number" value={q} onChangeText={setQ} style={wide ? { flex: 1, maxWidth: 420, marginLeft: 'auto' } : undefined} />
      </View>
      {!wide && <Group><Row icon="file" title="Documents" sub={`${db.docs.length} uploaded files · lab results, vaccine cards, photos`} onPress={() => nav.navigate('Documents')} /></Group>}
      {wide ? (tab === 'pets'
        ? <DataTable rows={pets} keyOf={p => p.id} onRowPress={p => nav.navigate('PetDetail', { id: p.id })} rowLabel={p => p.name} empty={<Empty icon="search" title="No pets found" />}
            columns={[
              { key: 'n', label: 'Pet', flex: 2, render: p => <Cell left={<PetAvatar pet={p} size={36} />} title={p.name} sub={cap(p.species)} /> },
              { key: 'b', label: 'Breed', flex: 1.6, render: p => p.breed },
              { key: 'a', label: 'Age', flex: 0.9, render: p => ageOf(p.birth) },
              { key: 'o', label: 'Owner', flex: 1.8, render: p => { const o = sel.owner(db, p.ownerId)!; return <Cell title={o.name} sub={o.phone} />; } },
              { key: 's', label: 'Status', width: 110, wideOnly: true, render: status },
            ]} />
        : <DataTable rows={owners} keyOf={o => o.id} onRowPress={o => nav.navigate('OwnerDetail', { id: o.id })} rowLabel={o => o.name} empty={<Empty icon="search" title="No owners found" />}
            columns={[
              { key: 'n', label: 'Owner', flex: 2, render: o => <Cell left={<Avatar name={o.name} size={36} />} title={o.name} sub={o.email || undefined} /> },
              { key: 'm', label: 'Mobile', flex: 1.3, render: o => o.phone },
              { key: 'p', label: 'Pets', flex: 2, render: o => sel.petsOf(db, o.id).map(x => x.name).join(', ') || '—' },
              { key: 's', label: 'Client since', flex: 1.1, wideOnly: true, render: o => fmtD(o.since) },
            ]} />
      ) : tab === 'pets' ? (pets.length === 0 ? <Empty icon="search" title="No pets found" /> : (
        <Group>{pets.map(p => (
          <Row key={p.id} left={<PetAvatar pet={p} size={42} />} title={p.name} sub={`${cap(p.species)} · ${p.breed} · ${ageOf(p.birth)} · ${sel.owner(db, p.ownerId)!.name}`} right={p.status !== 'active' ? <Pill text={cap(p.status)} /> : undefined} onPress={() => nav.navigate('PetDetail', { id: p.id })} />
        ))}</Group>
      )) : (owners.length === 0 ? <Empty icon="search" title="No owners found" sub="Pet owners create their own accounts in the app." /> : (
        <Group>{owners.map(o => (
          <Row key={o.id} left={<Avatar name={o.name} />} title={o.name} sub={`${o.phone} · ${sel.petsOf(db, o.id).length} pet(s)`} onPress={() => nav.navigate('OwnerDetail', { id: o.id })} />
        ))}</Group>
      ))}
    </Screen>
  );
}

export function OwnerDetail() {
  const nav = useNav(); const { db, act } = useApp(); const { id } = useParams<{ id: string }>();
  const o = sel.owner(db, id!)!; const pets = sel.petsOf(db, o.id);
  const appts = db.appts.filter(a => a.ownerId === o.id).sort(byDateTime).reverse().slice(0, 5);
  const bills = db.bills.filter(b => b.ownerId === o.id && billState(b) !== 'paid');
  const [noteOpen, setNoteOpen] = useState(false); const [note, setNote] = useState(''); const [noteErr, setNoteErr] = useState('');
  const [edit, setEdit] = useState(false); const [f, setF] = useState({ name: o.name, phone: o.phone, email: o.email, address: o.address }); const [err, setErr] = useState<Record<string, string>>({});
  const save = () => {
    const e: Record<string, string> = {};
    if (!f.name.trim()) e.name = 'Enter the name'; if (!isPhone(f.phone)) e.phone = 'Use a PH mobile number';
    else { const other = act.findOwnerByPhone(f.phone); if (other && other.id !== o.id) e.phone = `Already used by ${other.name}`; }
    if (f.email && !isEmail(f.email)) e.email = 'Enter a valid email';
    if (Object.keys(e).length) return setErr(e);
    act.updateOwner(o.id, { ...f, phone: normPhone(f.phone) }); setEdit(false);
  };
  return (
    <Screen title="Owner record" right={<View style={{ flexDirection: 'row', gap: 8 }}><IconBtn name="phone" label="Call owner" onPress={() => Linking.openURL(`tel:${o.phone.replace(/\s/g, '')}`)} /><IconBtn name="edit" label="Edit owner" onPress={() => setEdit(true)} /></View>}
      footer={<><Btn label="Message" icon="chat" kind="line" style={{ flex: 1 }} onPress={() => nav.navigate('Chat', { ownerId: o.id })} /><Btn label="Book visit" icon="calendar" style={{ flex: 1 }} onPress={() => nav.navigate('Book', { ownerId: o.id, staff: '1' })} /></>}>
      <View style={{ borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface }}>
        <View style={{ backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.line, padding: 16, flexDirection: 'row', gap: 14, alignItems: 'center' }}>
          <Avatar name={o.name} size={56} />
          <View style={{ flex: 1, gap: 3 }}>
            <Text style={{ fontFamily: DISPLAY, fontSize: 26, fontWeight: '600', color: colors.ink, letterSpacing: -0.6 }} numberOfLines={1}>{o.name}</Text>
            <Text style={{ fontFamily: FONT, fontSize: 13, color: colors.ink2 }} numberOfLines={1}>{o.phone}{o.email ? ` · ${o.email}` : ''}</Text>
            {!!o.address && <Text style={{ fontFamily: FONT, fontSize: 13, color: colors.ink2 }} numberOfLines={1}>{o.address}</Text>}
          </View>
        </View>
        <View style={{ flexDirection: 'row', backgroundColor: colors.surface, paddingHorizontal: 16, paddingVertical: 12 }}>
          <View style={{ flex: 1, gap: 1 }}>
            <Text style={{ fontFamily: FONT, fontSize: 11, color: colors.ink3 }}>Client since</Text>
            <Text style={{ fontFamily: FONT, fontSize: 14, fontWeight: '600', color: colors.ink }}>{fmtD(o.since)}</Text>
          </View>
          <View style={{ flex: 1, gap: 1, alignItems: 'center' }}>
            <Text style={{ fontFamily: FONT, fontSize: 11, color: colors.ink3 }}>Pets</Text>
            <Text style={{ fontFamily: FONT, fontSize: 14, fontWeight: '600', color: colors.ink }}>{pets.length}</Text>
          </View>
          <View style={{ flex: 1, gap: 1, alignItems: 'flex-end' }}>
            <Text style={{ fontFamily: FONT, fontSize: 11, color: colors.ink3 }}>Open bills</Text>
            <Text style={{ fontFamily: FONT, fontSize: 14, fontWeight: '600', color: bills.length > 0 ? colors.bad : colors.ok }}>{bills.length}</Text>
          </View>
        </View>
      </View>
      <Section title="Pets">
        {pets.length === 0 ? <T.Small>No pets yet.</T.Small> : <Group>{pets.map(p => <Row key={p.id} left={<PetAvatar pet={p} size={42} />} title={p.name} sub={`${cap(p.species)} · ${p.breed} · ${ageOf(p.birth)}`} right={p.status !== 'active' ? <Pill text={cap(p.status)} /> : undefined} onPress={() => nav.navigate('PetDetail', { id: p.id })} />)}</Group>}
      </Section>
      {bills.length > 0 && <Section title="Open bills"><Group>{bills.map(b => <Row key={b.id} icon="receipt" title={`${sel.pet(db, b.petId)!.name} · ${money(billBalance(b))}`} sub={fmtD(b.date)} right={<Pill text={BILL[billState(b)][0]} tone={BILL[billState(b)][1]} badge />} onPress={() => nav.navigate('BillDetail', { id: b.id })} />)}</Group></Section>}
      {appts.length > 0 && <Section title="Recent appointments"><Group>{appts.map(a => <Row key={a.id} icon="calendar" title={`${sel.pet(db, a.petId)!.name} · ${a.service}`} sub={`${fmtD(a.date)}, ${t12(a.time)}`} right={<Pill text={APPT[a.status][0]} tone={APPT[a.status][1]} badge />} onPress={() => nav.navigate('ApptDetail', { id: a.id })} />)}</Group></Section>}
      <Section title="Internal notes" action="Add note" onAction={() => { setNote(''); setNoteErr(''); setNoteOpen(true); }}>
        {o.notes.length === 0 ? <T.Small>No notes. Missed visits are noted here automatically.</T.Small> : <Group>{o.notes.map(n => <Row key={n.id} icon="sticky" title={n.text} sub={`${n.by} · ${ago(n.at)}`} subLines={2} />)}</Group>}
        <T.Small>Visible to clinic staff and the administrator only.</T.Small>
      </Section>
      <Sheet visible={noteOpen} onClose={() => setNoteOpen(false)} title="Add an internal note" footer={<Btn label="Save note" style={{ flex: 1 }} onPress={() => { if (!note.trim()) return setNoteErr('Write the note'); act.addStaffNote(o.id, note.trim()); setNoteOpen(false); }} />}>
        <Field label="Note (clinic only)" multiline placeholder="e.g. Prefers a call over text." value={note} onChangeText={v => { setNote(v); setNoteErr(''); }} error={noteErr} />
      </Sheet>
      <Sheet visible={edit} onClose={() => setEdit(false)} title="Edit owner details" footer={<Btn label="Save" style={{ flex: 1 }} onPress={save} />}>
        <Field label="Full name" value={f.name} onChangeText={v => setF({ ...f, name: v })} error={err.name} />
        <Field label="Mobile number" keyboardType="phone-pad" value={f.phone} onChangeText={v => setF({ ...f, phone: v })} error={err.phone} hint="Change only after checking the owner's identity." />
        <Field label="Email" autoCapitalize="none" value={f.email} onChangeText={v => setF({ ...f, email: v })} error={err.email} />
        <Field label="Address" value={f.address} onChangeText={v => setF({ ...f, address: v })} />
      </Sheet>
    </Screen>
  );
}

export function CareMonitor() {
  const nav = useNav(); const { db, act } = useApp(); const due = useDueList();
  const [tab, setTab] = useState<'overdue' | 'soon' | 'later'>('overdue');
  const list = due[tab];
  return (
    <Screen title="Due and overdue">
      <T.Small>Return visits and vaccine or deworming due dates. Owners get automatic reminders; send one now or call them.</T.Small>
      <Tabs options={[['overdue', 'Overdue', due.overdue.length], ['soon', 'Due in 7 days'], ['later', 'Later']]} value={tab} onChange={setTab} />
      {list.length === 0 ? <Empty icon="check" title="Nothing here" sub="Every pet in this list is up to date." /> : (
        <Stack gap={10}>
          {list.map(({ f, pet, s: st }) => { const o = sel.owner(db, pet.ownerId)!; return (
            <Card key={f.id} style={{ padding: 0 }}>
              <Pressable onPress={() => nav.navigate('PetDetail', { id: pet.id, tab: 'follow' })} style={{ flexDirection: 'row', gap: 12, alignItems: 'center', padding: 14 }}>
                <PetAvatar pet={pet} size={44} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={type.h3} numberOfLines={1}>{pet.name} · {f.reason}</Text>
                  <T.Small numberOfLines={1}>{f.kind} · {fmtD(f.date)} · {o.name}</T.Small>
                </View>
                <Pill text={st.label} tone={st.tone} />
              </Pressable>
              {tab !== 'later' && <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 14, paddingBottom: 14 }}>
                <Btn label="Send reminder" icon="bell" small kind="soft" style={{ flex: 1 }} onPress={() => act.remindOwner(pet.id, `${f.reason} ${st.label.toLowerCase()}`)} />
                <Btn label="Call" icon="phone" small kind="line" style={{ flex: 1 }} onPress={() => Linking.openURL(`tel:${o.phone.replace(/\s/g, '')}`)} />
              </View>}
            </Card>
          ); })}
        </Stack>
      )}
    </Screen>
  );
}

/**
 * Objective 2: every file uploaded by owners and the clinic, across all pets. Filter by type, search by pet, owner
 * or file name, tap to open. Staff and the administrator only.
 */
export function Documents() {
  const nav = useNav(); const { db } = useApp(); const { wide } = useBP();
  const [q, setQ] = useState(''); const [f, setF] = useState('all'); const [view, setView] = useState<Doc | null>(null);
  const s = q.trim().toLowerCase();
  const owners = new Set(db.owners.map(o => o.name));
  const FILTERS: [string, string, number?][] = [
    ['all', 'All', db.docs.length],
    ['lab', 'Lab results', db.docs.filter(d => d.kind === 'Laboratory result').length],
    ['vacc', 'Vaccine cards', db.docs.filter(d => d.kind === 'Vaccination card').length],
    ['pdf', 'PDF', db.docs.filter(d => isPdf(d)).length],
    ['img', 'Images', db.docs.filter(d => !isPdf(d)).length],
    ['owner', 'From owners', db.docs.filter(d => owners.has(d.by)).length],
  ];
  const keep = (d: Doc) => f === 'all' || (f === 'lab' && d.kind === 'Laboratory result') || (f === 'vacc' && d.kind === 'Vaccination card')
    || (f === 'pdf' && isPdf(d)) || (f === 'img' && !isPdf(d)) || (f === 'owner' && owners.has(d.by));
  const list = db.docs.filter(d => {
    if (!keep(d)) return false; if (!s) return true;
    const p = sel.pet(db, d.petId); const o = p && sel.owner(db, p.ownerId);
    return [d.name, d.kind, p?.name, o?.name].some(x => x?.toLowerCase().includes(s));
  }).sort((a, b) => b.date.localeCompare(a.date));
  return (
    <Screen title="Documents" sub="Files uploaded by pet owners and the clinic, for every pet.">
      <Hint icon="shield">{`${RULES_ANY}. Owners see only their own pets' files.`}</Hint>
      <Field icon="search" placeholder="Search pet, owner or file name" value={q} onChangeText={setQ} style={wide ? { maxWidth: 420 } : undefined} />
      <Chips options={FILTERS} value={f} onChange={setF} />
      {list.length === 0 ? <Empty icon="file" title="No files found" sub="Try another filter or search." /> : (
        <Group>{list.map(d => { const p = sel.pet(db, d.petId)!; const o = sel.owner(db, p.ownerId)!; return (
          <Row key={d.id} left={<FileThumb file={d} />} title={d.name} subLines={2} onPress={() => setView(d)}
            sub={`${p.name} · ${o.name}\n${d.kind} · ${d.size} · ${fmtD(d.date)} · ${d.by}`}
            action={<IconBtn name="paw" size={17} label={`Open ${p.name}'s profile`} onPress={() => nav.navigate('PetDetail', { id: p.id, tab: 'docs' })} />} />
        ); })}</Group>
      )}
      <FileViewer file={view} meta={view ? `${view.kind} · ${sel.pet(db, view.petId)?.name}` : undefined} onClose={() => setView(null)} />
    </Screen>
  );
}
