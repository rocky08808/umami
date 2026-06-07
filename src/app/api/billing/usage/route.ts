import { getBillingPeriod } from '@/lib/billing-usage';
import { getOwnerMonthlyEventUsage } from '@/lib/billing-events';
import { getOwnerWebsiteUsage, isSelfHostedBilling } from '@/lib/billing-limits';
import { parseRequest } from '@/lib/request';
import { json } from '@/lib/response';
import { getUserSubscriptionDetails } from '@/lib/subscription';
import { getOwnerUsageMetrics } from '@/queries/sql/billing/getOwnerUsageMetrics';
import { getOwnerWebsiteEventUsage } from '@/queries/sql/billing/getOwnerWebsiteEventUsage';

export async function GET(request: Request) {
  const { auth, error } = await parseRequest(request);

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

  const period = getBillingPeriod(subscription.expiresAt);
  const [metrics, sources] = await Promise.all([
    getOwnerUsageMetrics(auth.user.id, period.startDate, period.endDate),
    getOwnerWebsiteEventUsage(auth.user.id, period.startDate, period.endDate),
  ]);

  return json({
    subscription,
    events,
    websites,
    period: {
      startAt: period.periodStart.toISOString(),
      endAt: period.periodEnd.toISOString(),
    },
    metrics,
    sources,
  });
}
