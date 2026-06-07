import { DataGrid } from '@/components/common/DataGrid';
import { useAdminRechargeOrdersQuery } from '@/components/hooks';
import { RECHARGE_ORDER_STATUS } from '@/lib/recharge';
import { AdminRechargeOrdersCards } from './AdminRechargeOrdersCards';
import { AdminRechargeOrdersTable } from './AdminRechargeOrdersTable';

export function AdminRechargeOrdersDataTable({ status }: { status: string }) {
  const queryResult = useAdminRechargeOrdersQuery(status);
  const isPending = status === RECHARGE_ORDER_STATUS.pending;

  return (
    <DataGrid query={queryResult} allowSearch={!isPending}>
      {({ data }) =>
        isPending ? (
          <AdminRechargeOrdersCards data={data} />
        ) : (
          <AdminRechargeOrdersTable data={data} />
        )
      }
    </DataGrid>
  );
}
