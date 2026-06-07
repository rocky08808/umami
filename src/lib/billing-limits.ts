import type { Subscription } from '@/components/hooks/useSubscription';
import { getCurrentPlanId, getPlanLimits, isWithinLimit, type PlanId } from '@/lib/billing';

export { isWithinLimit };
import { getUserSubscription, planToSubscription } from '@/lib/subscription';
import { getTeamOwner } from '@/queries/prisma/team';

export function isSelfHostedBilling() {
  return !process.env.CLOUD_MODE;
}

export function getSubscriptionPlanId(subscription: Subscription): PlanId {
  return getCurrentPlanId(subscription);
}

export async function getUserPlanLimits(userId: string) {
  const subscription = await getUserSubscription(userId);
  const planId = getSubscriptionPlanId(subscription);

  return {
    planId,
    limits: getPlanLimits(planId),
    subscription,
  };
}

export async function getWebsiteOwnerId(website: {
  teamId?: string | null;
  userId?: string | null;
}) {
  if (website.teamId) {
    const owner = await getTeamOwner(website.teamId);
    return owner?.userId ?? null;
  }

  return website.userId ?? null;
}

export async function getWebsiteOwnerSubscription(website: {
  teamId?: string | null;
  userId?: string | null;
}) {
  const userId = await getWebsiteOwnerId(website);

  if (!userId) {
    return planToSubscription('hobby');
  }

  return getUserSubscription(userId);
}
