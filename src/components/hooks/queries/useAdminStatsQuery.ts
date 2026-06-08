import { useApi } from '../useApi';

export function useAdminStatsQuery() {
  const { get, useQuery } = useApi();

  return useQuery({
    queryKey: ['admin:stats'],
    queryFn: () => get('/admin/stats'),
  });
}
