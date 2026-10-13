import { useCallback, useEffect, useState, type ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import {
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { Radius, Spacing, TAP_TARGET, Type } from '@/constants/theme';
import { useIsDark, useTheme } from '@/hooks/use-theme';
import { useI18n } from '@/i18n/provider';
import { clearAccessPins, hasAccessPin, verifyAccessPin } from '@/lib/access-pin';
import { destroyIdentity } from '@/lib/crypto';
import * as db from '@/lib/db';

import { Input } from './ui';

const DISPLAY_NAME_KEY = 'protestchat.displayName.v1';

export function AccessGate({ children }: { children: ReactNode }) {
  const { t: copy } = useI18n();
  const t = useTheme();
  const isDark = useIsDark();
  const [checking, setChecking] = useState(true);
  const [required, setRequired] = useState(false);
  const [allowed, setAllowed] = useState(false);
  const [closed, setClosed] = useState(false);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [pinFocused, setPinFocused] = useState(false);
  const [submitFocused, setSubmitFocused] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setChecking(true);
    setError('');
    try {
      const configured = await hasAccessPin();
      setRequired(configured);
      setAllowed(!configured);
    } catch {
      setError(copy('auth.loadError'));
    } finally {
      setChecking(false);
    }
  }, [copy]);

  useEffect(() => {
    let mounted = true;
    void hasAccessPin()
      .then((configured) => {
        if (!mounted) return;
        setRequired(configured);
        setAllowed(!configured);
      })
      .catch(() => {
        if (mounted) setError(copy('auth.loadError'));
      })
      .finally(() => {
        if (mounted) setChecking(false);
      });
    return () => {
      mounted = false;
    };
  }, [copy]);

  const submit = async () => {
    if (submitting || checking) return;
    setSubmitting(true);
    setError('');
    try {
      const result = await verifyAccessPin(pin);
      setPin('');
      if (result === 'normal') {
        setAllowed(true);
        return;
      }
      if (result === 'decoy') {
        setClosed(true);
        let databaseErased = false;
        try {
          await db.eraseDatabaseForDuress();
          databaseErased = true;
        } catch {
          // Keep the gate closed; the credentials stay so a later attempt can retry.
        }
        let identityErased = false;
        let displayNameErased = false;
        try {
          await destroyIdentity();
          identityErased = true;
        } catch {
          // Keep the decoy response generic and continue every erase step.
        }
        try {
          await SecureStore.deleteItemAsync(DISPLAY_NAME_KEY);
          displayNameErased = true;
        } catch {
          // Keep the decoy response generic and continue every erase step.
        }
        if (databaseErased && identityErased && displayNameErased) {
          try {
            await clearAccessPins();
          } catch {
            // A later decoy attempt can retry key and credential cleanup.
          }
        }
        if (Platform.OS === 'android') BackHandler.exitApp();
        return;
      }
      setError(result === 'locked' ? copy('auth.wait') : copy('auth.invalid'));
    } catch {
      setPin('');
      setError(copy('auth.loadError'));
    } finally {
      setSubmitting(false);
    }
  };

  if (allowed) return <>{children}</>;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboard}>
        <View style={styles.content}>
          {closed ? (
            <Text accessibilityRole="header" style={[styles.title, { color: t.text }]}>
              {copy('auth.closed')}
            </Text>
          ) : (
            <>
              <Text accessibilityRole="header" style={[styles.title, { color: t.text }]}>
                {checking ? copy('auth.loading') : copy('auth.heading')}
              </Text>
              {required && !checking && (
                <>
                  <Text style={[styles.label, { color: t.text }]}>{copy('auth.pinLabel')}</Text>
                  <Input
                    value={pin}
                    onChangeText={(value) => setPin(value.replace(/\D/g, '').slice(0, 6))}
                    keyboardType="number-pad"
                    secureTextEntry
                    maxLength={6}
                    editable={!checking}
                    accessibilityLabel={copy('auth.pinLabel')}
                    autoFocus
                    onFocus={() => setPinFocused(true)}
                    onBlur={() => setPinFocused(false)}
                    onSubmitEditing={() => void submit()}
                    returnKeyType="done"
                    style={[
                      styles.input,
                      { color: t.text, backgroundColor: t.surface, borderColor: t.borderStrong },
                      pinFocused && { borderColor: t.accent, borderWidth: 2 },
                    ]}
                  />
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ disabled: pin.length !== 6 || checking || submitting }}
                    disabled={pin.length !== 6 || checking || submitting}
                    onPress={() => void submit()}
                    onFocus={() => setSubmitFocused(true)}
                    onBlur={() => setSubmitFocused(false)}
                    style={({ pressed }) => [
                      styles.button,
                      { backgroundColor: t.accentFill, borderColor: t.borderStrong },
                      (pin.length !== 6 || checking || submitting) && styles.buttonDisabled,
                      submitFocused && { borderColor: t.accent, borderWidth: 2 },
                      pressed && styles.pressed,
                    ]}>
                    <Text style={[styles.buttonText, { color: t.onAccentFill }]}>{copy('auth.submit')}</Text>
                  </Pressable>
                </>
              )}
              {!!error && (
                <Text accessibilityRole="alert" style={[styles.error, { color: t.tone.danger.fg }]}>
                  {error}
                </Text>
              )}
              {!!error && (
                <Pressable accessibilityRole="button" onPress={() => void load()}>
                  <Text style={[styles.retry, { color: t.accent }]}>{copy('auth.retry')}</Text>
                </Pressable>
              )}
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  keyboard: { flex: 1, justifyContent: 'center' },
  content: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    padding: Spacing.xl,
    gap: Spacing.lg,
  },
  title: { ...Type.hero, marginBottom: Spacing.md },
  label: { ...Type.bodyStrong },
  input: {
    minHeight: TAP_TARGET,
    fontSize: Type.title.fontSize,
    letterSpacing: 8,
  },
  button: {
    minHeight: TAP_TARGET,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
    borderWidth: 2,
  },
  buttonDisabled: { opacity: 0.4 },
  pressed: { opacity: 0.72 },
  buttonText: { ...Type.bodyStrong },
  error: { ...Type.callout },
  retry: { ...Type.body, minHeight: TAP_TARGET, textAlignVertical: 'center' },
});
