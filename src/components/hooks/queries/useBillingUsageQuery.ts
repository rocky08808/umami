import { parseDateRange } from '@/lib/date';
import { useApi } from '../useApi';
import { useConfig } from '../useConfig';

export const DEFAULT_USAGE_DATE_RANGE = '0month';

export function useBillingUsageQuery(dateRange = DEFAULT_USAGE_DATE_RANGE) {
  const { get, useQuery } = useApi();
  const config = useConfig();
  const range =
    parseDateRange(dateRange) || parseDateRange(DEFAULT_USAGE_DATE_RANGE);
  const startAt = +range.startDate;
  const endAt = +range.endDate;

  return useQuery({
    queryKey: ['billing:usage', { startAt, endAt }],
    queryFn: () => get('/billing/usage', { startAt, endAt }),
    enabled: !config?.cloudMode && Boolean(startAt && endAt),
  });
}
