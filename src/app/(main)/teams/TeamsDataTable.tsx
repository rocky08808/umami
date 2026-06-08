import Link from '@/components/common/Link';
import { Text } from '@umami/react-zen';
import { DataGrid } from '@/components/common/DataGrid';
import { useLoginQuery, useNavigation, useUserTeamsQuery } from '@/components/hooks';
import { TeamsTable } from './TeamsTable';

export function TeamsDataTable() {
  const { user } = useLoginQuery();
  const query = useUserTeamsQuery(user.id);
  const { pathname } = useNavigation();
  const isSettings = pathname.includes('/settings');

  const renderLink = (row: any) => {
    return (
      <Text truncate>
        <Link key={row.id} href={`${isSettings ? '/settings' : ''}/teams/${row.id}`}>
          {row.name}
        </Link>
      </Text>
    );
  };

  return (
    <DataGrid query={query} allowSearch allowPaging>
      {({ data }) => {
        return <TeamsTable data={data} renderLink={renderLink} />;
      }}
    </DataGrid>
  );
}
