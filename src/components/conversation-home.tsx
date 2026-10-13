import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';

import { FeatherIcon } from '@/components/feather-icon';
import { Brand } from '@/components/brand';
import { Spacing, Type } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useI18n } from '@/i18n/provider';
import type { MeshStatus } from '@/lib/mesh';

export function ConversationHome({
  title,
  children,
  onCreate,
  createLabel,
  createOptions,
}: {
  title: string;
  children: ReactNode;
  onCreate?: () => void;
  createLabel?: string;
  createOptions?: { addPerson: string; newGroup: string };
}) {
  const t = useTheme();
  const { t: copy } = useI18n();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const compose = () => {
    if (onCreate) return onCreate();
    if (!createOptions) return;
    Alert.alert(copy('home.newConversation'), undefined, [
      { text: createOptions.addPerson, onPress: () => router.push('/add') },
      { text: createOptions.newGroup, onPress: () => router.push('/new-group') },
      { text: copy('common.cancel'), style: 'cancel' },
    ]);
  };

  return (
    <View style={[styles.root, { backgroundColor: t.bg, paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: Spacing.lg,
          paddingTop: Spacing.sm,
          paddingBottom: createLabel ? Spacing.xxxl * 2 : Spacing.xl,
        }}
        keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Brand />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={copy('common.settings')}
            onPress={() => router.push('/settings')}
            hitSlop={6}
            style={({ pressed }) => [styles.iconButton, { opacity: pressed ? 0.6 : 1 }]}>
            <Text style={[Type.calloutStrong, { color: t.accent }]}>{copy('common.settings')}</Text>
          </Pressable>
        </View>
        <Text accessibilityRole="header" style={[Type.display, { color: t.text, marginTop: Spacing.lg, marginBottom: Spacing.lg }]}>{title}</Text>
        {children}
      </ScrollView>
      {createLabel && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={createLabel}
          onPress={compose}
          style={({ pressed }) => [styles.compose, { backgroundColor: pressed ? t.accentPressed : t.accentFill }]}
          hitSlop={4}>
          <FeatherIcon size={26} color={t.onAccentFill} />
        </Pressable>
      )}
    </View>
  );
}

export function RadioState({ status }: { status: MeshStatus }) {
  const t = useTheme();
  const { t: copy, plural } = useI18n();
  const connected = status.connected.length;
  const tone = !status.radioAvailable || !status.running
    ? t.tone.danger.fg
    : connected > 0
      ? t.tone.ok.fg
      : t.tone.caution.fg;
  const label = !status.radioAvailable
    ? copy('status.noRadioState')
    : !status.running
      ? copy('status.offState')
      : connected > 0
        ? plural('status.connectedTitle', connected)
        : copy('status.searchingState');

  return (
    <View style={styles.radioLine} accessibilityLabel={label}>
      <View style={[styles.radioDot, { backgroundColor: tone }]} />
      <Text style={[Type.caption, { color: t.textMuted }]}>{label}</Text>
    </View>
  );
}

export function EmptyConversation({ title, detail }: { title: string; detail: string }) {
  const t = useTheme();
  return (
    <View style={styles.empty}>
      <Text style={[Type.title, { color: t.text }]}>{title}</Text>
      <Text style={[Type.callout, { color: t.textMuted, marginTop: Spacing.xs }]}>{detail}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  iconButton: {
    minWidth: 64,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xs,
    marginRight: -Spacing.sm,
  },
  radioLine: {
    minHeight: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  radioDot: { width: 8, height: 8, borderRadius: 4 },
  empty: { paddingTop: Spacing.xl, paddingHorizontal: Spacing.xs, maxWidth: 440 },
  compose: {
    position: 'absolute',
    right: Spacing.lg,
    bottom: Spacing.md,
    width: 56,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
