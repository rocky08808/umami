import { DataGrid } from '@/components/common/DataGrid';
import { useAdminRechargeOrdersQuery } from '@/components/hooks';
import { AdminRechargeOrdersTable } from './AdminRechargeOrdersTable';

export function AdminRechargeOrdersDataTable({ status }: { status: string }) {
  const queryResult = useAdminRechargeOrdersQuery(status);

  return (
    <DataGrid query={queryResult} allowSearch>
      {({ data }) => <AdminRechargeOrdersTable data={data} />}
    </DataGrid>
  );
}
