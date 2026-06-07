import clickhouse from '@/lib/clickhouse';
import { CLICKHOUSE, PRISMA, runQuery } from '@/lib/db';
import prisma from '@/lib/prisma';
import { getOwnerWebsiteIds } from '@/queries/prisma/billing';

const FUNCTION_NAME = 'getOwnerWebsiteEventUsage';

export async function getOwnerWebsiteEventUsage(
  userId: string,
  startDate: Date,
  endDate: Date,
  limit = 20,
): Promise<{ websiteId: string; name: string; count: number }[]> {
  return runQuery({
    [PRISMA]: () => relationalQuery(userId, startDate, endDate, limit),
    [CLICKHOUSE]: () => clickhouseQuery(userId, startDate, endDate, limit),
  });
}

async function relationalQuery(
  userId: string,
  startDate: Date,
  endDate: Date,
  limit: number,
) {
  const websiteIds = await getOwnerWebsiteIds(userId);

  if (!websiteIds.length) {
    return [];
  }

  const results = await prisma.client.websiteEvent.groupBy({
    by: ['websiteId'],
    where: {
      websiteId: { in: websiteIds },
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    _count: {
      _all: true,
    },
    orderBy: {
      _count: {
        websiteId: 'desc',
      },
    },
    take: limit,
  });

  const websites = await prisma.client.website.findMany({
    where: {
      id: { in: results.map(row => row.websiteId) },
    },
    select: {
      id: true,
      name: true,
      domain: true,
    },
  });

  const websiteNameById = new Map(
    websites.map(website => [
      website.id,
      website.domain || website.name || website.id,
    ]),
  );

  return results.map(row => ({
    websiteId: row.websiteId,
    name: websiteNameById.get(row.websiteId) || row.websiteId,
    count: row._count._all,
  }));
}

async function clickhouseQuery(
  userId: string,
  startDate: Date,
  endDate: Date,
  limit: number,
) {
  const websiteIds = await getOwnerWebsiteIds(userId);

  if (!websiteIds.length) {
    return [];
  }

  const websites = await prisma.client.website.findMany({
    where: { id: { in: websiteIds } },
    select: { id: true, name: true, domain: true },
  });

  const websiteNameById = new Map(
    websites.map(website => [
      website.id,
      website.domain || website.name || website.id,
    ]),
  );

  const { rawQuery } = clickhouse;

  const rows = await rawQuery(
    `
    select
      website_id as websiteId,
      count(*) as count
    from website_event
    where website_id in {websiteIds:Array(UUID)}
      and created_at between {startDate:DateTime64} and {endDate:DateTime64}
    group by website_id
    order by count desc
    limit {limit:UInt32}
    `,
    { websiteIds, startDate, endDate, limit },
    FUNCTION_NAME,
  );

  return rows.map((row: { websiteId: string; count: number }) => ({
    websiteId: row.websiteId,
    name: websiteNameById.get(row.websiteId) || row.websiteId,
    count: Number(row.count),
  }));
}
