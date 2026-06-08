'use client';
import { Column, Grid, Row, Text } from '@umami/react-zen';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { LoadingPanel } from '@/components/common/LoadingPanel';
import { PageBody } from '@/components/common/PageBody';
import { PageHeader } from '@/components/common/PageHeader';
import { Panel } from '@/components/common/Panel';
import { useAdminStatsQuery } from '@/components/hooks/queries/useAdminStatsQuery';
import { formatLongCurrency, formatLongNumber } from '@/lib/format';
import { AdminOverviewChart } from './AdminOverviewChart';

function TodayStatCard({
  label,
  value,
  subValue,
  color,
}: {
  label: string;
  value: string;
  subValue?: string;
  color: string;
}) {
  return (
    <Column
      gap="2"
      padding="4"
      border
      borderRadius
      backgroundColor="surface-base"
      minHeight="100px"
      style={{ borderTop: `3px solid ${color}` }}
    >
      <Text color="muted" size="sm" truncate>
        {label}
      </Text>
      <Text size="xl" weight="bold" truncate>
        {value}
      </Text>
      {subValue && (
        <Text color="muted" size="sm" truncate>
          {subValue}
        </Text>
      )}
    </Column>
  );
}

function MetricChartPanel({
  title,
  chartLabel,
  series,
  minDate,
  maxDate,
  color,
  currency,
}: {
  title: string;
  chartLabel: string;
  series: { x: string; y: number }[];
  minDate: Date;
  maxDate: Date;
  color: string;
  currency?: string;
}) {
  return (
    <Panel title={title} border borderRadius height="100%">
      <AdminOverviewChart
        label={chartLabel}
        series={series}
        minDate={minDate}
        maxDate={maxDate}
        color={color}
        currency={currency}
        height="220px"
      />
    </Panel>
  );
}

function formatPeriodDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function AdminOverviewPage() {
  const t = useTranslations('admin');
  const { data, isLoading, error } = useAdminStatsQuery();

  const { minDate, maxDate } = useMemo(() => {
    if (!data?.period) {
      const now = new Date();
      return { minDate: now, maxDate: now };
    }

    return {
      minDate: new Date(data.period.startAt),
      maxDate: new Date(data.period.endAt),
    };
  }, [data?.period]);

  return (
    <PageBody>
      <Column gap="6">
        <PageHeader title={t('overview')} showBorder={false} />

        <LoadingPanel isLoading={isLoading} error={error} data={data}>
          {data && (
            <Column gap="6">
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
                <Text color="muted">{t('period')}</Text>
                <Text>
                  {formatPeriodDate(data.period.startAt)} — {formatPeriodDate(data.period.endAt)}
                </Text>
              </Row>

              <Column gap="3">
                <Text weight="bold">{t('today-summary')}</Text>
                <Grid columns={{ base: '1fr 1fr', md: '1fr 1fr 1fr', xl: 'repeat(5, 1fr)' }} gap="3">
                  <TodayStatCard
                    label={t('registrations-today')}
                    value={formatLongNumber(data.registrations.today)}
                    color="#3b82f6"
                  />
                  <TodayStatCard
                    label={t('websites-today')}
                    value={formatLongNumber(data.websites.today)}
                    color="#0ea5e9"
                  />
                  <TodayStatCard
                    label={t('logins-today')}
                    value={formatLongNumber(data.logins.today)}
                    color="#22c55e"
                  />
                  <TodayStatCard
                    label={t('recharges-today')}
                    value={formatLongCurrency(data.recharges.today.amount, 'USDT')}
                    subValue={t('recharges-today-count', { count: data.recharges.today.count })}
                    color="#f97316"
                  />
                  <TodayStatCard
                    label={t('subscriptions-today')}
                    value={formatLongNumber(data.subscriptions.today)}
                    color="#a855f7"
                  />
                </Grid>
              </Column>

              <Column gap="3">
                <Text weight="bold">{t('monthly-trends')}</Text>
                <Grid columns={{ base: '1fr', lg: '1fr 1fr' }} gap="4" alignItems="stretch">
                  <MetricChartPanel
                    title={t('registrations-chart')}
                    chartLabel={t('registrations')}
                    series={data.registrations.series}
                    minDate={minDate}
                    maxDate={maxDate}
                    color="#3b82f6"
                  />
                  <MetricChartPanel
                    title={t('websites-chart')}
                    chartLabel={t('websites')}
                    series={data.websites.series}
                    minDate={minDate}
                    maxDate={maxDate}
                    color="#0ea5e9"
                  />
                  <MetricChartPanel
                    title={t('logins-chart')}
                    chartLabel={t('logins')}
                    series={data.logins.series}
                    minDate={minDate}
                    maxDate={maxDate}
                    color="#22c55e"
                  />
                  <MetricChartPanel
                    title={t('recharges-chart')}
                    chartLabel={t('recharges-amount')}
                    series={data.recharges.series}
                    minDate={minDate}
                    maxDate={maxDate}
                    color="#f97316"
                    currency="USDT"
                  />
                  <MetricChartPanel
                    title={t('subscriptions-chart')}
                    chartLabel={t('subscriptions')}
                    series={data.subscriptions.series}
                    minDate={minDate}
                    maxDate={maxDate}
                    color="#a855f7"
                  />
                </Grid>
              </Column>
            </Column>
          )}
        </LoadingPanel>
      </Column>
    </PageBody>
  );
}
