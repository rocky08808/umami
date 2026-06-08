import type { ReactQueryOptions } from '@/lib/types';
import { useApi } from '../useApi';
import { useModified } from '../useModified';
import { usePagedQuery } from '../usePagedQuery';

export function useUserTeamsQuery(userId: string, options?: ReactQueryOptions) {
  const { get } = useApi();
  const { modified } = useModified(`teams`);

  return usePagedQuery({
    queryKey: ['teams', { userId, modified }],
    queryFn: pageParams => {
      return get(`/users/${userId}/teams`, pageParams);
    },
    enabled: !!userId,
    ...options,
  });
}
