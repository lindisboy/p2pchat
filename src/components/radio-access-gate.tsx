import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { ActivityIndicator, AppState, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Brand } from '@/components/brand';
import { StatusBar } from 'expo-status-bar';
import { Button } from '@/components/ui';
import { Colors, Radius, Spacing, Type } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useI18n } from '@/i18n/provider';
import {
  getRadioAccessStatus,
  openAppSettings,
  requestRadioAccess,
  subscribeToRadioAccess,
} from '@/lib/radio-access';
import type { BleState, BleStatus } from '../../modules/ble-mesh/src/BleMesh.types';

type GateCopy = {
  title: string;
  detail: string;
  action?: string;
};

function copyFor(
  status: BleStatus | null,
  appReady: boolean,
  permissionRequested: boolean,
  copy: ReturnType<typeof useI18n>['t'],
): GateCopy {
  if (!appReady) {
    return { title: copy('radio.preparingTitle'), detail: copy('radio.preparingDetail') };
  }
  switch (status?.state) {
    case 'unauthorized':
      if (!permissionRequested) {
        return {
          title: copy('radio.consentTitle'),
          detail: copy('radio.consentDetail'),
          action: copy('radio.allowNearby'),
        };
      }
      return {
        title: copy('radio.permissionTitle'),
        detail: copy('radio.permissionDetail'),
        action: copy('radio.openSettings'),
      };
    case 'poweredOff':
      return {
        title: copy('radio.powerTitle'),
        detail:
          Platform.OS === 'ios'
            ? copy('radio.powerIosDetail')
            : copy('radio.powerAndroidDetail'),
        action: Platform.OS === 'ios' ? copy('radio.openSettings') : copy('radio.powerAction'),
      };
    case 'locationOff':
      return {
        title: copy('radio.locationTitle'),
        detail: copy('radio.locationDetail'),
        action: copy('radio.locationAction'),
      };
    case 'unsupported':
      return {
        title: copy('radio.unavailableTitle'),
        detail: copy('radio.unavailableDetail'),
      };
    case 'resetting':
      return { title: copy('radio.restartingTitle'), detail: copy('radio.restartingDetail') };
    default:
      return { title: copy('radio.checkingTitle'), detail: copy('radio.checkingDetail') };
  }
}

export function RadioAccessGate({
  appReady,
  startRadio,
  children,
}: {
  appReady: boolean;
  startRadio: () => Promise<void>;
  children: ReactNode;
}) {
  const t = useTheme();
  const { t: copyText } = useI18n();
  const insets = useSafeAreaInsets();
  const [status, setStatus] = useState<BleStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [permissionRequested, setPermissionRequested] = useState(false);
  const [admitted, setAdmitted] = useState(false);
  const promptedState = useRef<BleState | null>(null);
  const mounted = useRef(true);

  const acceptStatus = useCallback(
    async (next: BleStatus) => {
      if (!mounted.current) return;
      setStatus(next);
      if (next.state !== 'ready') {
        return;
      }
      await startRadio();
      if (mounted.current) setAdmitted(true);
    },
    [startRadio],
  );

  const request = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    setPermissionRequested(true);
    try {
      const next = await requestRadioAccess();
      promptedState.current = next.state;
      await acceptStatus(next);
    } finally {
      if (mounted.current) setBusy(false);
    }
  }, [acceptStatus, busy]);

  useEffect(() => {
    mounted.current = true;
    if (!appReady) return () => { mounted.current = false; };

    const unsubscribe = subscribeToRadioAccess((next) => {
      void acceptStatus(next);
    });
    const appStateSubscription = AppState.addEventListener('change', (next) => {
      if (next === 'active') void getRadioAccessStatus().then(acceptStatus);
    });
    void getRadioAccessStatus().then(acceptStatus);

    return () => {
      mounted.current = false;
      unsubscribe();
      appStateSubscription.remove();
    };
  }, [acceptStatus, appReady]);

  useEffect(() => {
    if (
      !appReady ||
      !status ||
      busy ||
      status.state === 'ready' ||
      status.state === 'resetting' ||
      status.state === 'unsupported' ||
      status.state === 'unauthorized' ||
      status.state === 'poweredOff' ||
      promptedState.current === status.state
    ) {
      return;
    }
    promptedState.current = status.state;
    void request();
  }, [appReady, busy, request, status]);

  if (appReady && admitted) return children;

  const copy = copyFor(status, appReady, permissionRequested, copyText);
  const openSettings = (status?.state === 'unauthorized' && permissionRequested) ||
    (Platform.OS === 'ios' && status?.state === 'poweredOff');

  return (
    <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: insets.top, paddingBottom: insets.bottom }}>
    <ScrollView
      accessibilityViewIsModal
      style={{ flex: 1, backgroundColor: t.bg }}
      contentContainerStyle={[
        styles.root,
        {
          backgroundColor: t.bg,
          paddingTop: Spacing.xxl,
          paddingBottom: Spacing.xl,
        },
      ]}>
      <StatusBar style={t.bg === Colors.dark.bg ? 'light' : 'dark'} />
      <View style={styles.content}>
        <Brand texture />
        <Text accessibilityRole="header" style={[Type.hero, styles.center, { color: t.text }]}>
          {copy.title}
        </Text>
        <Text style={[Type.body, styles.center, { color: t.textMuted }]}>{copy.detail}</Text>
        {(busy || !status || !appReady || status.state === 'resetting') && (
          <ActivityIndicator color={t.accent} size="large" style={styles.progress} />
        )}
      </View>

      <View style={{ gap: Spacing.sm }}>
      {!!copy.action && !busy && (
        <Button
          title={copy.action}
          onPress={() => {
            if (openSettings) void openAppSettings();
            else void request();
          }}
        />
      )}
      {appReady && !busy && status?.state !== 'resetting' && (
        <Button title={copyText('radio.offlineAction')} variant="secondary" onPress={() => setAdmitted(true)} />
      )}
      </View>
    </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    justifyContent: 'space-between',
  },
  content: {
    flexGrow: 1,
    flexShrink: 0,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.lg,
  },
  icon: {
    width: 72,
    height: 72,
    borderRadius: Radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  bluetooth: {
    fontSize: 36,
    fontWeight: '700',
  },
  center: {
    textAlign: 'center',
    maxWidth: 360,
  },
  progress: {
    marginTop: Spacing.md,
  },
});
