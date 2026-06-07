import { useConfig } from './useConfig';
import { useLoginQuery } from './queries/useLoginQuery';
import { useTeamMembersQuery } from './queries/useTeamMembersQuery';
import { useUserWebsitesQuery } from './queries/useUserWebsitesQuery';
import { useSubscription } from './useSubscription';
import { getCurrentPlanId, getPlanLimits, isWithinLimit } from '@/lib/billing';

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
