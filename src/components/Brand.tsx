// VetChroPH brand assets. The mark is extracted from the brand sheet (assets/brand); the wordmark is set in type
// so it stays sharp at every size. Use BrandMark where space is tight and Logo where the brand is introduced.
import { Image, Text, View } from 'react-native';
import { colors } from '../theme';

const MARK = require('../../assets/brand/mark.png');
const MARK_WHITE = require('../../assets/brand/mark_white.png');
const RATIO = 780 / 720;

export function BrandMark({ size = 32, white }: { size?: number; white?: boolean }) {
  return <Image source={white ? MARK_WHITE : MARK} accessibilityLabel="VetChroPH" style={{ width: size * RATIO, height: size }} resizeMode="contain" />;
}

/** App-icon style: white mark on a navy rounded square (used for the clinic in chats and receipts). */
export function BrandTile({ size = 40 }: { size?: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size * 0.28, backgroundColor: colors.accentDeep, alignItems: 'center', justifyContent: 'center' }}>
      <BrandMark white size={size * 0.62} />
    </View>
  );
}

export function Wordmark({ size = 20, light }: { size?: number; light?: boolean }) {
  return (
    <Text style={{ fontSize: size, fontWeight: '800', letterSpacing: -0.4, color: light ? '#fff' : colors.accentDeep }}>
      VetChro<Text style={{ color: light ? '#BFD6EE' : colors.accent }}>PH</Text>
    </Text>
  );
}

export function Logo({ size = 34, tagline }: { size?: number; tagline?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: size * 0.3 }}>
      <BrandMark size={size} />
      <View>
        <Wordmark size={size * 0.62} />
        {tagline && <Text style={{ fontSize: size * 0.3, color: colors.ink2, letterSpacing: 0.6, marginTop: 1 }}>Care Today. Healthier Tomorrow.</Text>}
      </View>
    </View>
  );
}
