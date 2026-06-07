'use client';
import { Column } from '@umami/react-zen';
import { PageBody } from '@/components/common/PageBody';
import { PageHeader } from '@/components/common/PageHeader';
import { Panel } from '@/components/common/Panel';
import { useMessages, useNavigation, useTeamActionsAllowed } from '@/components/hooks';
import { WebsiteAddButton } from './WebsiteAddButton';
import { WebsitesDataTable } from './WebsitesDataTable';

export function WebsitesPage() {
  const { teamId } = useNavigation();
  const { t, labels } = useMessages();
  const showActions = useTeamActionsAllowed(teamId);

  return (
    <PageBody>
      <Column gap="6" margin="2">
        <PageHeader title={t(labels.websites)}>
          {showActions && <WebsiteAddButton teamId={teamId} />}
        </PageHeader>
        <Panel>
          <WebsitesDataTable teamId={teamId} showActions={showActions} />
        </Panel>
      </Column>
    </PageBody>
  );
}
