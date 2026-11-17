// Browser file picker without extra packages. Only the file's name and size are used in the prototype;
// the file itself is not stored or uploaded anywhere (there is no backend yet).
import { Platform } from 'react-native';

export interface Picked { name: string; size: number }
const MAX = 10 * 1024 * 1024;

/** Opens the browser's file dialog. Resolves null if cancelled, or an error message if the file is not allowed. */
export function pickFile(accept = '.jpg,.jpeg,.png,.pdf'): Promise<Picked | string | null> {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return Promise.resolve(null);
  return new Promise(resolve => {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = accept; input.style.display = 'none';
    input.onchange = () => {
      const f = input.files?.[0]; input.remove();
      if (!f) return resolve(null);
      const ext = f.name.split('.').pop()?.toLowerCase() || '';
      if (!accept.split(',').some(a => a.replace('.', '') === ext)) return resolve(`Choose a ${accept.replace(/\./g, '').toUpperCase().split(',').filter(x => x !== 'JPEG').join(', ')} file.`);
      if (f.size > MAX) return resolve('The file is larger than 10 MB.');
      resolve({ name: f.name, size: f.size });
    };
    document.body.appendChild(input); input.click();
  });
}
export const fileSize = (n: number) => (n >= 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);
