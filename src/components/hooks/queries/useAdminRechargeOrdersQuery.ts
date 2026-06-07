import { useApi } from '../useApi';
import { useModified } from '../useModified';
import { usePagedQuery } from '../usePagedQuery';

export function useAdminRechargeOrdersQuery(status?: string) {
  const { get } = useApi();
  const { modified } = useModified('admin-recharge-orders');

  return usePagedQuery({
    queryKey: ['recharge:admin-orders', { modified, status }],
    queryFn: (pageParams: any) => {
      return get('/admin/recharge/orders', {
        ...pageParams,
        status,
      });
    },
  });
}
