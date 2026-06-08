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
    active: {
      pro: number;
      business: number;
    };
    debits: {
      pro: {
        count: number;
        amount: number;
      };
      business: {
        count: number;
        amount: number;
      };
    };
    series: {
      debits: {
        pro: AdminStatsSeriesPoint[];
        business: AdminStatsSeriesPoint[];
      };
    };
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

type SubscriptionPlan = 'pro' | 'business';

function getSubscriptionDebitDescription(plan: SubscriptionPlan) {
  return `Subscribe to ${plan}`;
}

function mergeSeries(...seriesList: AdminStatsSeriesPoint[][]) {
  const totals = new Map<string, number>();

  for (const series of seriesList) {
    for (const point of series ?? []) {
      totals.set(point.x, (totals.get(point.x) ?? 0) + Number(point.y ?? 0));
    }
  }

  return [...totals.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([x, y]) => ({ x, y }));
}

async function getWalletDebitAggregate(startDate: Date, endDate: Date, plan: SubscriptionPlan) {
  const aggregate = await prisma.client.walletTransaction.aggregate({
    where: {
      type: WALLET_TRANSACTION_TYPE.debit,
      referenceType: WALLET_REFERENCE_TYPE.subscription,
      description: getSubscriptionDebitDescription(plan),
      createdAt: { gte: startDate, lte: endDate },
    },
    _count: true,
    _sum: { amount: true },
  });

  return {
    count: aggregate._count,
    amount: Number(aggregate._sum.amount ?? 0),
  };
}

async function getRechargePlanAggregate(startDate: Date, endDate: Date, plan: SubscriptionPlan) {
  const aggregate = await prisma.client.rechargeOrder.aggregate({
    where: {
      plan,
      status: RECHARGE_ORDER_STATUS.approved,
      reviewedAt: { gte: startDate, lte: endDate },
    },
    _count: true,
    _sum: { amount: true },
  });

  return {
    count: aggregate._count,
    amount: Number(aggregate._sum.amount ?? 0),
  };
}

async function getPlanSubscriptionPaymentAggregate(startDate: Date, endDate: Date, plan: SubscriptionPlan) {
  const [wallet, recharge] = await Promise.all([
    getWalletDebitAggregate(startDate, endDate, plan),
    getRechargePlanAggregate(startDate, endDate, plan),
  ]);

  return {
    count: wallet.count + recharge.count,
    amount: wallet.amount + recharge.amount,
  };
}

async function getWalletDebitAmountSeries(startDate: Date, endDate: Date, plan: SubscriptionPlan) {
  const { getDateSQL, rawQuery } = prisma;

  return rawQuery(
    `
    select
      ${getDateSQL('wallet_transaction.created_at', 'day', 'utc')} x,
      coalesce(sum(wallet_transaction.amount), 0)::float y
    from wallet_transaction
    where wallet_transaction.type = {{type}}
      and wallet_transaction.reference_type = {{referenceType}}
      and wallet_transaction.description = {{description}}
      and wallet_transaction.created_at between {{startDate}} and {{endDate}}
    group by 1
    order by 1
    `,
    {
      startDate,
      endDate,
      type: WALLET_TRANSACTION_TYPE.debit,
      referenceType: WALLET_REFERENCE_TYPE.subscription,
      description: getSubscriptionDebitDescription(plan),
    },
    `adminStats:walletDebitSeries:${plan}`,
  ) as Promise<AdminStatsSeriesPoint[]>;
}

async function getRechargePlanAmountSeries(startDate: Date, endDate: Date, plan: SubscriptionPlan) {
  const { getDateSQL, rawQuery } = prisma;

  return rawQuery(
    `
    select
      ${getDateSQL('recharge_order.reviewed_at', 'day', 'utc')} x,
      coalesce(sum(recharge_order.amount), 0)::float y
    from recharge_order
    where recharge_order.plan = {{plan}}
      and recharge_order.status = {{status}}
      and recharge_order.reviewed_at between {{startDate}} and {{endDate}}
    group by 1
    order by 1
    `,
    {
      startDate,
      endDate,
      plan,
      status: RECHARGE_ORDER_STATUS.approved,
    },
    `adminStats:rechargePlanSeries:${plan}`,
  ) as Promise<AdminStatsSeriesPoint[]>;
}

async function getPlanSubscriptionPaymentSeries(startDate: Date, endDate: Date, plan: SubscriptionPlan) {
  const [walletSeries, rechargeSeries] = await Promise.all([
    getWalletDebitAmountSeries(startDate, endDate, plan),
    getRechargePlanAmountSeries(startDate, endDate, plan),
  ]);

  return mergeSeries(walletSeries, rechargeSeries);
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
    activeProSubscriptions,
    activeBusinessSubscriptions,
    subscriptionDebitPro,
    subscriptionDebitBusiness,
    subscriptionDebitProSeries,
    subscriptionDebitBusinessSeries,
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
    prisma.client.userSubscription.count({
      where: {
        plan: 'pro',
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    }),
    prisma.client.userSubscription.count({
      where: {
        plan: 'business',
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    }),
    getPlanSubscriptionPaymentAggregate(periodStart, periodEnd, 'pro'),
    getPlanSubscriptionPaymentAggregate(periodStart, periodEnd, 'business'),
    getPlanSubscriptionPaymentSeries(periodStart, periodEnd, 'pro'),
    getPlanSubscriptionPaymentSeries(periodStart, periodEnd, 'business'),
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
      active: {
        pro: activeProSubscriptions,
        business: activeBusinessSubscriptions,
      },
      debits: {
        pro: subscriptionDebitPro,
        business: subscriptionDebitBusiness,
      },
      series: {
        debits: {
          pro: subscriptionDebitProSeries,
          business: subscriptionDebitBusinessSeries,
        },
      },
    },
    websites: {
      total: websitesTotal,
      series: websiteSeries,
    },
  };
}
