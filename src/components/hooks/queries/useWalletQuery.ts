import { useApi } from '../useApi';
import { useModified } from '../useModified';

export function useWalletQuery() {
  const { get } = useApi();
  const { modified } = useModified('wallet');

  return useApi().useQuery({
    queryKey: ['wallet', { modified }],
    queryFn: () => get('/wallet'),
  });
}
