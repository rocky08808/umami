import { parseDateRange } from '@/lib/date';
import { useApi } from '../useApi';

export const DEFAULT_ADMIN_STATS_DATE_RANGE = '0month';

export function useAdminStatsQuery(dateRange = DEFAULT_ADMIN_STATS_DATE_RANGE) {
  const { get, useQuery } = useApi();
  const range =
    parseDateRange(dateRange) || parseDateRange(DEFAULT_ADMIN_STATS_DATE_RANGE);
  const startAt = +range.startDate;
  const endAt = +range.endDate;

  return useQuery({
    queryKey: ['admin:stats', { startAt, endAt }],
    queryFn: () => get('/admin/stats', { startAt, endAt }),
    enabled: Boolean(startAt && endAt),
  });
}
