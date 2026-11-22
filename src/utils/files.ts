// File upload (objective 2). One picker for every upload in the app: pet files, visit attachments, chat attachments,
// payment proofs, pet photos and the clinic's QR code. Uses Expo's document and image pickers, so it works in the
// Android app (files, gallery and camera) and in the browser preview.
// Rules: JPEG and PNG images and PDF documents only, 10 MB at most. Files stay on the device in the prototype;
// the backend stores them in private storage buckets.
import { Platform } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import type { FileRef, FileType } from '../types';

export const MAX_BYTES = 10 * 1024 * 1024;
export const RULES_ANY = 'JPEG, PNG or PDF · up to 10 MB';
export const RULES_IMAGE = 'JPEG or PNG · up to 10 MB';

const EXT: Record<string, FileType> = { jpg: 'image', jpeg: 'image', png: 'image', pdf: 'pdf' };
const MIME: Record<string, FileType> = { 'image/jpeg': 'image', 'image/jpg': 'image', 'image/png': 'image', 'application/pdf': 'pdf' };

export const fileSize = (n: number) => (n >= 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);
export const isPdf = (f: { type?: FileType; name: string }) => f.type === 'pdf' || f.name.toLowerCase().endsWith('.pdf');

/** Checks the type and size. Returns the file, or an error message to show under the upload box. */
function check(name: string, bytes: number | undefined, mime: string | undefined, uri: string, imagesOnly: boolean): FileRef | string {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  const type = (mime && MIME[mime.toLowerCase()]) || EXT[ext];
  if (!type || (imagesOnly && type !== 'image')) return imagesOnly ? 'Choose a JPEG or PNG image.' : 'Choose a JPEG, PNG or PDF file.';
  if ((bytes || 0) > MAX_BYTES) return 'The file is larger than 10 MB.';
  return { name, size: fileSize(bytes || 0), type, uri };
}

/** Opens the file picker. Resolves a file, an error message, or null when cancelled. */
export async function pickFile(opts: { imagesOnly?: boolean } = {}): Promise<FileRef | string | null> {
  const r = await DocumentPicker.getDocumentAsync({
    type: opts.imagesOnly ? ['image/jpeg', 'image/png'] : ['image/jpeg', 'image/png', 'application/pdf'],
    copyToCacheDirectory: true, multiple: false,
  });
  if (r.canceled || !r.assets?.length) return null;
  const a = r.assets[0];
  return check(a.name, a.size, a.mimeType, a.uri, !!opts.imagesOnly);
}

/** Takes a photo with the phone camera (Android app only). */
export async function takePhoto(): Promise<FileRef | string | null> {
  if (Platform.OS === 'web') return pickFile({ imagesOnly: true });
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) return 'Allow camera access in your phone settings to take a photo.';
  const r = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.7 });
  if (r.canceled || !r.assets?.length) return null;
  const a = r.assets[0];
  return check(a.fileName || `photo-${Date.now()}.jpg`, a.fileSize, a.mimeType || 'image/jpeg', a.uri, true);
}

/** Picks a photo from the gallery, cropped square (pet photos). */
export async function pickPhoto(): Promise<FileRef | string | null> {
  const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7, allowsEditing: true, aspect: [1, 1] });
  if (r.canceled || !r.assets?.length) return null;
  const a = r.assets[0];
  return check(a.fileName || `pet-photo-${Date.now()}.jpg`, a.fileSize, a.mimeType || 'image/jpeg', a.uri, true);
}
