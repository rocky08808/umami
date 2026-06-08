import { endOfDay, endOfMonth, startOfDay, startOfMonth } from 'date-fns';
import { RECHARGE_ORDER_STATUS } from '@/lib/recharge';
import prisma from '@/lib/prisma';
import { WALLET_REFERENCE_TYPE, WALLET_TRANSACTION_TYPE } from '@/lib/wallet-constants';

export type AdminStatsSeriesPoint = { x: string; y: number };

export type AdminOverviewStats = {
  period: {
    startAt: string;
    endAt: string;
  };
  registrations: {
    today: number;
    series: AdminStatsSeriesPoint[];
  };
  logins: {
    today: number;
    series: AdminStatsSeriesPoint[];
  };
  recharges: {
    today: {
      count: number;
      amount: number;
    };
    series: AdminStatsSeriesPoint[];
  };
  subscriptions: {
    today: number;
    series: AdminStatsSeriesPoint[];
  };
  websites: {
    today: number;
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

async function getDailyRechargeAmountSeries(startDate: Date, endDate: Date) {
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
    { startDate, endDate, status: RECHARGE_ORDER_STATUS.approved },
    'adminStats:recharge',
  ) as Promise<AdminStatsSeriesPoint[]>;
}

export async function getAdminOverviewStats(): Promise<AdminOverviewStats> {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const [
    registrationsToday,
    registrationSeries,
    loginsToday,
    loginSeries,
    rechargesToday,
    rechargeSeries,
    subscriptionsToday,
    subscriptionSeries,
    websitesToday,
    websiteSeries,
  ] = await Promise.all([
    prisma.client.user.count({
      where: {
        deletedAt: null,
        createdAt: { gte: todayStart, lte: todayEnd },
      },
    }),
    getDailyCountSeries('"user"', 'created_at', monthStart, monthEnd, 'and "user".deleted_at is null'),
    countInDateRange('user_login_event', 'created_at', todayStart, todayEnd),
    getDailyCountSeries('user_login_event', 'created_at', monthStart, monthEnd),
    prisma.client.rechargeOrder.aggregate({
      where: {
        status: RECHARGE_ORDER_STATUS.approved,
        reviewedAt: { gte: todayStart, lte: todayEnd },
      },
      _count: true,
      _sum: { amount: true },
    }),
    getDailyRechargeAmountSeries(monthStart, monthEnd),
    prisma.client.walletTransaction.count({
      where: {
        type: WALLET_TRANSACTION_TYPE.debit,
        referenceType: WALLET_REFERENCE_TYPE.subscription,
        createdAt: { gte: todayStart, lte: todayEnd },
      },
    }),
    getDailyCountSeries(
      'wallet_transaction',
      'created_at',
      monthStart,
      monthEnd,
      `and wallet_transaction.type = '${WALLET_TRANSACTION_TYPE.debit}' and wallet_transaction.reference_type = '${WALLET_REFERENCE_TYPE.subscription}'`,
    ),
    countInDateRange('website', 'created_at', todayStart, todayEnd, 'and website.deleted_at is null'),
    getDailyCountSeries('website', 'created_at', monthStart, monthEnd, 'and website.deleted_at is null'),
  ]);

  return {
    period: {
      startAt: monthStart.toISOString(),
      endAt: monthEnd.toISOString(),
    },
    registrations: {
      today: registrationsToday,
      series: registrationSeries,
    },
    logins: {
      today: loginsToday,
      series: loginSeries,
    },
    recharges: {
      today: {
        count: rechargesToday._count,
        amount: Number(rechargesToday._sum.amount ?? 0),
      },
      series: rechargeSeries,
    },
    subscriptions: {
      today: subscriptionsToday,
      series: subscriptionSeries,
    },
    websites: {
      today: websitesToday,
      series: websiteSeries,
    },
  };
}
