import type { Subscription } from '@/components/hooks/useSubscription';
import type { PlanId } from '@/lib/billing';
import { getUserSubscriptionRecord, upsertUserSubscription } from '@/queries/prisma/recharge';

export function planToSubscription(plan: PlanId, expiresAt?: Date | null): Subscription {
  const isActive = plan !== 'hobby' && (!expiresAt || expiresAt > new Date());

  return {
    isPro: isActive && (plan === 'pro' || plan === 'business'),
    isBusiness: isActive && plan === 'business',
    isNoBilling: false,
    hasSubscription: isActive,
  };
}

export async function getUserSubscriptionDetails(userId: string) {
  const record = await getUserSubscriptionRecord(userId);

  if (!record || record.plan === 'hobby') {
    return {
      plan: 'hobby' as PlanId,
      expiresAt: null,
      expired: false,
    };
  }

  const expired = !!record.expiresAt && record.expiresAt < new Date();

  return {
    plan: record.plan as PlanId,
    expiresAt: record.expiresAt?.toISOString() ?? null,
    expired,
  };
}

export async function getUserSubscription(userId: string): Promise<Subscription> {
  const record = await getUserSubscriptionRecord(userId);

  if (!record) {
    return planToSubscription('hobby');
  }

  if (record.expiresAt && record.expiresAt < new Date()) {
    return planToSubscription('hobby');
  }

  return planToSubscription(record.plan as PlanId, record.expiresAt);
}

export async function activateSubscription(
  userId: string,
  plan: PlanId,
  periodDays: number,
) {
  const record = await getUserSubscriptionRecord(userId);
  const now = new Date();
  const baseDate = record?.expiresAt && record.expiresAt > now ? record.expiresAt : now;
  const expiresAt = new Date(baseDate.getTime() + periodDays * 24 * 60 * 60 * 1000);

  await upsertUserSubscription(userId, {
    plan,
    expiresAt,
  });
}
