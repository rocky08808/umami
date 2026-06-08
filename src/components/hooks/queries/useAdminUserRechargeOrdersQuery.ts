import type { ReactQueryOptions } from '@/lib/types';
import { useApi } from '../useApi';
import { usePagedQuery } from '../usePagedQuery';

export function useAdminUserRechargeOrdersQuery(
  userId: string,
  options?: ReactQueryOptions,
) {
  const { get } = useApi();

  return usePagedQuery({
    queryKey: ['admin:user:recharge-orders', userId],
    queryFn: (pageParams: Record<string, unknown>) => {
      return get(`/admin/users/${userId}/recharge-orders`, pageParams);
    },
    enabled: !!userId,
    ...options,
  });
}
