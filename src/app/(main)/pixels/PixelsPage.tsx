'use client';
import { Column } from '@umami/react-zen';
import { PageBody } from '@/components/common/PageBody';
import { PageHeader } from '@/components/common/PageHeader';
import { Panel } from '@/components/common/Panel';
import { useMessages, useNavigation, useTeamActionsAllowed } from '@/components/hooks';
import { PixelAddButton } from './PixelAddButton';
import { PixelsDataTable } from './PixelsDataTable';

export function PixelsPage() {
  const { t, labels } = useMessages();
  const { teamId } = useNavigation();
  const showActions = useTeamActionsAllowed(teamId);

  return (
    <PageBody>
      <Column gap="6" margin="2">
        <PageHeader title={t(labels.pixels)}>
          {showActions && <PixelAddButton teamId={teamId} />}
        </PageHeader>
        <Panel>
          <PixelsDataTable showActions={showActions} />
        </Panel>
      </Column>
    </PageBody>
  );
}
