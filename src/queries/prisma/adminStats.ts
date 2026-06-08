import { endOfDay, startOfDay } from 'date-fns';
import { RECHARGE_ORDER_STATUS } from '@/lib/recharge';
import prisma from '@/lib/prisma';
import { WALLET_REFERENCE_TYPE, WALLET_TRANSACTION_TYPE } from '@/lib/wallet-constants';

export type AdminStatsSeriesPoint = { x: string; y: number };

export type AdminOverviewStats = {
  totalUsers: number;
  period: {
    startAt: string;
    endAt: string;
  };
  registrations: {
    total: number;
    series: AdminStatsSeriesPoint[];
  };
  logins: {
    total: number;
    series: AdminStatsSeriesPoint[];
  };
  recharges: {
    approved: {
      count: number;
      amount: number;
    };
    rejected: {
      count: number;
      amount: number;
    };
    series: {
      approved: AdminStatsSeriesPoint[];
      rejected: AdminStatsSeriesPoint[];
    };
  };
  subscriptions: {
    total: number;
    series: AdminStatsSeriesPoint[];
  };
  websites: {
    total: number;
    series: AdminStatsSeriesPoint[];
  };
};

async function getDailyCountSeries(
  table: string,
  dateField: string,
  startDate: Date,
  endDate: Date,
  whereClause = '',
) {
  const { getDateSQL, rawQuery } = prisma;

  return rawQuery(
    `
    select
      ${getDateSQL(`${table}.${dateField}`, 'day', 'utc')} x,
      count(*)::int y
    from ${table}
    where ${table}.${dateField} between {{startDate}} and {{endDate}}
    ${whereClause}
    group by 1
    order by 1
    `,
    { startDate, endDate },
    `adminStats:${table}`,
  ) as Promise<AdminStatsSeriesPoint[]>;
}

async function countInDateRange(table: string, dateField: string, startDate: Date, endDate: Date, whereClause = '') {
  const { rawQuery } = prisma;

  const result = await rawQuery(
    `
    select count(*)::int as count
    from ${table}
    where ${table}.${dateField} between {{startDate}} and {{endDate}}
    ${whereClause}
    `,
    { startDate, endDate },
    `adminStats:count:${table}`,
  );

  return Number(result?.[0]?.count ?? 0);
}

async function getDailyRechargeAmountSeries(startDate: Date, endDate: Date, status: string) {
  const { getDateSQL, rawQuery } = prisma;

  return rawQuery(
    `
    select
      ${getDateSQL('recharge_order.reviewed_at', 'day', 'utc')} x,
      coalesce(sum(recharge_order.amount), 0)::float y
    from recharge_order
    where recharge_order.status = {{status}}
      and recharge_order.reviewed_at between {{startDate}} and {{endDate}}
    group by 1
    order by 1
    `,
    { startDate, endDate, status },
    `adminStats:recharge:${status}`,
  ) as Promise<AdminStatsSeriesPoint[]>;
}

export type AdminStatsPeriod = {
  startDate: Date;
  endDate: Date;
};

export async function getAdminOverviewStats({
  startDate,
  endDate,
}: AdminStatsPeriod): Promise<AdminOverviewStats> {
  const periodStart = startOfDay(startDate);
  const periodEnd = endOfDay(endDate);

  const [
    totalUsers,
    registrationsTotal,
    registrationSeries,
    loginsTotal,
    loginSeries,
    rechargesApproved,
    rechargesRejected,
    rechargeApprovedSeries,
    rechargeRejectedSeries,
    subscriptionsTotal,
    subscriptionSeries,
    websitesTotal,
    websiteSeries,
  ] = await Promise.all([
    prisma.client.user.count({
      where: { deletedAt: null },
    }),
    prisma.client.user.count({
      where: {
        deletedAt: null,
        createdAt: { gte: periodStart, lte: periodEnd },
      },
    }),
    getDailyCountSeries('"user"', 'created_at', periodStart, periodEnd, 'and "user".deleted_at is null'),
    countInDateRange('user_login_event', 'created_at', periodStart, periodEnd),
    getDailyCountSeries('user_login_event', 'created_at', periodStart, periodEnd),
    prisma.client.rechargeOrder.aggregate({
      where: {
        status: RECHARGE_ORDER_STATUS.approved,
        reviewedAt: { gte: periodStart, lte: periodEnd },
      },
      _count: true,
      _sum: { amount: true },
    }),
    prisma.client.rechargeOrder.aggregate({
      where: {
        status: RECHARGE_ORDER_STATUS.rejected,
        reviewedAt: { gte: periodStart, lte: periodEnd },
      },
      _count: true,
      _sum: { amount: true },
    }),
    getDailyRechargeAmountSeries(periodStart, periodEnd, RECHARGE_ORDER_STATUS.approved),
    getDailyRechargeAmountSeries(periodStart, periodEnd, RECHARGE_ORDER_STATUS.rejected),
    prisma.client.walletTransaction.count({
      where: {
        type: WALLET_TRANSACTION_TYPE.debit,
        referenceType: WALLET_REFERENCE_TYPE.subscription,
        createdAt: { gte: periodStart, lte: periodEnd },
      },
    }),
    getDailyCountSeries(
      'wallet_transaction',
      'created_at',
      periodStart,
      periodEnd,
      `and wallet_transaction.type = '${WALLET_TRANSACTION_TYPE.debit}' and wallet_transaction.reference_type = '${WALLET_REFERENCE_TYPE.subscription}'`,
    ),
    countInDateRange('website', 'created_at', periodStart, periodEnd, 'and website.deleted_at is null'),
    getDailyCountSeries('website', 'created_at', periodStart, periodEnd, 'and website.deleted_at is null'),
  ]);

  return {
    totalUsers,
    period: {
      startAt: periodStart.toISOString(),
      endAt: periodEnd.toISOString(),
    },
    registrations: {
      total: registrationsTotal,
      series: registrationSeries,
    },
    logins: {
      total: loginsTotal,
      series: loginSeries,
    },
    recharges: {
      approved: {
        count: rechargesApproved._count,
        amount: Number(rechargesApproved._sum.amount ?? 0),
      },
      rejected: {
        count: rechargesRejected._count,
        amount: Number(rechargesRejected._sum.amount ?? 0),
      },
      series: {
        approved: rechargeApprovedSeries,
        rejected: rechargeRejectedSeries,
      },
    },
    subscriptions: {
      total: subscriptionsTotal,
      series: subscriptionSeries,
    },
    websites: {
      total: websitesTotal,
      series: websiteSeries,
    },
  };
}
