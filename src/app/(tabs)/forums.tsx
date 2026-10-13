import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo } from 'react';

import { ConversationHome, EmptyConversation } from '@/components/conversation-home';
import { Leading, List, Row, Tag } from '@/components/ui';
import { useI18n } from '@/i18n/provider';
import { useApp } from '@/lib/app-state';

export default function ForumsScreen() {
  const router = useRouter();
  const { t: copy } = useI18n();
  const { channels, conversations, refresh, ready } = useApp();
  useFocusEffect(useCallback(() => { void refresh(); }, [refresh]));

  const latest = useMemo(() => new Map(conversations.map((item) => [item.peerId, item])), [conversations]);
  const forums = channels
    .filter((channel) => channel.kind === 'channel')
    .map((channel) => ({
      id: `#${channel.id}`,
      sortAt: latest.get(`#${channel.id}`)?.lastAt ?? 0,
      title: `#${channel.name}`,
      subtitle: latest.get(`#${channel.id}`)?.lastText ?? copy('common.noMessages'),
      unread: latest.get(`#${channel.id}`)?.unread ?? 0,
    }))
    .sort((a, b) => b.sortAt - a.sortAt);

  return (
    <ConversationHome
      title={copy('home.forumsTitle')}
      createLabel={copy('home.joinChannel')}
      onCreate={() => router.push('/join-channel')}>
      {forums.length > 0 ? (
        <List flat>
          {forums.map((forum) => (
            <Row
              key={forum.id}
              title={forum.title}
              subtitle={forum.subtitle}
              unread={forum.unread}
              leading={<Leading kind="channel" />}
              tag={<Tag tone="caution" label={copy('home.sharedKey')} />}
              onPress={() => router.push(`/chat/${encodeURIComponent(forum.id)}`)}
            />
          ))}
        </List>
      ) : (
        <EmptyConversation
          title={ready ? copy('home.noForumsTitle') : copy('common.starting')}
          detail={copy('home.noForumsDetail')}
        />
      )}
    </ConversationHome>
  );
}
