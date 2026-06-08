import { keepPreviousData } from '@tanstack/react-query';
import { useApi } from '../useApi';
import { useModified } from '../useModified';

export function useRechargeOrdersQuery() {
  const { get } = useApi();
  const { modified } = useModified('recharge-orders');

  return useApi().useQuery({
    queryKey: ['recharge:orders', { modified }],
    queryFn: () => get('/recharge/orders'),
    placeholderData: keepPreviousData,
  });
}
