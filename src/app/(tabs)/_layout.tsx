import { NativeTabs } from 'expo-router/unstable-native-tabs';

import { useTheme } from '@/hooks/use-theme';
import { useI18n } from '@/i18n/provider';

export default function ConversationTabs() {
  const t = useTheme();
  const { t: copy } = useI18n();

  return (
    <NativeTabs
      backgroundColor={t.bg}
      tintColor={t.accent}
      iconColor={{ default: t.textMuted, selected: t.accent }}
      indicatorColor={t.surfaceRaised}
      labelStyle={{ color: t.textMuted, fontSize: 12, fontWeight: '500' }}
      disableTransparentOnScrollEdge>
      <NativeTabs.Trigger name="private">
        <NativeTabs.Trigger.Label>{copy('nav.privateMessages')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="bubble.left.and.bubble.right" md="chat_bubble" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="broadcast">
        <NativeTabs.Trigger.Label>{copy('nav.publicBroadcasts')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="dot.radiowaves.left.and.right" md="campaign" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="forums">
        <NativeTabs.Trigger.Label>{copy('nav.forums')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="text.bubble" md="forum" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
