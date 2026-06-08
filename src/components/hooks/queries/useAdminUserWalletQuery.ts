import { useApi } from '../useApi';

export function useAdminUserWalletQuery(userId?: string) {
  const { get, useQuery } = useApi();

  return useQuery({
    queryKey: ['admin:wallet', userId],
    queryFn: () => get(`/admin/wallet/${userId}`, { limit: 50 }),
    enabled: !!userId,
  });
}
