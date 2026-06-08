import { DataColumn, DataTable, type DataTableProps, Text } from '@umami/react-zen';
import type { ReactNode } from 'react';
import { useMessages } from '@/components/hooks';
import { ROLES } from '@/lib/constants';

export interface TeamsTableProps extends DataTableProps {
  renderLink?: (row: any) => ReactNode;
}

export function TeamsTable({ renderLink, ...props }: TeamsTableProps) {
  const { t, labels } = useMessages();

  return (
    <DataTable {...props}>
      <DataColumn id="name" label={t(labels.name)} width="2fr">
        {renderLink}
      </DataColumn>
      <DataColumn id="owner" label={t(labels.owner)} width="1.5fr">
        {(row: any) => (
          <Text truncate>
            {row?.members?.find(({ role }) => role === ROLES.teamOwner)?.user?.username || '—'}
          </Text>
        )}
      </DataColumn>
      <DataColumn id="members" label={t(labels.members)} align="end" width="100px">
        {(row: any) => row?._count?.members ?? 0}
      </DataColumn>
      <DataColumn id="websites" label={t(labels.websites)} align="end" width="100px">
        {(row: any) => row?._count?.websites ?? 0}
      </DataColumn>
    </DataTable>
  );
}
