'use client';
import { Column } from '@umami/react-zen';
import { LinksDataTable } from '@/app/(main)/links/LinksDataTable';
import { PageBody } from '@/components/common/PageBody';
import { PageHeader } from '@/components/common/PageHeader';
import { Panel } from '@/components/common/Panel';
import { useMessages, useNavigation, useTeamActionsAllowed } from '@/components/hooks';
import { LinkAddButton } from './LinkAddButton';

export function LinksPage() {
  const { t, labels } = useMessages();
  const { teamId } = useNavigation();
  const showActions = useTeamActionsAllowed(teamId);

  return (
    <PageBody>
      <Column gap="6" margin="2">
        <PageHeader title={t(labels.links)}>
          {showActions && <LinkAddButton teamId={teamId} />}
        </PageHeader>
        <Panel>
          <LinksDataTable showActions={showActions} />
        </Panel>
      </Column>
    </PageBody>
  );
}
