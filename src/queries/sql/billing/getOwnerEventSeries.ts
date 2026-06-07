import clickhouse from '@/lib/clickhouse';
import { CLICKHOUSE, PRISMA, runQuery } from '@/lib/db';
import prisma from '@/lib/prisma';
import { getOwnerWebsiteIds } from '@/queries/prisma/billing';

const FUNCTION_NAME = 'getOwnerEventSeries';

export async function getOwnerEventSeries(
  userId: string,
  startDate: Date,
  endDate: Date,
): Promise<{ x: string; y: number }[]> {
  return runQuery({
    [PRISMA]: () => relationalQuery(userId, startDate, endDate),
    [CLICKHOUSE]: () => clickhouseQuery(userId, startDate, endDate),
  });
}

async function relationalQuery(userId: string, startDate: Date, endDate: Date) {
  const websiteIds = await getOwnerWebsiteIds(userId);

  if (!websiteIds.length) {
    return [];
  }

  const { getDateSQL, rawQuery } = prisma;

  return rawQuery(
    `
    select
      ${getDateSQL('website_event.created_at', 'day', 'utc')} x,
      count(*)::int y
    from website_event
    where website_event.website_id = any({{websiteIds}})
      and website_event.created_at between {{startDate}} and {{endDate}}
    group by 1
    order by 1
    `,
    { websiteIds, startDate, endDate },
    FUNCTION_NAME,
  );
}

async function clickhouseQuery(userId: string, startDate: Date, endDate: Date) {
  const websiteIds = await getOwnerWebsiteIds(userId);

  if (!websiteIds.length) {
    return [];
  }

  const { getDateSQL, rawQuery } = clickhouse;

  return rawQuery(
    `
    select
      ${getDateSQL('created_at', 'day', 'UTC')} as x,
      count(*) as y
    from website_event
    where website_id in {websiteIds:Array(UUID)}
      and created_at between {startDate:DateTime64} and {endDate:DateTime64}
    group by x
    order by x
    `,
    { websiteIds, startDate, endDate },
    FUNCTION_NAME,
  );
}
