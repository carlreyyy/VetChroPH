// Messaging between pet owners and the clinic (manuscript objective 4; consultation D20 asks for real-time chat).
// In the prototype messages are kept in memory and appear instantly. Real-time delivery across phones
// needs the backend (for example a realtime database channel) and is listed as a limitation in the README.
import React, { useEffect, useRef, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar, Empty, Field, Group, Row, Screen, T, TAB_BAR_H, useWide } from '../components/ui';
import { BrandTile } from '../components/Brand';
import { useBP, hoverBg, PState } from '../components/responsive';
import { Icon } from '../components/Icon';
import { useApp, sel } from '../store/AppStore';
import { useNav, useParams } from '../navigation/nav';
import { colors, radius, type, FONT } from '../theme';
import { ago, clock, diff, fmtD, ymd } from '../utils/format';

function Thread({ ownerId, tabbed }: { ownerId: string; tabbed?: boolean }) {
  const { db, user, act } = useApp(); const insets = useSafeAreaInsets(); const wide = useWide(); const { mobile } = useBP();
  const msgs = db.messages[ownerId] || [];
  const mine = user!.role === 'owner' ? 'owner' : 'clinic';
  const [text, setText] = useState('');
  const ref = useRef<React.ComponentRef<typeof ScrollView>>(null);
  useEffect(() => { act.readThread(ownerId); }, [msgs.length]); // eslint-disable-line react-hooks/exhaustive-deps
  const send = () => { if (!text.trim()) return; act.sendMessage(ownerId, text); setText(''); };
  let lastDay = '';
  return (
    <View style={{ flex: 1 }}>
      <ScrollView ref={ref} onContentSizeChange={() => ref.current?.scrollToEnd({ animated: false })} contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12, flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        {msgs.length === 0 && <Empty icon="chat" title="No messages yet" sub={mine === 'owner' ? 'Ask the clinic about your pet, a booking or a bill.' : 'Start the conversation with this owner.'} />}
        {msgs.map((m, i) => {
          const day = ymd(new Date(m.at)); const head = day !== lastDay ? (lastDay = day, true) : false;
          const own = m.from === mine;
          const prev = msgs[i - 1], nextM = msgs[i + 1];
          const first = head || !prev || prev.by !== m.by;
          const last = !nextM || nextM.by !== m.by || ymd(new Date(nextM.at)) !== day;
          return (
            <React.Fragment key={m.id}>
              {head && <View style={ms.dayPill}><Text style={ms.dayText}>{diff(day) === 0 ? 'Today' : diff(day) === -1 ? 'Yesterday' : fmtD(day)}</Text></View>}
              <View style={[{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginTop: first ? 8 : 2 }, own && { justifyContent: 'flex-end' }]}>
                {!own && <View style={{ width: 30 }}>{last && <Avatar name={m.by} size={30} />}</View>}
                <View style={[{ maxWidth: wide ? 480 : '78%', gap: 3 }, own ? { alignItems: 'flex-end' } : { alignItems: 'flex-start' }]}>
                  {!own && first && <Text style={ms.sender}>{m.by}{m.from === 'clinic' ? ' · Clinic' : ''}</Text>}
                  <View style={[ms.bubble, own ? ms.own : ms.other, own && !last && { borderBottomRightRadius: 16 }, !own && !last && { borderBottomLeftRadius: 16 }]}>
                    <Text style={[type.body, { fontSize: 14.5, lineHeight: 20 }, own && { color: '#fff' }]}>{m.text}</Text>
                  </View>
                  {last && <Text style={ms.time}>{clock(m.at)}{own && m.read ? ' · Seen' : ''}</Text>}
                </View>
              </View>
            </React.Fragment>
          );
        })}
      </ScrollView>
      <View style={[ms.bar, { paddingBottom: tabbed && mobile ? TAB_BAR_H + Math.max(insets.bottom, 8) + 10 : Math.max(insets.bottom, 12) }]}>
        <TextInput value={text} onChangeText={setText} placeholder={mine === 'owner' ? 'Message the clinic' : 'Write a message'} placeholderTextColor={colors.ink3} style={[ms.input, { outlineStyle: 'none' } as never]} multiline numberOfLines={1} onSubmitEditing={send} accessibilityLabel="Message" />
        <Pressable onPress={send} disabled={!text.trim()} accessibilityRole="button" accessibilityLabel="Send" style={[ms.send, !text.trim() && { opacity: 0.4 }]}>
          <Icon name="send" size={19} color="#fff" />
        </Pressable>
      </View>
    </View>
  );
}

/** Pet owner's Messages tab: one conversation with the clinic. */
export function OwnerChat() {
  const { db, user } = useApp(); const { wide } = useBP(); const h = db.settings.days[new Date().getDay()]; const hr = new Date().getHours();
  const open = !!h?.open && hr >= h.from && hr < h.to;
  return (
    <Screen title="Messages" back={false} big scroll={false} wide={false} bleed sub="Your conversation with the clinic. Staff and the veterinarian reply here.">
      <View style={wide ? ms.frame : { flex: 1 }}>
        <View style={[ms.who, wide && { paddingTop: 14 }]}>
          <BrandTile size={40} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={type.h3} numberOfLines={1}>{db.clinic.name}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}><View style={[ms.online, !open && { backgroundColor: colors.ink3 }]} /><Text style={[type.small, { fontSize: 12.5 }]} numberOfLines={1}>{open ? 'Open now · replies during clinic hours' : 'Closed · we reply when the clinic opens'}</Text></View>
          </View>
          <Pressable onPress={() => Linking.openURL(`tel:${db.clinic.mobile.replace(/\s/g, '')}`)} accessibilityRole="button" accessibilityLabel="Call the clinic" style={(st: PState) => [ms.call, st.hovered && { backgroundColor: '#DCE9F7' }]}><Icon name="phone" size={18} color={colors.accentDeep} /></Pressable>
        </View>
        <Thread ownerId={user!.ownerId!} tabbed />
      </View>
    </Screen>
  );
}

/** A single conversation. Owners see their own thread; clinic roles pass ownerId. */
export function Chat() {
  const { db, user } = useApp(); const nav = useNav(); const p = useParams<{ ownerId: string }>();
  const ownerId = user!.role === 'owner' ? user!.ownerId! : p.ownerId!;
  const o = sel.owner(db, ownerId)!;
  return (
    <Screen title={user!.role === 'owner' ? db.clinic.name : o.name} scroll={false}
      right={user!.role !== 'owner' ? <Pressable onPress={() => nav.navigate('OwnerDetail', { id: o.id })} accessibilityLabel="Open owner record"><Avatar name={o.name} size={40} /></Pressable> : undefined}>
      {user!.role !== 'owner' && <View style={ms.who}><T.Small>{o.phone} · {sel.petsOf(db, o.id).filter(x => x.status === 'active').map(x => x.name).join(', ')}</T.Small></View>}
      <Thread ownerId={ownerId} />
    </Screen>
  );
}

/** Clinic inbox: every owner conversation, unread first. Staff tab and an Administrator screen. */
export function Inbox() {
  const nav = useNav(); const { db } = useApp(); const [q, setQ] = useState('');
  const isTab = !nav.canGoBack();
  const threads = Object.entries(db.messages).filter(([, m]) => m.length)
    .map(([oid, m]) => ({ o: sel.owner(db, oid)!, last: m[m.length - 1], unread: m.filter(x => x.from === 'owner' && !x.read).length }))
    .filter(t => !q.trim() || t.o.name.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => (b.unread ? 1 : 0) - (a.unread ? 1 : 0) || b.last.at - a.last.at);
  const starters = db.owners.filter(o => !(db.messages[o.id] || []).length && q.trim().length >= 2 && o.name.toLowerCase().includes(q.toLowerCase()));
  const { wide } = useBP(); const [picked, setPicked] = useState('');
  if (wide) {
    const cur = picked || threads[0]?.o.id || '';
    const o = cur ? sel.owner(db, cur) : undefined;
    const item = (id: string, name: string, sub: string, unread = 0, when?: number) => (
      <Pressable key={id} onPress={() => setPicked(id)} accessibilityRole="button" accessibilityLabel={`Conversation with ${name}`} accessibilityState={{ selected: id === cur }}
        style={(st: PState) => [ms.thread, { backgroundColor: id === cur ? colors.accentSoft : hoverBg(st) }]}>
        <Avatar name={name} size={40} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={[type.h3, { flex: 1 }, unread > 0 && { fontWeight: '700' }]} numberOfLines={1}>{name}</Text>
            {when ? <Text style={[type.small, { fontSize: 12 }]}>{ago(when)}</Text> : null}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={[type.small, { flex: 1 }]} numberOfLines={1}>{sub}</Text>
            {unread > 0 && <View style={ms.count}><Text style={ms.countText}>{unread}</Text></View>}
          </View>
        </View>
      </Pressable>
    );
    return (
      <Screen title="Messages" back={!isTab} wide scroll={false} sub="Conversations with pet owners. Staff and the administrator share this inbox.">
        <View style={ms.split}>
          <View style={ms.list}>
            <View style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: colors.line }}><Field icon="search" placeholder="Search owner" value={q} onChangeText={setQ} /></View>
            <ScrollView style={{ flex: 1 }}>
              {threads.length === 0 && starters.length === 0 && <Empty icon="chat" title="No conversations" />}
              {threads.map(t => item(t.o.id, t.o.name, `${t.last.from === 'clinic' ? 'You: ' : ''}${t.last.text}`, t.unread, t.last.at))}
              {starters.map(x => item(x.id, x.name, 'Start a conversation'))}
            </ScrollView>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            {o ? <>
              <View style={[ms.who, { paddingTop: 14 }]}>
                <Avatar name={o.name} size={40} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={type.h3} numberOfLines={1}>{o.name}</Text>
                  <T.Small numberOfLines={1}>{o.phone} · {sel.petsOf(db, o.id).filter(x => x.status === 'active').map(x => x.name).join(', ') || 'No pets'}</T.Small>
                </View>
                <Pressable onPress={() => nav.navigate('OwnerDetail', { id: o.id })} accessibilityRole="button" style={(st: PState) => [ms.link, st.hovered && { backgroundColor: colors.subtle }]}><Text style={{ fontFamily: FONT, color: colors.accentDeep, fontWeight: '600', fontSize: 13.5 }}>Owner record</Text></Pressable>
              </View>
              <Thread key={o.id} ownerId={o.id} />
            </> : <Empty icon="chat" title="Pick a conversation" />}
          </View>
        </View>
      </Screen>
    );
  }
  return (
    <Screen title="Messages" back={!isTab} big={isTab} tabbed={isTab}>
      <Field icon="search" placeholder="Search owner" value={q} onChangeText={setQ} />
      {threads.length === 0 && starters.length === 0 ? <Empty icon="chat" title="No conversations" sub="Messages from pet owners appear here." /> : (
        <Group>
          {threads.map(t => (
            <Row key={t.o.id} left={<Avatar name={t.o.name} />} title={t.o.name} sub={`${t.last.from === 'clinic' ? 'You: ' : ''}${t.last.text}`} unread={t.unread > 0}
              right={<View style={{ alignItems: 'flex-end', gap: 6 }}><Text style={[type.small, { fontSize: 12 }]}>{ago(t.last.at)}</Text>{t.unread > 0 && <View style={ms.count}><Text style={ms.countText}>{t.unread}</Text></View>}</View>}
              onPress={() => nav.navigate('Chat', { ownerId: t.o.id })} />
          ))}
          {starters.map(o => <Row key={o.id} left={<Avatar name={o.name} />} title={o.name} sub="Start a conversation" onPress={() => nav.navigate('Chat', { ownerId: o.id })} />)}
        </Group>
      )}
      <T.Small>Staff and the administrator share this inbox. Each reply shows who sent it.</T.Small>
    </Screen>
  );
}

const ms = StyleSheet.create({
  who: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 4, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.line, backgroundColor: colors.surface },
  frame: { flex: 1, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.line, borderRadius: 16, overflow: 'hidden', marginBottom: 24 },
  clinicTag: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  online: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.ok },
  bubbleWrap: { gap: 3 },
  sender: { fontFamily: FONT, fontSize: 12, fontWeight: '600', color: colors.ink2, marginLeft: 2 },
  dayPill: { alignSelf: 'center', backgroundColor: colors.subtle, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, marginTop: 14, marginBottom: 2 },
  dayText: { fontFamily: FONT, fontSize: 11.5, fontWeight: '600', color: colors.ink2 },
  call: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
  bubble: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18 },
  own: { backgroundColor: colors.accentDeep, borderBottomRightRadius: 4 },
  other: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderBottomLeftRadius: 4 },
  time: { fontSize: 11, color: colors.ink3, marginHorizontal: 2 },
  bar: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingHorizontal: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: colors.surface },
  input: { fontFamily: FONT, flex: 1, minHeight: 44, maxHeight: 110, borderRadius: 22, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.subtle, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12, fontSize: 15, color: colors.ink },
  send: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.accentDeep, alignItems: 'center', justifyContent: 'center' },
  split: { flex: 1, flexDirection: 'row', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 16, overflow: 'hidden', marginBottom: 24 },
  list: { width: 340, borderRightWidth: 1, borderRightColor: colors.line },
  thread: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.line },
  link: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  count: { minWidth: 20, height: 20, borderRadius: 10, backgroundColor: colors.dot, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  countText: { fontFamily: FONT, color: '#fff', fontSize: 11, fontWeight: '700' },
});
