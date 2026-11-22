// Bottom sheet, confirm dialog and toast. Built on RN Modal so they behave the same on Android and in the web preview.
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Animated, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, space, type, FONT } from '../theme';
import { Icon, IconName } from './Icon';
import { Btn, IconBtn } from './ui';
import { useApp } from '../store/AppStore';
import { useBP } from './responsive';

export function Sheet({ visible, onClose, title, children, footer }: { visible: boolean; onClose: () => void; title: string; children: React.ReactNode; footer?: React.ReactNode }) {
  const insets = useSafeAreaInsets(); const { wide } = useBP();
  return (
    <Modal visible={visible} transparent animationType={wide ? 'fade' : 'slide'} onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={[{ flex: 1 }, wide && { justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
        <Pressable style={st.scrim} onPress={onClose} accessibilityLabel="Close" />
        <View style={[st.sheet, { paddingBottom: Math.max(insets.bottom, 16) }, wide && st.modal]} accessibilityViewIsModal accessibilityRole={Platform.OS === 'web' ? ('dialog' as never) : undefined}>
          {!wide && <View style={st.grab} />}
          <View style={st.sheetHead}>
            <Text style={[type.h1, { flex: 1, fontSize: 18 }]} numberOfLines={2}>{title}</Text>
            <IconBtn name="x" label="Close" size={20} onPress={onClose} />
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: space.lg, paddingBottom: 8 }} showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>
          {footer && <View style={{ flexDirection: 'row', gap: 10, paddingTop: 12 }}>{footer}</View>}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

interface DialogOpts { title: string; body?: string; ok?: string; cancel?: string | false; tone?: 'bad' | 'ok' | ''; icon?: IconName; onOk?: () => void }
const DialogCtx = createContext<(o: DialogOpts) => void>(() => { });
export const useConfirm = () => useContext(DialogCtx);

export function OverlayHost({ children }: { children: React.ReactNode }) {
  const [d, setD] = useState<DialogOpts | null>(null);
  const confirm = useCallback((o: DialogOpts) => setD(o), []);
  const close = () => setD(null);
  const tone = d?.tone || '';
  return (
    <DialogCtx.Provider value={confirm}>
      {children}
      <Modal visible={!!d} transparent animationType="fade" onRequestClose={close} statusBarTranslucent>
        <View style={st.center}>
          <Pressable style={StyleSheet.absoluteFill} onPress={close} />
          {d && (
            <View style={st.dialog} accessibilityRole="alert">
              <View style={[st.dIcon, tone === 'bad' && { backgroundColor: colors.badBg }, tone === 'ok' && { backgroundColor: colors.okBg }]}>
                <Icon name={d.icon || 'info'} size={21} color={tone === 'bad' ? colors.bad : tone === 'ok' ? colors.ok : colors.accentDeep} />
              </View>
              <Text style={[type.h2, { textAlign: 'center' }]}>{d.title}</Text>
              {d.body && <Text style={[type.small, { textAlign: 'center', fontSize: 14, lineHeight: 20 }]}>{d.body}</Text>}
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                {d.cancel !== false && <Btn label={d.cancel || 'Cancel'} kind="line" onPress={close} style={{ flex: 1 }} />}
                <Btn label={d.ok || 'Confirm'} kind={tone === 'bad' ? 'dangerFill' : 'primary'} style={{ flex: 1 }} onPress={() => { const f = d.onOk; close(); f?.(); }} />
              </View>
            </View>
          )}
        </View>
      </Modal>
      <ToastView />
    </DialogCtx.Provider>
  );
}

function ToastView() {
  const { toastMsg } = useApp();
  const insets = useSafeAreaInsets(); const { wide } = useBP();
  const op = useRef(new Animated.Value(0)).current;
  const [shown, setShown] = useState(toastMsg);
  useEffect(() => {
    if (!toastMsg) return;
    setShown(toastMsg);
    op.setValue(0);
    Animated.sequence([
      Animated.timing(op, { toValue: 1, duration: 180, useNativeDriver: Platform.OS !== 'web' }),
      Animated.delay(2600),
      Animated.timing(op, { toValue: 0, duration: 220, useNativeDriver: Platform.OS !== 'web' }),
    ]).start(() => setShown(null));
  }, [toastMsg, op]);
  if (!shown) return null;
  return (
    <Animated.View pointerEvents="none" accessibilityLiveRegion="polite"
      style={[st.toast, { bottom: wide ? 28 : insets.bottom + 92, opacity: op, transform: [{ translateY: op.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }, shown.err && { backgroundColor: colors.bad }]}>
      <View style={st.toastIcon}><Icon name={shown.err ? 'alert' : 'check'} size={14} color="#fff" /></View>
      <Text style={st.toastText}>{shown.text}</Text>
    </Animated.View>
  );
}

const st = StyleSheet.create({
  scrim: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.scrim },
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, maxHeight: '90%', maxWidth: 760, width: '100%', alignSelf: 'center', marginHorizontal: 'auto', backgroundColor: colors.surface, borderTopLeftRadius: 18, borderTopRightRadius: 18, paddingHorizontal: space.xl, paddingTop: 10 },
  modal: { position: 'relative', left: undefined, right: undefined, bottom: undefined, width: '100%', maxWidth: 560, maxHeight: '86%', borderRadius: 16, paddingTop: 22, paddingBottom: 20 },
  grab: { width: 36, height: 4, borderRadius: 2, backgroundColor: colors.lineStrong, alignSelf: 'center', marginBottom: 12 },
  sheetHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12, marginRight: -8 },
  center: { flex: 1, backgroundColor: colors.scrim, justifyContent: 'center', padding: space.xl },
  dialog: { backgroundColor: colors.surface, borderRadius: 16, padding: 20, gap: 10, alignItems: 'stretch', width: '100%', maxWidth: 420, alignSelf: 'center' },
  dIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 4 },
  toast: { position: 'absolute', left: 18, right: 18, maxWidth: 520, alignSelf: 'center', backgroundColor: colors.ink, borderRadius: radius.lg, paddingVertical: 12, paddingHorizontal: 14, flexDirection: 'row', gap: 10, alignItems: 'center', elevation: 6, shadowColor: '#101828', shadowOpacity: 0.18, shadowRadius: 12, shadowOffset: { width: 0, height: 6 } },
  toastIcon: { width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  toastText: { fontFamily: FONT, color: '#fff', fontSize: 14, fontWeight: '500', flex: 1 },
});
