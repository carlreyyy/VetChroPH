// Simple original pet illustrations (ported from the HTML prototype) so pet screens are not just initials.
import React from 'react';
import { Image, View } from 'react-native';
import { PET_PHOTOS } from '../data/photos';
import { Icon } from './Icon';
import Svg, { Circle, Ellipse, Path, Rect } from 'react-native-svg';
import type { Pet } from '../types';
import { colors } from '../theme';

const COATS: Record<string, Record<string, [string, string, string]>> = {
  dog: { tan: ['#CDA67F', '#A57A52', '#F2E5D1'], brown: ['#9C7452', '#6E4E35', '#E4D3BC'], cream: ['#EBDABD', '#C9AF87', '#F9F2E4'], bw: ['#FFFFFF', '#3A3F3B', '#FFFFFF'], gray: ['#B9BEBA', '#8D938F', '#E8EBE8'], golden: ['#DBB173', '#B98B4F', '#F3E4C8'], black: ['#4A4F4B', '#2E3230', '#8E948F'] },
  cat: { orange: ['#DDA66E', '#B97E45', '#EBC3C0'], gray: ['#A9B0B2', '#848B8E', '#E3C7C5'], black: ['#434845', '#2D3230', '#8D8F8D'], white: ['#F4F2ED', '#DAD6CC', '#EBC9C6'], calico: ['#F1EBE0', '#D69A62', '#EBC9C6'] },
  rabbit: { white: ['#F6F4EF', '#E7C9C6', '#FFFFFF'], brown: ['#B08E70', '#E1BDB4', '#E9DAC8'], gray: ['#B3B8B6', '#E1C4C0', '#E9ECEA'] },
};
export const coatsFor = (sp: string) => Object.keys(COATS[sp] || {});
const INK = '#2E3430';

export function PetArt({ species, coat, size = 120 }: { species: string; coat: string; size?: number }) {
  const sp = COATS[species] ? species : 'other';
  if (sp === 'other') return (
    <Svg width={size} height={size} viewBox="0 0 120 120"><Ellipse cx={60} cy={76} rx={24} ry={20} fill="#B9C6B8" /><Circle cx={28} cy={52} r={10} fill="#B9C6B8" /><Circle cx={48} cy={34} r={10} fill="#B9C6B8" /><Circle cx={72} cy={34} r={10} fill="#B9C6B8" /><Circle cx={92} cy={52} r={10} fill="#B9C6B8" /></Svg>
  );
  const [fur, ear, mz] = COATS[sp][coat] || Object.values(COATS[sp])[0];
  if (sp === 'dog') return (
    <Svg width={size} height={size} viewBox="0 0 120 120">
      <Path d="M23 34c-9 2-14 16-12 30 1 8 7 12 13 9 6-3 8-12 8-22 0-10-2-18-9-17z" fill={ear} />
      <Path d="M97 34c9 2 14 16 12 30-1 8-7 12-13 9-6-3-8-12-8-22 0-10 2-18 9-17z" fill={ear} />
      <Path d="M60 24c20 0 36 14 36 36 0 24-15 40-36 40S24 84 24 60c0-22 16-36 36-36z" fill={fur} />
      {coat === 'bw' && <Path d="M64 36c14-2 28 8 28 22 0 6-4 8-8 6-8-4-14-12-20-28z" fill={ear} />}
      <Ellipse cx={60} cy={77} rx={19} ry={15} fill={mz} />
      <Path d="M52 67c0-4 4-6 8-6s8 2 8 6c0 4-5 7-8 7s-8-3-8-7z" fill={INK} />
      <Path d="M60 74v5M60 79c-3 4-8 4-10 1M60 79c3 4 8 4 10 1" stroke={INK} strokeWidth={2} fill="none" strokeLinecap="round" />
      <Circle cx={46} cy={55} r={4.2} fill={INK} /><Circle cx={74} cy={55} r={4.2} fill={INK} />
      <Circle cx={47.3} cy={53.7} r={1.3} fill="#fff" /><Circle cx={75.3} cy={53.7} r={1.3} fill="#fff" />
    </Svg>
  );
  if (sp === 'cat') return (
    <Svg width={size} height={size} viewBox="0 0 120 120">
      <Path d="M24 54 26 18 52 34Z" fill={fur} stroke={fur} strokeWidth={6} strokeLinejoin="round" />
      <Path d="M96 54 94 18 68 34Z" fill={fur} stroke={fur} strokeWidth={6} strokeLinejoin="round" />
      <Path d="M30 45 31 27 43 35Z" fill={mz} />
      <Path d="M90 45 89 27 77 35Z" fill={mz} />
      <Ellipse cx={60} cy={69} rx={40} ry={34} fill={fur} />
      {coat === 'calico' && <><Path d="M34 44c8-8 18-10 26-8-6 6-8 14-12 18-6 2-12-2-14-10z" fill="#D69A62" /><Path d="M82 52c4-6 10-8 14-6 2 6-2 14-8 16-5 0-7-4-6-10z" fill="#4A4F4B" /></>}
      <Path d="M60 37v9M50 39l2 8M70 39l-2 8" stroke={coat === 'calico' ? '#D69A62' : ear} strokeWidth={3} strokeLinecap="round" opacity={0.8} />
      <Ellipse cx={45} cy={66} rx={5.6} ry={6.6} fill="#C3CF93" /><Ellipse cx={75} cy={66} rx={5.6} ry={6.6} fill="#C3CF93" />
      <Ellipse cx={45} cy={66} rx={2} ry={5.2} fill={INK} /><Ellipse cx={75} cy={66} rx={2} ry={5.2} fill={INK} />
      <Path d="M56 76h8l-4 4.4z" fill="#D9A3A0" />
      <Path d="M60 80.4v3M60 83.4c-3 3-7 3-9 0M60 83.4c3 3 7 3 9 0" stroke={INK} strokeWidth={1.8} fill="none" strokeLinecap="round" />
      <Path d="M30 79 13 75M30 84 14 87M90 79l17-4M90 84l16 3" stroke={INK} strokeOpacity={0.3} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120">
      <Ellipse cx={44} cy={30} rx={10} ry={27} fill={fur} rotation={-8} origin="44,30" />
      <Ellipse cx={76} cy={30} rx={10} ry={27} fill={fur} rotation={8} origin="76,30" />
      <Ellipse cx={44.5} cy={32} rx={4.8} ry={19} fill={ear} rotation={-8} origin="44,30" />
      <Ellipse cx={75.5} cy={32} rx={4.8} ry={19} fill={ear} rotation={8} origin="76,30" />
      <Ellipse cx={60} cy={77} rx={34} ry={29} fill={fur} /><Ellipse cx={60} cy={86} rx={15} ry={10} fill={mz} />
      <Circle cx={46} cy={72} r={3.8} fill={INK} /><Circle cx={74} cy={72} r={3.8} fill={INK} />
      <Path d="M56 81h8l-4 4z" fill="#D9A3A0" />
      <Path d="M60 85v3M60 88c-2.5 3-6 3-8 0M60 88c2.5 3 6 3 8 0" stroke={INK} strokeWidth={1.7} fill="none" strokeLinecap="round" />
    </Svg>
  );
}

/** Pet photo (circle or rounded square). Pets without a photo get a neutral placeholder with a paw. */
export function PetAvatar({ pet, size = 44, square }: { pet: { id?: string; species: string; coat?: string }; size?: number; square?: boolean }) {
  const src = pet.id ? PET_PHOTOS[pet.id] : undefined;
  const r = square ? Math.min(14, size * 0.24) : size / 2;
  if (src) return <Image source={src} accessibilityIgnoresInvertColors style={{ width: size, height: size, borderRadius: r, backgroundColor: colors.subtle }} />;
  return (
    <View style={{ width: size, height: size, borderRadius: r, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
      <Icon name="paw" size={size * 0.42} color={colors.accent} />
    </View>
  );
}

/** Placeholder QR pattern. In the real app this is the clinic's uploaded QR image. */
export function QrArt({ size = 176, seed = 7 }: { size?: number; seed?: number }) {
  const n = 25; let s = seed * 9301 + 49297; const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  const inF = (x: number, y: number) => (x < 8 && y < 8) || (x >= n - 8 && y < 8) || (x < 8 && y >= n - 8);
  let d = '';
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (!inF(x, y) && rnd() > 0.52) d += `M${x} ${y}h1v1h-1z`;
  const finder = (ox: number, oy: number) => (
    <React.Fragment key={`${ox}-${oy}`}>
      <Path d={`M${ox} ${oy}h7v7h-7zM${ox + 1} ${oy + 1}v5h5v-5z`} fill="#0E1A2F" fillRule="evenodd" />
      <Rect x={ox + 2} y={oy + 2} width={3} height={3} fill="#0E1A2F" />
    </React.Fragment>
  );
  return (
    <Svg width={size} height={size} viewBox={`-1 -1 ${n + 2} ${n + 2}`}>
      <Rect x={-1} y={-1} width={n + 2} height={n + 2} fill="#fff" />
      <Path d={d} fill="#0E1A2F" />
      {[finder(0, 0), finder(n - 7, 0), finder(0, n - 7)]}
    </Svg>
  );
}
