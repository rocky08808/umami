import { getCurrentPlanId, getPlanLimits, isWithinLimit } from '@/lib/billing';
import { useApi } from './useApi';
import { useBillingUsageQuery } from './queries/useBillingUsageQuery';
import { useConfig } from './useConfig';
import { useLoginQuery } from './queries/useLoginQuery';
import { useTeamMembersQuery } from './queries/useTeamMembersQuery';
import { useUserWebsitesQuery } from './queries/useUserWebsitesQuery';
import { useSubscription } from './useSubscription';

function useBillingEnabled() {
  const config = useConfig();
  return !config?.cloudMode;
}

export function useWebsiteLimitStatus(teamId?: string) {
  const billingEnabled = useBillingEnabled();
  const { user } = useLoginQuery();
  const subscription = useSubscription(teamId);
  const { data } = useUserWebsitesQuery({ userId: user?.id, teamId });

  if (!billingEnabled) {
    return { limited: false, limit: null, count: 0 };
  }

  const limits = getPlanLimits(getCurrentPlanId(subscription));
  const count = data?.count ?? 0;
  const limit = limits.websites;

  return {
    limited: !isWithinLimit(count, limit),
    limit,
    count,
  };
}

export function useTeamMemberLimitStatus(teamId: string) {
  const billingEnabled = useBillingEnabled();
  const subscription = useSubscription(teamId);
  const { data } = useTeamMembersQuery(teamId);

  if (!billingEnabled || !teamId) {
    return { limited: false, limit: null, count: 0 };
  }

  const limits = getPlanLimits(getCurrentPlanId(subscription));
  const count = data?.count ?? 0;
  const limit = limits.teamMembers;

  return {
    limited: !isWithinLimit(count, limit),
    limit,
    count,
  };
}

export function useTeamJoinLimitStatus(accessCode: string) {
  const billingEnabled = useBillingEnabled();
  const { get, useQuery } = useApi();

  const { data } = useQuery({
    queryKey: ['teams:join:limit', accessCode],
    queryFn: () => get('/teams/join', { accessCode }),
    enabled: billingEnabled && accessCode.length >= 10,
    retry: false,
  });

  return {
    limited: data?.limited ?? false,
    limit: data?.limit ?? null,
    count: data?.count ?? 0,
  };
}

export function useEventLimitStatus() {
  const billingEnabled = useBillingEnabled();
  const { data } = useBillingUsageQuery();

  if (!billingEnabled || !data?.events) {
    return { limited: false, limit: null, count: 0 };
  }

  return {
    limited: data.events.limited,
    limit: data.events.limit,
    count: data.events.count,
  };
}
