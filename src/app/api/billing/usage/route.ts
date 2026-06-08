import { endOfDay, startOfDay } from 'date-fns';
import { z } from 'zod';
import { getBillingPeriod } from '@/lib/billing-usage';
import { getOwnerMonthlyEventUsage } from '@/lib/billing-events';
import { getOwnerWebsiteUsage, isSelfHostedBilling } from '@/lib/billing-limits';
import { parseRequest } from '@/lib/request';
import { json } from '@/lib/response';
import { getUserSubscriptionDetails } from '@/lib/subscription';
import { getOwnerUsageMetrics } from '@/queries/sql/billing/getOwnerUsageMetrics';
import { getOwnerWebsiteEventUsage } from '@/queries/sql/billing/getOwnerWebsiteEventUsage';

const schema = z.object({
  startAt: z.coerce.number().optional(),
  endAt: z.coerce.number().optional(),
});

export async function GET(request: Request) {
  const { auth, query, error } = await parseRequest(request, schema);

  if (error) {
    return error();
  }

  if (!isSelfHostedBilling()) {
    return json({
      subscription: null,
      events: null,
      websites: null,
      period: null,
      metrics: null,
      sources: [],
    });
  }

  const [subscription, events, websites] = await Promise.all([
    getUserSubscriptionDetails(auth.user.id),
    getOwnerMonthlyEventUsage(auth.user.id),
    getOwnerWebsiteUsage(auth.user.id),
  ]);

  const fallbackPeriod = getBillingPeriod(subscription.expiresAt);
  const startDate =
    query.startAt != null && query.endAt != null
      ? startOfDay(new Date(query.startAt))
      : fallbackPeriod.startDate;
  const endDate =
    query.startAt != null && query.endAt != null
      ? endOfDay(new Date(query.endAt))
      : fallbackPeriod.endDate;

  const [metrics, sources] = await Promise.all([
    getOwnerUsageMetrics(auth.user.id, startDate, endDate),
    getOwnerWebsiteEventUsage(auth.user.id, startDate, endDate),
  ]);

  return json({
    subscription,
    events,
    websites,
    period: {
      startAt: startDate.toISOString(),
      endAt: endDate.toISOString(),
    },
    metrics,
    sources,
  });
}
