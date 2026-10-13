import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo } from 'react';

import { ConversationHome, EmptyConversation, RadioState } from '@/components/conversation-home';
import { Leading, List, Row } from '@/components/ui';
import { useI18n } from '@/i18n/provider';
import { useApp } from '@/lib/app-state';

export default function PrivateMessagesScreen() {
  const router = useRouter();
  const { t: copy, plural } = useI18n();
  const { status, contacts, conversations, groups, refresh, ready } = useApp();

  useFocusEffect(useCallback(() => { void refresh(); }, [refresh]));

  const latest = useMemo(() => new Map(conversations.map((item) => [item.peerId, item])), [conversations]);
  const entries = [
    ...groups.map((group) => ({
      id: `~${group.id}`,
      sortAt: latest.get(`~${group.id}`)?.lastAt ?? 0,
      title: group.name,
      subtitle: latest.get(`~${group.id}`)?.lastText ?? plural('home.groupPeople', group.members.length),
      unread: latest.get(`~${group.id}`)?.unread ?? 0,
      leading: <Leading kind="group" name={group.name} />,
      accessibilityLabel: undefined as string | undefined,
    })),
    ...contacts.map((contact) => ({
      id: contact.publicId,
      sortAt: latest.get(contact.publicId)?.lastAt ?? 0,
      title: contact.name,
      subtitle: latest.get(contact.publicId)?.lastText ?? (contact.verified ? copy('common.verified') : copy('common.unverified')),
      unread: latest.get(contact.publicId)?.unread ?? 0,
      leading: <Leading kind="person" name={contact.name} />,
      accessibilityLabel: copy(contact.verified ? 'home.contactA11y.verified' : 'home.contactA11y.unverified', { name: contact.name }),
    })),
  ].sort((a, b) => b.sortAt - a.sortAt);

  return (
    <ConversationHome
      title={copy('home.privateTitle')}
      createLabel={copy('home.newConversation')}
      createOptions={{ addPerson: copy('common.addPerson'), newGroup: copy('home.makeGroup') }}>
      <RadioState status={status} />
      {entries.length > 0 ? (
        <List flat>
          {entries.map((entry) => (
            <Row
              key={entry.id}
              title={entry.title}
              subtitle={entry.subtitle}
              unread={entry.unread}
              leading={entry.leading}
              accessibilityLabel={entry.accessibilityLabel}
              onPress={() => router.push(`/chat/${encodeURIComponent(entry.id)}`)}
            />
          ))}
        </List>
      ) : (
        <EmptyConversation
          title={ready ? copy('home.privateEmptyTitle') : copy('common.starting')}
          detail={copy('home.emptyChats')}
        />
      )}
    </ConversationHome>
  );
}
