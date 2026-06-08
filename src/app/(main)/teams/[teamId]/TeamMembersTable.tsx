import { DataColumn, DataTable, Row, Text } from '@umami/react-zen';
import { DateDistance } from '@/components/common/DateDistance';
import { useMessages } from '@/components/hooks';
import { ROLES } from '@/lib/constants';
import { TeamMemberEditButton } from './TeamMemberEditButton';
import { TeamMemberRemoveButton } from './TeamMemberRemoveButton';

export function TeamMembersTable({
  data = [],
  teamId,
  allowEdit = false,
}: {
  data: any[];
  teamId: string;
  allowEdit: boolean;
}) {
  const { t, labels } = useMessages();

  const roles = {
    [ROLES.teamOwner]: t(labels.teamOwner),
    [ROLES.teamManager]: t(labels.teamManager),
    [ROLES.teamMember]: t(labels.teamMember),
    [ROLES.teamViewOnly]: t(labels.viewOnly),
  };

  return (
    <DataTable data={data}>
      <DataColumn id="username" label={t(labels.username)} width="2fr">
        {(row: any) => <Text truncate>{row?.user?.username}</Text>}
      </DataColumn>
      <DataColumn id="role" label={t(labels.role)} width="160px">
        {(row: any) => roles[row?.role]}
      </DataColumn>
      <DataColumn id="created" label={t(labels.created)} width="180px">
        {(row: any) => row?.createdAt && <DateDistance date={new Date(row.createdAt)} />}
      </DataColumn>
      {allowEdit && (
        <DataColumn id="action" align="end" width="100px">
          {(row: any) => {
            if (row?.role === ROLES.teamOwner) {
              return null;
            }

            return (
              <Row alignItems="center" maxHeight="20px">
                <TeamMemberEditButton teamId={teamId} userId={row?.user?.id} role={row?.role} />
                <TeamMemberRemoveButton
                  teamId={teamId}
                  userId={row?.user?.id}
                  userName={row?.user?.username}
                />
              </Row>
            );
          }}
        </DataColumn>
      )}
    </DataTable>
  );
}
