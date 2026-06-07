import { isWithinLimit } from '@/lib/billing';
import { getUserPlanLimits, getWebsiteOwnerId, isSelfHostedBilling } from '@/lib/billing-limits';
import { getMonthlyEventCount } from '@/queries/sql/billing/getMonthlyEventCount';

const CACHE_TTL_MS = 30_000;
const counters = new Map<string, { count: number; syncedAt: number }>();

function getMonthKey(userId: string, date = new Date()) {
  return `${userId}:${date.getUTCFullYear()}-${date.getUTCMonth() + 1}`;
}

async function getCachedMonthlyEventCount(userId: string) {
  const key = getMonthKey(userId);
  const cached = counters.get(key);
  const now = Date.now();

  if (cached && now - cached.syncedAt < CACHE_TTL_MS) {
    return cached.count;
  }

  const count = await getMonthlyEventCount(userId);
  counters.set(key, { count, syncedAt: now });

  return count;
}

export function trackMonthlyEvent(userId: string, amount = 1) {
  const key = getMonthKey(userId);
  const cached = counters.get(key);

  if (cached) {
    cached.count += amount;
  }
}

export async function getOwnerMonthlyEventUsage(userId: string) {
  const { limits } = await getUserPlanLimits(userId);
  const limit = limits.eventsPerMonth;
  const count = await getCachedMonthlyEventCount(userId);

  return {
    count,
    limit,
    limited: limit !== null && !isWithinLimit(count, limit),
  };
}

export async function canCollectWebsiteEvent(website: {
  teamId?: string | null;
  userId?: string | null;
}) {
  if (!isSelfHostedBilling()) {
    return true;
  }

  const ownerId = await getWebsiteOwnerId(website);

  if (!ownerId) {
    return true;
  }

  const { limits } = await getUserPlanLimits(ownerId);

  if (limits.eventsPerMonth === null) {
    return true;
  }

  const count = await getCachedMonthlyEventCount(ownerId);

  return isWithinLimit(count, limits.eventsPerMonth);
}

export async function recordWebsiteEvent(website: {
  teamId?: string | null;
  userId?: string | null;
}) {
  if (!isSelfHostedBilling()) {
    return;
  }

  const ownerId = await getWebsiteOwnerId(website);

  if (ownerId) {
    trackMonthlyEvent(ownerId);
  }
}
