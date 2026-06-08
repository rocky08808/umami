import { DataGrid } from '@/components/common/DataGrid';
import { useTeamWebsitesQuery } from '@/components/hooks';
import { TeamWebsitesTable } from './TeamWebsitesTable';

export function TeamWebsitesDataTable({ teamId }: { teamId: string }) {
  const queryResult = useTeamWebsitesQuery(teamId);

  return (
    <DataGrid query={queryResult} allowSearch allowPaging>
      {({ data }) => <TeamWebsitesTable data={data} />}
    </DataGrid>
  );
}
