import { endOfMonth, startOfMonth } from 'date-fns';
import clickhouse from '@/lib/clickhouse';
import { CLICKHOUSE, PRISMA, runQuery } from '@/lib/db';
import prisma from '@/lib/prisma';
import { getOwnerWebsiteIds } from '@/queries/prisma/billing';

const FUNCTION_NAME = 'getMonthlyEventCount';

export async function getMonthlyEventCount(userId: string, date = new Date()) {
  return runQuery({
    [PRISMA]: () => relationalQuery(userId, date),
    [CLICKHOUSE]: () => clickhouseQuery(userId, date),
  });
}

async function relationalQuery(userId: string, date: Date) {
  const websiteIds = await getOwnerWebsiteIds(userId);

  if (!websiteIds.length) {
    return 0;
  }

  const count = await prisma.client.websiteEvent.count({
    where: {
      websiteId: { in: websiteIds },
      createdAt: {
        gte: startOfMonth(date),
        lte: endOfMonth(date),
      },
    },
  });

  return count;
}

async function clickhouseQuery(userId: string, date: Date) {
  const websiteIds = await getOwnerWebsiteIds(userId);

  if (!websiteIds.length) {
    return 0;
  }

  const { rawQuery } = clickhouse;
  const startDate = startOfMonth(date);
  const endDate = endOfMonth(date);

  const result = await rawQuery(
    `
    select count(*) as count
    from website_event
    where website_id in {websiteIds:Array(UUID)}
      and created_at between {startDate:DateTime64} and {endDate:DateTime64}
    `,
    { websiteIds, startDate, endDate },
    FUNCTION_NAME,
  );

  return Number(result?.[0]?.count ?? 0);
}
