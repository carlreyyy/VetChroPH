// Shared pieces for uploaded files (objective 2): thumbnail, upload box and full-screen viewer.
// Images are shown as they are. PDFs show their first page when a preview exists; in the browser preview a picked
// PDF opens in the built-in PDF viewer, and in the Android app it opens in the phone's PDF app.
import React, { useState } from 'react';
import { Image, ImageSourcePropType, Linking, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from './Icon';
import { T } from './ui';
import { SAMPLE_FILES } from '../data/photos';
import { colors, radius, type, FONT } from '../theme';
import { isPdf, pickFile, takePhoto, RULES_ANY, RULES_IMAGE } from '../utils/files';
import type { FileRef } from '../types';

/** Image source for a file: the picked file, or the bundled sample (for PDFs, an image of page 1). */
export function fileSource(f: FileRef): ImageSourcePropType | undefined {
  if (f.uri && !isPdf(f)) return { uri: f.uri };
  if (f.sample && SAMPLE_FILES[f.sample]) return SAMPLE_FILES[f.sample];
  return undefined;
}

/** Small square preview used in file lists. */
export function FileThumb({ file, size = 46 }: { file: FileRef; size?: number }) {
  const src = fileSource(file); const pdf = isPdf(file);
  return (
    <View style={[fx.thumb, { width: size, height: size }, pdf && !src && { backgroundColor: '#FDECEC', borderColor: '#F6CACA' }]}>
      {src ? <Image source={src} style={{ width: '100%', height: '100%' }} resizeMode="cover" accessibilityIgnoresInvertColors />
        : <Icon name={pdf ? 'file' : 'image'} size={size * 0.44} color={pdf ? colors.bad : colors.ink3} />}
      {pdf && <View style={fx.pdfTag}><Text style={fx.pdfTagText}>PDF</Text></View>}
    </View>
  );
}

/**
 * The dashed upload area. Tapping it opens the file picker; in the Android app a second button opens the camera.
 * Shows the picked file with a preview, or the error from the type and size check.
 */
export function UploadBox({ file, onPick, error, imagesOnly, title, accent = colors.teal }: {
  file?: FileRef | null; onPick: (f: FileRef | null, error?: string) => void; error?: string; imagesOnly?: boolean; title?: string; accent?: string;
}) {
  const run = async (fn: () => Promise<FileRef | string | null>) => {
    const r = await fn();
    if (typeof r === 'string') onPick(file || null, r); else if (r) onPick(r);
  };
  const rules = imagesOnly ? RULES_IMAGE : RULES_ANY;
  return (
    <View style={{ gap: 8 }}>
      <Pressable onPress={() => run(() => pickFile({ imagesOnly }))} accessibilityRole="button" accessibilityLabel={file ? `Selected ${file.name}. Choose a different file` : title || 'Choose a file'}
        style={[fx.drop, !!error && { borderColor: colors.bad }, !!file && { borderStyle: 'solid', borderColor: accent, backgroundColor: colors.surface }]}>
        {file ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, alignSelf: 'stretch' }}>
            <FileThumb file={file} size={56} />
            <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
              <Text style={type.h3} numberOfLines={1}>{file.name}</Text>
              <T.Small>{isPdf(file) ? 'PDF document' : 'Image'} · {file.size}</T.Small>
              <Text style={{ fontFamily: FONT, fontSize: 13, fontWeight: '600', color: accent }}>Choose a different file</Text>
            </View>
            <Icon name="check" size={20} color={accent} />
          </View>
        ) : <>
          <View style={[fx.dropIcon, { backgroundColor: colors.tileTeal }]}><Icon name="upload" size={20} color={accent} /></View>
          <Text style={type.h3}>{title || 'Choose a file'}</Text>
          <T.Small>{rules}</T.Small>
        </>}
      </Pressable>
      {Platform.OS !== 'web' && !file && (
        <Pressable onPress={() => run(takePhoto)} accessibilityRole="button" style={fx.camera}>
          <Icon name="camera" size={18} color={accent} /><Text style={{ fontFamily: FONT, fontWeight: '600', color: accent }}>Take a photo</Text>
        </Pressable>
      )}
      {!!error && <T.Small color={colors.bad}>{error}</T.Small>}
    </View>
  );
}

/** Full-screen viewer. `meta` is a short line under the name, for example "Laboratory result · Lea Ramirez". */
export function FileViewer({ file, meta, onClose }: { file: FileRef | null; meta?: string; onClose: () => void }) {
  const insets = useSafeAreaInsets(); const [ratio, setRatio] = useState(0);
  if (!file) return null;
  const pdf = isPdf(file); const src = fileSource(file);
  const webPdf = pdf && !!file.uri && Platform.OS === 'web';
  const open = () => { if (file.uri) Linking.openURL(file.uri).catch(() => { /* no app can open it */ }); };
  return (
    <Modal visible animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={[fx.viewer, { paddingTop: insets.top }]}>
        <View style={fx.vHead}>
          <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" hitSlop={8} style={fx.vClose}><Icon name="x" size={22} color="#fff" /></Pressable>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={fx.vName} numberOfLines={1}>{file.name}</Text>
            <Text style={fx.vMeta} numberOfLines={1}>{[pdf ? 'PDF' : 'Image', file.size, meta].filter(Boolean).join(' · ')}</Text>
          </View>
        </View>
        <View style={{ flex: 1 }}>
          {webPdf ? React.createElement('iframe', { src: file.uri, title: file.name, style: { border: 0, width: '100%', height: '100%', background: '#fff' } })
            : src ? (
              <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 16 }} maximumZoomScale={4} minimumZoomScale={1} centerContent>
                <Image source={src} resizeMode="contain" accessibilityLabel={file.name}
                  onLoad={e => { const s = e.nativeEvent.source; if (s?.width && s?.height) setRatio(s.width / s.height); }}
                  style={[{ width: '100%', borderRadius: 6, backgroundColor: pdf ? '#fff' : 'transparent' }, ratio ? { aspectRatio: ratio } : { height: 420 }]} />
                {pdf && <Text style={[fx.vMeta, { textAlign: 'center', marginTop: 10 }]}>Page 1</Text>}
              </ScrollView>
            ) : (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 24 }}>
                <Icon name={pdf ? 'file' : 'image'} size={48} color="rgba(255,255,255,0.7)" />
                <Text style={[fx.vName, { textAlign: 'center' }]}>{pdf ? 'PDF document' : 'Image'}</Text>
                <Text style={[fx.vMeta, { textAlign: 'center' }]}>{file.uri ? 'Open it in your phone’s viewer.' : 'This file was not kept after the app restarted.'}</Text>
              </View>
            )}
        </View>
        {pdf && file.uri && Platform.OS !== 'web' && (
          <View style={{ padding: 16, paddingBottom: Math.max(insets.bottom, 16) }}>
            <Pressable onPress={open} accessibilityRole="button" style={fx.vBtn}><Icon name="file" size={18} color={colors.ink} /><Text style={{ fontFamily: FONT, fontWeight: '700', color: colors.ink }}>Open PDF</Text></Pressable>
          </View>
        )}
      </View>
    </Modal>
  );
}

const fx = StyleSheet.create({
  thumb: { borderRadius: 10, overflow: 'hidden', backgroundColor: colors.subtle, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  pdfTag: { position: 'absolute', left: 3, bottom: 3, backgroundColor: colors.bad, borderRadius: 4, paddingHorizontal: 4, paddingVertical: 1 },
  pdfTagText: { fontFamily: FONT, color: '#fff', fontSize: 9, fontWeight: '800', letterSpacing: 0.3 },
  drop: { borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.lineStrong, borderRadius: radius.lg, padding: 18, alignItems: 'center', gap: 6, backgroundColor: colors.subtle },
  dropIcon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  camera: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface },
  viewer: { flex: 1, backgroundColor: '#0B1220' },
  vHead: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12, paddingVertical: 10 },
  vClose: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  vName: { fontFamily: FONT, color: '#fff', fontSize: 16, fontWeight: '700' },
  vMeta: { fontFamily: FONT, color: 'rgba(255,255,255,0.65)', fontSize: 12.5, marginTop: 2 },
  vBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#fff', borderRadius: 999, paddingVertical: 14 },
});
