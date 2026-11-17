import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

// Screen params are plain string maps so notifications can link to any screen.
export type Params = Record<string, string | undefined> | undefined;
export type Nav = NativeStackNavigationProp<Record<string, Params>>;

export const useNav = () => useNavigation<Nav>();
export function useParams<T extends Record<string, string | undefined>>() {
  return (useRoute().params || {}) as Partial<T>;
}
