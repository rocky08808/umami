import { useApi } from '../useApi';
import { useConfig } from '../useConfig';

export function useBillingUsageQuery() {
  const { get, useQuery } = useApi();
  const config = useConfig();

  return useQuery({
    queryKey: ['billing:usage'],
    queryFn: () => get('/billing/usage'),
    enabled: !config?.cloudMode,
  });
}
