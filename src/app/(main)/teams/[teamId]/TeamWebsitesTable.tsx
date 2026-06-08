import { DataColumn, DataTable, Icon, Row, Text } from '@umami/react-zen';
import Link from '@/components/common/Link';
import { DateDistance } from '@/components/common/DateDistance';
import { useMessages, useNavigation } from '@/components/hooks';
import { Favicon } from '@/index';

export function TeamWebsitesTable({ data = [] }: { data: any[] }) {
  const { t, labels } = useMessages();
  const { renderUrl } = useNavigation();

  return (
    <DataTable data={data}>
      <DataColumn id="name" label={t(labels.name)} width="2fr">
        {(row: any) => (
          <Row alignItems="center" gap="3">
            <Icon size="md" color="muted">
              <Favicon domain={row.domain} />
            </Icon>
            <Text truncate>
              <Link href={renderUrl(`/websites/${row.id}`, false)}>{row.name}</Link>
            </Text>
          </Row>
        )}
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
    </DataTable>
  );
}
