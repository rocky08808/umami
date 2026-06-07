import { endOfMonth, min as minDate, startOfMonth, subDays } from 'date-fns';
import { RECHARGE_SUBSCRIPTION_DAYS } from '@/lib/recharge';

export function getBillingPeriod(expiresAt?: string | null) {
  const now = new Date();

  if (expiresAt) {
    const periodEnd = new Date(expiresAt);
    const startDate = subDays(periodEnd, RECHARGE_SUBSCRIPTION_DAYS);

    return {
      startDate,
      endDate: minDate([periodEnd, now]),
      periodStart: startDate,
      periodEnd,
    };
  }

  const startDate = startOfMonth(now);
  const periodEnd = endOfMonth(now);

  return {
    startDate,
    endDate: minDate([periodEnd, now]),
    periodStart: startDate,
    periodEnd,
  };
}

export function formatUsagePercent(count: number, total: number) {
  if (!total) {
    return '0%';
  }

  return `${Math.round((count / total) * 100)}%`;
}
