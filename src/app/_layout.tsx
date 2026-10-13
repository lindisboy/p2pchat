import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { ActivityIndicator, View } from 'react-native';

import { Colors, Type } from '@/constants/theme';
import { useIsDark } from '@/hooks/use-theme';
import { I18nProvider, useI18n } from '@/i18n/provider';
import { AccessGate } from '@/components/access-gate';
import { AppProvider } from '@/lib/app-state';

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Anton: require('../../assets/branding/p2pchat/source/Anton-Regular.ttf'),
    Inter: require('../../assets/branding/p2pchat/source/Inter.ttf'),
  });
  const dark = useIsDark();
  const theme = dark ? Colors.dark : Colors.light;
  if (!loaded && !error) return <View style={{ flex: 1, backgroundColor: theme.bg, justifyContent: 'center' }}><ActivityIndicator color={theme.accent} /></View>;
  return (
    <I18nProvider>
      <SafeAreaProvider>
        <StatusBar style="auto" />
        <AccessGate>
          <LocalizedLayout />
        </AccessGate>
      </SafeAreaProvider>
    </I18nProvider>
  );
}

function LocalizedLayout() {
  const isDark = useIsDark();
  const t = isDark ? Colors.dark : Colors.light;
  const { t: copy } = useI18n();

  return (
      <KeyboardProvider>
        {/* KeyboardProvider reads the real IME window-inset animation natively.
          Under Android edge-to-edge the window does not resize and the RN
          Keyboard JS events do not reliably report the IME, so this is the only
          thing that actually moves the composer above the keyboard. */}
        <AppProvider>
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: t.bg },
            // The native stack owns the system bar while a route is focused.
            // Set its icon contrast with the same resolved theme as the screen.
            statusBarStyle: isDark ? 'light' : 'dark',
            headerTintColor: t.accent,
            headerTitleStyle: {
              fontFamily: 'Inter',
              color: t.text,
              fontSize: Type.heading.fontSize,
              fontWeight: Type.heading.fontWeight,
            },
            // No hairline under the header. The one horizontal rule that matters
            // on a chat screen is the bottom of the mode warning, and a second
            // rule directly above it dilutes that.
            headerShadowVisible: false,
            contentStyle: { backgroundColor: t.bg },
            // Calm and fast. The default push is already restrained; the point
            // here is that nothing anywhere in this app slides in playfully.
            animation: 'slide_from_right',
            animationDuration: 220,
          }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="chat/[id]" options={{ title: '' }} />
          <Stack.Screen name="contact/[id]" options={{ title: copy('contact.editTitle') }} />
          <Stack.Screen
            name="add"
            options={{ title: copy('nav.addPerson'), presentation: 'modal', animation: 'slide_from_bottom' }}
          />
          <Stack.Screen name="verify/[id]" options={{ title: copy('nav.verify') }} />
          <Stack.Screen
            name="join-channel"
            options={{ title: copy('nav.joinChannel'), presentation: 'modal', animation: 'slide_from_bottom' }}
          />
          <Stack.Screen
            name="new-group"
            options={{ title: copy('nav.newGroup'), presentation: 'modal', animation: 'slide_from_bottom' }}
          />
          <Stack.Screen name="settings" options={{ title: copy('nav.settings') }} />
        </Stack>
        </AppProvider>
      </KeyboardProvider>
  );
}
