import type { ReactQueryOptions } from '@/lib/types';
import { useApi } from '../useApi';
import { useModified } from '../useModified';
import { usePagedQuery } from '../usePagedQuery';

export function useTeamAvailableUsersQuery(
  teamId?: string,
  params?: Record<string, any>,
  options?: ReactQueryOptions,
) {
  const { modified } = useModified('teams:members');
  const { get } = useApi();

  return usePagedQuery({
    queryKey: ['teams:available-users', { teamId, modified, ...params }],
    queryFn: pageParams => {
      return get(`/teams/${teamId}/users/available`, {
        ...pageParams,
        ...params,
      });
    },
    enabled: !!teamId,
    ...options,
  });
}
