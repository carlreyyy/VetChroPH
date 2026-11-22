import { useState } from 'react';
import { Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme, useNavigationContainerRef } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider } from './src/store/AppStore';
import { OverlayHost } from './src/components/overlays';
import { RootNavigator } from './src/navigation/RootNavigator';
import { Shell } from './src/navigation/Shell';
import { linking, TITLES, RootList } from './src/navigation/linking';
import { colors } from './src/theme';

const theme = { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: colors.bg, primary: colors.accentDeep, card: colors.surface, text: colors.ink, border: colors.line } };

// Browser-wide styles: font, focus ring, tap highlight, page background.
if (Platform.OS === 'web' && typeof document !== 'undefined' && !document.getElementById('vc-web')) {
  // Google Font
  if (!document.getElementById('vc-font')) {
    const link = document.createElement('link');
    link.id = 'vc-font';
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400..700&family=Geist:wght@400..700&display=swap';
    document.head.appendChild(link);
  }
  const el = document.createElement('style'); el.id = 'vc-web';
  el.textContent = `
    html, body { background: ${colors.bg}; font-family: 'Geist', system-ui, -apple-system, sans-serif; -webkit-font-smoothing: antialiased; }
    ::selection { background: ${colors.now}; color: ${colors.ink}; }
    @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; } }
    * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
    [role="button"]:focus-visible, [role="link"]:focus-visible, [role="tab"]:focus-visible, [role="radio"]:focus-visible,
    [role="checkbox"]:focus-visible, [role="switch"]:focus-visible, a:focus-visible, button:focus-visible {
      outline: 2px solid ${colors.accent}; outline-offset: 3px; border-radius: 6px;
    }
    input:focus-visible, textarea:focus-visible { outline: none; }
  `;
  document.head.appendChild(el);
}

export default function App() {
  const navRef = useNavigationContainerRef<RootList>();
  const [route, setRoute] = useState('');
  const sync = () => setRoute(navRef.getCurrentRoute()?.name || '');
  return (
    <SafeAreaProvider>
      <AppProvider>
        <NavigationContainer ref={navRef} theme={theme} linking={linking} onReady={sync} onStateChange={sync}
          documentTitle={{ formatter: (_o, r) => (r?.name && TITLES[r.name] ? `${TITLES[r.name]} · VetChroPH` : 'VetChroPH') }}>
          <OverlayHost>
            <Shell route={route} navRef={navRef}>
              <RootNavigator />
            </Shell>
          </OverlayHost>
        </NavigationContainer>
        <StatusBar style="dark" />
      </AppProvider>
    </SafeAreaProvider>
  );
}
