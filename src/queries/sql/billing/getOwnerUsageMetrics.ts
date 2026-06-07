import clickhouse from '@/lib/clickhouse';
import { CLICKHOUSE, PRISMA, runQuery } from '@/lib/db';
import prisma from '@/lib/prisma';
import { getOwnerWebsiteIds } from '@/queries/prisma/billing';

const FUNCTION_NAME = 'getOwnerUsageMetrics';

export type UsageCategory = 'events' | 'event-data' | 'session-data' | 'heatmaps';

export type UsageSeriesPoint = { x: string; y: number };

export type OwnerUsageMetrics = {
  categories: Record<UsageCategory, number>;
  series: Record<UsageCategory, UsageSeriesPoint[]>;
};

const EMPTY_METRICS: OwnerUsageMetrics = {
  categories: {
    events: 0,
    'event-data': 0,
    'session-data': 0,
    heatmaps: 0,
  },
  series: {
    events: [],
    'event-data': [],
    'session-data': [],
    heatmaps: [],
  },
};

export async function getOwnerUsageMetrics(
  userId: string,
  startDate: Date,
  endDate: Date,
): Promise<OwnerUsageMetrics> {
  return runQuery({
    [PRISMA]: () => relationalQuery(userId, startDate, endDate),
    [CLICKHOUSE]: () => clickhouseQuery(userId, startDate, endDate),
  });
}

async function relationalQuery(
  userId: string,
  startDate: Date,
  endDate: Date,
): Promise<OwnerUsageMetrics> {
  const websiteIds = await getOwnerWebsiteIds(userId);

  if (!websiteIds.length) {
    return EMPTY_METRICS;
  }

  const dateFilter = {
    websiteId: { in: websiteIds },
    createdAt: {
      gte: startDate,
      lte: endDate,
    },
  };

  const [events, eventData, sessionData, eventSeries, eventDataSeries, sessionDataSeries] =
    await Promise.all([
      prisma.client.websiteEvent.count({ where: dateFilter }),
      prisma.client.eventData.count({ where: dateFilter }),
      prisma.client.sessionData.count({ where: dateFilter }),
      getTableEventSeries('website_event', websiteIds, startDate, endDate),
      getTableEventSeries('event_data', websiteIds, startDate, endDate),
      getTableEventSeries('session_data', websiteIds, startDate, endDate),
    ]);

  return {
    categories: {
      events,
      'event-data': eventData,
      'session-data': sessionData,
      heatmaps: 0,
    },
    series: {
      events: eventSeries,
      'event-data': eventDataSeries,
      'session-data': sessionDataSeries,
      heatmaps: [],
    },
  };
}

async function getTableEventSeries(
  table: 'website_event' | 'event_data' | 'session_data',
  websiteIds: string[],
  startDate: Date,
  endDate: Date,
) {
  const { getDateSQL, rawQuery } = prisma;

  return rawQuery(
    `
    select
      ${getDateSQL(`${table}.created_at`, 'day', 'utc')} x,
      count(*)::int y
    from ${table}
    where ${table}.website_id = any({{websiteIds}})
      and ${table}.created_at between {{startDate}} and {{endDate}}
    group by 1
    order by 1
    `,
    { websiteIds, startDate, endDate },
    `${FUNCTION_NAME}:${table}`,
  );
}

async function clickhouseQuery(
  userId: string,
  startDate: Date,
  endDate: Date,
): Promise<OwnerUsageMetrics> {
  const websiteIds = await getOwnerWebsiteIds(userId);

  if (!websiteIds.length) {
    return EMPTY_METRICS;
  }

  const { getDateSQL, rawQuery } = clickhouse;
  const params = { websiteIds, startDate, endDate };

  const [eventsCount, eventDataCount, sessionDataCount, eventSeries, eventDataSeries, sessionDataSeries] =
    await Promise.all([
      countClickhouseTable('website_event', params),
      countClickhouseTable('event_data', params),
      countClickhouseTable('session_data', params),
      seriesClickhouseTable('website_event', params),
      seriesClickhouseTable('event_data', params),
      seriesClickhouseTable('session_data', params),
    ]);

  return {
    categories: {
      events: eventsCount,
      'event-data': eventDataCount,
      'session-data': sessionDataCount,
      heatmaps: 0,
    },
    series: {
      events: eventSeries,
      'event-data': eventDataSeries,
      'session-data': sessionDataSeries,
      heatmaps: [],
    },
  };
}

async function countClickhouseTable(
  table: string,
  params: { websiteIds: string[]; startDate: Date; endDate: Date },
) {
  const { rawQuery } = clickhouse;
  const result = await rawQuery(
    `
    select count(*) as count
    from ${table}
    where website_id in {websiteIds:Array(UUID)}
      and created_at between {startDate:DateTime64} and {endDate:DateTime64}
    `,
    params,
    `${FUNCTION_NAME}:${table}:count`,
  );

  return Number(result?.[0]?.count ?? 0);
}

async function seriesClickhouseTable(
  table: string,
  params: { websiteIds: string[]; startDate: Date; endDate: Date },
) {
  const { getDateSQL, rawQuery } = clickhouse;

  return rawQuery(
    `
    select
      ${getDateSQL('created_at', 'day', 'UTC')} as x,
      count(*) as y
    from ${table}
    where website_id in {websiteIds:Array(UUID)}
      and created_at between {startDate:DateTime64} and {endDate:DateTime64}
    group by x
    order by x
    `,
    params,
    `${FUNCTION_NAME}:${table}:series`,
  );
}
