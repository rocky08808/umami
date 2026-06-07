'use client';
import { Column, Grid, ProgressBar, Row, Text } from '@umami/react-zen';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import Link from '@/components/common/Link';
import { LinkButton } from '@/components/common/LinkButton';
import { LoadingPanel } from '@/components/common/LoadingPanel';
import { PageBody } from '@/components/common/PageBody';
import { PageHeader } from '@/components/common/PageHeader';
import { Panel } from '@/components/common/Panel';
import { useBillingUsageQuery, useNavigation, useSubscription } from '@/components/hooks';
import { formatUsagePercent, getBillingPeriod } from '@/lib/billing-usage';
import { getCurrentPlanId, PLANS } from '@/lib/billing';
import { formatLongNumber } from '@/lib/format';
import type { UsageCategory } from '@/queries/sql/billing/getOwnerUsageMetrics';
import { UsageEventsChart } from './UsageEventsChart';

const USAGE_CATEGORIES: UsageCategory[] = [
  'events',
  'event-data',
  'session-data',
  'heatmaps',
];

function formatPeriodDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function UsageQuotaCard({
  label,
  count,
  limit,
  limited,
  limitMessage,
  rechargeHref,
}: {
  label: string;
  count: number;
  limit: number | null;
  limited?: boolean;
  limitMessage?: string;
  rechargeHref?: string;
}) {
  const t = useTranslations();
  const percent = limit ? Math.min(100, Math.round((count / limit) * 100)) : null;

  return (
    <Column gap="3" padding="4" border borderRadius backgroundColor="surface-base" flexGrow="1">
      <Text weight="bold">{label}</Text>
      <Row alignItems="baseline" gap="1">
        <Text size="2xl" weight="bold" color={limited ? 'red' : undefined}>
          {formatLongNumber(count)}
        </Text>
        {limit !== null ? (
          <Text color="muted">/ {formatLongNumber(limit)}</Text>
        ) : (
          <Text color="muted">({t('usage.unlimited')})</Text>
        )}
      </Row>
      {limit !== null && (
        <Row alignItems="center" gap="3">
          <ProgressBar
            value={count}
            minValue={0}
            maxValue={limit}
            style={{ width: '100%' }}
          />
          <Text weight="bold" style={{ minWidth: '3ch' }}>
            {percent}%
          </Text>
        </Row>
      )}
      {limited && (
        <Column gap="2">
          {limitMessage && (
            <Text color="red" size="sm">
              {limitMessage}
            </Text>
          )}
          {rechargeHref && (
            <LinkButton href={rechargeHref} variant="primary" size="sm">
              {t('usage.upgrade-plan')}
            </LinkButton>
          )}
        </Column>
      )}
    </Column>
  );
}

function UsageDataList({
  rows,
  labelColumn,
  valueColumn,
}: {
  rows: { label: string; value: string; href?: string }[];
  labelColumn: string;
  valueColumn: string;
}) {
  return (
    <Column gap="1">
      <Grid columns="1fr auto" paddingX="2" paddingY="2" alignItems="center">
        <Text weight="bold">{labelColumn}</Text>
        <Text weight="bold" align="end">
          {valueColumn}
        </Text>
      </Grid>
      {rows.map((row, index) => (
        <Grid
          key={`${row.label}-${index}`}
          columns="1fr auto"
          paddingX="2"
          paddingY="2"
          alignItems="center"
          borderRadius
          hover={{ backgroundColor: 'surface-sunken' }}
        >
          {row.href ? (
            <Link href={row.href}>
              <Text truncate style={{ maxWidth: '100%' }}>
                {row.label}
              </Text>
            </Link>
          ) : (
            <Text truncate style={{ maxWidth: '100%' }}>
              {row.label}
            </Text>
          )}
          <Text align="end">{row.value}</Text>
        </Grid>
      ))}
    </Column>
  );
}

export function UsagePage() {
  const t = useTranslations();
  const { renderUrl } = useNavigation();
  const subscription = useSubscription();
  const { data, isLoading, error } = useBillingUsageQuery();
  const currentPlanId = getCurrentPlanId(subscription);
  const plan = PLANS.find(item => item.id === currentPlanId);

  const period = useMemo(() => {
    if (data?.period) {
      return {
        startDate: new Date(data.period.startAt),
        endDate: new Date(data.period.endAt),
        chartEndDate: getBillingPeriod(data.subscription?.expiresAt).endDate,
        chartStartDate: getBillingPeriod(data.subscription?.expiresAt).startDate,
      };
    }

    const fallback = getBillingPeriod();
    return {
      startDate: fallback.periodStart,
      endDate: fallback.periodEnd,
      chartStartDate: fallback.startDate,
      chartEndDate: fallback.endDate,
    };
  }, [data?.period, data?.subscription?.expiresAt]);

  const events = data?.events;
  const websites = data?.websites;
  const categories = data?.metrics?.categories;
  const usageTotal = USAGE_CATEGORIES.reduce(
    (sum, category) => sum + (categories?.[category] ?? 0),
    0,
  );

  const usageRows = USAGE_CATEGORIES.map(category => {
    const count = categories?.[category] ?? 0;

    return {
      label: t(`usage.type-${category}`),
      value: `${formatLongNumber(count)} | ${formatUsagePercent(count, usageTotal)}`,
    };
  });

  const sources = data?.sources ?? [];
  const sourcesTotal = sources.reduce((sum, item) => sum + item.count, 0) || usageTotal;

  const sourceRows = sources.map(item => ({
    label: item.name,
    value: `${formatLongNumber(item.count)} | ${formatUsagePercent(item.count, sourcesTotal)}`,
    href: renderUrl(`/websites/${item.websiteId}`, false),
  }));

  return (
    <PageBody>
      <Column gap="6">
        <PageHeader title={t('usage.title')} showBorder={false} />

        <LoadingPanel data={data} isLoading={isLoading} error={error}>
          <Column gap="4">
            <Row
              alignItems="center"
              justifyContent="space-between"
              gap="4"
              wrap="wrap"
              padding="4"
              border
              borderRadius
              backgroundColor="surface-base"
            >
              <Row alignItems="center" gap="2">
                <Text color="muted">{t('usage.plan')}</Text>
                <Row
                  paddingX="2"
                  paddingY="1"
                  borderRadius
                  backgroundColor="primary"
                  alignItems="center"
                >
                  <Text size="sm" weight="bold" style={{ color: 'white' }}>
                    {plan ? t(plan.nameKey) : currentPlanId}
                  </Text>
                </Row>
              </Row>

              <Row alignItems="center" gap="2">
                <Text color="muted">{t('usage.billing-period')}</Text>
                <Text>
                  {formatPeriodDate(period.startDate.toISOString())} —{' '}
                  {formatPeriodDate(period.endDate.toISOString())}
                </Text>
              </Row>
            </Row>

            {(websites || events) && (
              <Grid columns={{ base: '1fr', md: '1fr 1fr' }} gap="4">
                {websites && (
                  <UsageQuotaCard
                    label={t('usage.quota-websites')}
                    count={websites.count}
                    limit={websites.limit}
                    limited={websites.limited}
                    limitMessage={
                      websites.limited && websites.limit !== null
                        ? t('billing.website-limit-reached', { limit: websites.limit })
                        : undefined
                    }
                    rechargeHref={
                      websites.limited ? renderUrl('/settings/recharge', false) : undefined
                    }
                  />
                )}
                {events && (
                  <UsageQuotaCard
                    label={t('usage.quota-events')}
                    count={events.count}
                    limit={events.limit}
                    limited={events.limited}
                    limitMessage={
                      events.limited && events.limit !== null
                        ? t('billing.event-limit-reached', { limit: events.limit })
                        : undefined
                    }
                    rechargeHref={
                      events.limited ? renderUrl('/settings/recharge', false) : undefined
                    }
                  />
                )}
              </Grid>
            )}

            <Panel
              title={t('usage.events')}
              toolbar={
                <Text color="muted">
                  {t('usage.total')} {formatLongNumber(usageTotal)}
                </Text>
              }
              border
              borderRadius
              backgroundColor="surface-base"
              padding="4"
            >
              <UsageEventsChart
                series={
                  data?.metrics?.series ?? {
                    events: [],
                    'event-data': [],
                    'session-data': [],
                    heatmaps: [],
                  }
                }
                minDate={period.chartStartDate}
                maxDate={period.chartEndDate}
              />
            </Panel>

            <Grid columns={{ base: '1fr', md: '1fr 1fr' }} gap="4">
              <Panel
                title={t('usage.breakdown')}
                border
                borderRadius
                backgroundColor="surface-base"
                padding="4"
              >
                <UsageDataList
                  rows={usageRows}
                  labelColumn={t('usage.column-type')}
                  valueColumn={t('usage.column-total')}
                />
              </Panel>

              <Panel
                title={t('usage.sources')}
                border
                borderRadius
                backgroundColor="surface-base"
                padding="4"
              >
                {sourceRows.length ? (
                  <UsageDataList
                    rows={sourceRows}
                    labelColumn={t('usage.column-name')}
                    valueColumn={t('usage.column-total')}
                  />
                ) : (
                  <Text color="muted">{t('message.no-data-available')}</Text>
                )}
              </Panel>
            </Grid>
          </Column>
        </LoadingPanel>
      </Column>
    </PageBody>
  );
}
