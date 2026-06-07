import { EVENT_TYPE } from '@/lib/constants';
import clickhouse from '@/lib/clickhouse';
import { CLICKHOUSE, PRISMA, runQuery } from '@/lib/db';
import prisma from '@/lib/prisma';
import { getOwnerWebsiteIds } from '@/queries/prisma/billing';

const FUNCTION_NAME = 'getOwnerEventTypeBreakdown';

const EVENT_TYPE_LABELS: Record<number, string> = {
  [EVENT_TYPE.pageView]: 'pageviews',
  [EVENT_TYPE.customEvent]: 'events',
  [EVENT_TYPE.linkEvent]: 'links',
  [EVENT_TYPE.pixelEvent]: 'pixels',
  [EVENT_TYPE.performance]: 'performance',
};

export async function getOwnerEventTypeBreakdown(
  userId: string,
  startDate: Date,
  endDate: Date,
): Promise<{ type: string; count: number }[]> {
  const rows = await runQuery({
    [PRISMA]: () => relationalQuery(userId, startDate, endDate),
    [CLICKHOUSE]: () => clickhouseQuery(userId, startDate, endDate),
  });

  return rows.map((row: { eventType: number; count: number }) => ({
    type: EVENT_TYPE_LABELS[row.eventType] || 'other',
    count: Number(row.count),
  }));
}

async function relationalQuery(userId: string, startDate: Date, endDate: Date) {
  const websiteIds = await getOwnerWebsiteIds(userId);

  if (!websiteIds.length) {
    return [];
  }

  const results = await prisma.client.websiteEvent.groupBy({
    by: ['eventType'],
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
        eventType: 'desc',
      },
    },
  });

  return results.map(row => ({
    eventType: row.eventType,
    count: row._count._all,
  }));
}

async function clickhouseQuery(userId: string, startDate: Date, endDate: Date) {
  const websiteIds = await getOwnerWebsiteIds(userId);

  if (!websiteIds.length) {
    return [];
  }

  const { rawQuery } = clickhouse;

  return rawQuery(
    `
    select
      event_type as eventType,
      count(*) as count
    from website_event
    where website_id in {websiteIds:Array(UUID)}
      and created_at between {startDate:DateTime64} and {endDate:DateTime64}
    group by event_type
    order by count desc
    `,
    { websiteIds, startDate, endDate },
    FUNCTION_NAME,
  );
}
