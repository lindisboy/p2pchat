import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { Text, View } from 'react-native';

import { ConversationHome } from '@/components/conversation-home';
import { Leading, List, Row, Tag } from '@/components/ui';
import { Spacing, Type } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useI18n } from '@/i18n/provider';
import { useApp } from '@/lib/app-state';

export default function BroadcastScreen() {
  const t = useTheme();
  const router = useRouter();
  const { t: copy } = useI18n();
  const { channels, conversations, refresh } = useApp();
  useFocusEffect(useCallback(() => { void refresh(); }, [refresh]));

  const publicRoom = channels.find((channel) => channel.kind === 'public');
  const latest = useMemo(() => new Map(conversations.map((item) => [item.peerId, item])), [conversations]);
  const conversation = latest.get('#public');

  return (
    <ConversationHome title={copy('home.broadcastTitle')}>
      <View style={{ paddingHorizontal: Spacing.xs, marginBottom: Spacing.md }}>
        <View style={{ alignSelf: 'flex-start' }}>
          <Tag tone="danger" label={copy('home.notPrivate')} />
        </View>
        <Text style={[Type.callout, { color: t.textMuted, marginTop: Spacing.sm }]}>
          {copy('home.publicBroadcastDetail')}
        </Text>
      </View>
      {publicRoom && (
        <List flat>
          <Row
            title={copy('home.everyoneNearby')}
            subtitle={conversation?.lastText ?? copy('common.noMessages')}
            unread={conversation?.unread ?? 0}
            leading={<Leading kind="broadcast" />}
            accessibilityLabel={copy('home.everyoneNearbyA11y')}
            onPress={() => router.push(`/chat/${encodeURIComponent('#public')}`)}
          />
        </List>
      )}
    </ConversationHome>
  );
}
