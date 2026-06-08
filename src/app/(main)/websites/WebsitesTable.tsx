import { DataColumn, DataTable, type DataTableProps, Icon, Text } from '@umami/react-zen';
import type { ReactNode } from 'react';
import { DateDistance } from '@/components/common/DateDistance';
import { LinkButton } from '@/components/common/LinkButton';
import { useMessages, useNavigation } from '@/components/hooks';
import { SquarePen } from '@/components/icons';

export interface WebsitesTableProps extends DataTableProps {
  showActions?: boolean;
  allowEdit?: boolean;
  allowView?: boolean;
  renderLink?: (row: any) => ReactNode;
}

export function WebsitesTable({ showActions, renderLink, ...props }: WebsitesTableProps) {
  const { t, labels } = useMessages();
  const { renderUrl } = useNavigation();

  return (
    <DataTable {...props}>
      <DataColumn id="name" label={t(labels.name)} width="2fr">
        {renderLink}
      </DataColumn>
      <DataColumn id="domain" label={t(labels.domain)} width="1.5fr">
        {(row: any) => (
          <Text truncate color={row.domain ? undefined : 'muted'}>
            {row.domain || '—'}
          </Text>
        )}
      </DataColumn>
      <DataColumn id="createdBy" label={t(labels.createdBy)} width="140px">
        {(row: any) => (
          <Text truncate color={row?.createUser?.username ? undefined : 'muted'}>
            {row?.createUser?.username || '—'}
          </Text>
        )}
      </DataColumn>
      <DataColumn id="created" label={t(labels.created)} width="180px">
        {(row: any) => row?.createdAt && <DateDistance date={new Date(row.createdAt)} />}
      </DataColumn>
      {showActions && (
        <DataColumn id="action" label=" " align="end" width="50px">
          {(row: any) => {
            const websiteId = row.id;

            return (
              <LinkButton href={renderUrl(`/websites/${websiteId}/settings`)} variant="quiet">
                <Icon>
                  <SquarePen />
                </Icon>
              </LinkButton>
            );
          }}
        </DataColumn>
      )}
    </DataTable>
  );
}
