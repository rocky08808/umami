'use client';
import { SessionModal } from '@/app/(main)/websites/[websiteId]/sessions/SessionModal';
import { WebsiteControls } from '@/app/(main)/websites/[websiteId]/WebsiteControls';
import { EmptyPlaceholder } from '@/components/common/EmptyPlaceholder';
import { Panel } from '@/components/common/Panel';
import { useMessages, useNavigation, useSubscription, useWebsite } from '@/components/hooks';
import { Video } from '@/components/icons';
import { getItem, setItem } from '@/lib/storage';
import { Button, Column, Tab, TabList, TabPanel, Tabs } from '@umami/react-zen';
import { useRouter } from 'next/navigation';
import { type Key, useState } from 'react';
import { ReplayModal } from './ReplayModal';
import { ReplaysDataTable } from './ReplaysDataTable';
import { SavedReplaysDataTable } from './SavedReplaysDataTable';

const KEY_NAME = 'umami.replays.tab';

export function ReplaysPage({ websiteId }: { websiteId: string }) {
  const [tab, setTab] = useState(getItem(KEY_NAME) || 'replays');
  const website = useWebsite();
  const { t, labels, messages } = useMessages();
  const router = useRouter();
  const { renderUrl } = useNavigation();
  const { hasFeature, cloudMode } = useSubscription(website?.teamId);

  const handleSelect = (value: Key) => {
    setItem(KEY_NAME, value);
    setTab(value);
  };

  if (!hasFeature('replays')) {
    return (
      <Column gap="3">
        <Panel>
          <EmptyPlaceholder
            icon={<Video />}
            title={t(messages.upgradeRequired, { plan: 'Business' })}
            description="Watch real user sessions to see exactly how visitors interact with your site."
          >
            <Button
              variant="primary"
              onPress={() => {
                if (cloudMode) {
                  window.open(`${process.env.cloudUrl}/settings/billing`, '_blank');
                  return;
                }

                router.push(renderUrl('/settings/billing'));
              }}
            >
              {t(labels.upgrade)}
            </Button>
          </EmptyPlaceholder>
        </Panel>
      </Column>
    );
  }

  return (
    <Column gap="3">
      <WebsiteControls websiteId={websiteId} />
      <Panel>
        <Tabs selectedKey={tab} onSelectionChange={handleSelect}>
          <TabList>
            <Tab id="replays">{t(labels.replays)}</Tab>
            <Tab id="saved">{t(labels.saved)}</Tab>
          </TabList>
          <TabPanel id="replays">
            <ReplaysDataTable websiteId={websiteId} />
          </TabPanel>
          <TabPanel id="saved">
            <SavedReplaysDataTable websiteId={websiteId} />
          </TabPanel>
        </Tabs>
      </Panel>
      <SessionModal websiteId={websiteId} />
      <ReplayModal websiteId={websiteId} />
    </Column>
  );
}
