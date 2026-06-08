'use client';
import { Column, Grid, Row, Text } from '@umami/react-zen';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { GridRow } from '@/components/common/GridRow';
import { LoadingPanel } from '@/components/common/LoadingPanel';
import { PageBody } from '@/components/common/PageBody';
import { PageHeader } from '@/components/common/PageHeader';
import { Panel } from '@/components/common/Panel';
import {
  DEFAULT_ADMIN_STATS_DATE_RANGE,
  useAdminStatsQuery,
} from '@/components/hooks/queries/useAdminStatsQuery';
import { DateFilter } from '@/components/input/DateFilter';
import { MetricsBar } from '@/components/metrics/MetricsBar';
import { formatLongCurrency, formatLongNumber } from '@/lib/format';
import { AdminOverviewChart } from './AdminOverviewChart';

function StatCard({
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
      paddingX="4"
      paddingY="3"
      border
      borderRadius
      backgroundColor="surface-base"
      height="100%"
    >
      <Row alignItems="center" gap="2" minWidth="0">
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: color,
            flexShrink: 0,
          }}
        />
        <Text color="muted" size="sm" truncate>
          {label}
        </Text>
      </Row>
      <Text size="2xl" weight="bold" truncate>
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
  seriesList,
  minDate,
  maxDate,
  color,
  currency,
}: {
  title: string;
  chartLabel?: string;
  series?: { x: string; y: number }[];
  seriesList?: { label: string; series: { x: string; y: number }[]; color: string }[];
  minDate: Date;
  maxDate: Date;
  color?: string;
  currency?: string;
}) {
  return (
    <Panel title={title} border borderRadius height="100%">
      <AdminOverviewChart
        label={chartLabel}
        series={series}
        seriesList={seriesList}
        minDate={minDate}
        maxDate={maxDate}
        color={color}
        currency={currency}
        height="220px"
      />
    </Panel>
  );
}

export function AdminOverviewPage() {
  const t = useTranslations('admin');
  const [dateRange, setDateRange] = useState(DEFAULT_ADMIN_STATS_DATE_RANGE);
  const { data, isLoading, error } = useAdminStatsQuery(dateRange);

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
      <Column gap="4">
        <PageHeader title={t('overview')} showBorder={false} />

        <LoadingPanel isLoading={isLoading} error={error} data={data}>
          {data && (
            <Column gap="4">
              <Grid columns={{ base: '1fr', md: 'repeat(3, 160px) 1fr' }} gap="3" alignItems="stretch">
                <Column
                  gap="1"
                  padding="4"
                  border
                  borderRadius
                  backgroundColor="surface-base"
                  justifyContent="center"
                >
                  <Text color="muted" size="sm">
                    {t('total-users')}
                  </Text>
                  <Text size="3xl" weight="bold">
                    {formatLongNumber(data.totalUsers)}
                  </Text>
                </Column>

                <Column
                  gap="1"
                  padding="4"
                  border
                  borderRadius
                  backgroundColor="surface-base"
                  justifyContent="center"
                  style={{ borderTop: '3px solid #8b5cf6' }}
                >
                  <Text color="muted" size="sm">
                    {t('subscriptions-active-pro')}
                  </Text>
                  <Text size="3xl" weight="bold">
                    {formatLongNumber(data.subscriptions.active.pro)}
                  </Text>
                </Column>

                <Column
                  gap="1"
                  padding="4"
                  border
                  borderRadius
                  backgroundColor="surface-base"
                  justifyContent="center"
                  style={{ borderTop: '3px solid #6366f1' }}
                >
                  <Text color="muted" size="sm">
                    {t('subscriptions-active-business')}
                  </Text>
                  <Text size="3xl" weight="bold">
                    {formatLongNumber(data.subscriptions.active.business)}
                  </Text>
                </Column>

                <Row
                  alignItems="center"
                  justifyContent="space-between"
                  gap="4"
                  wrap="wrap"
                  padding="4"
                  border
                  borderRadius
                  backgroundColor="surface-base"
                  height="100%"
                >
                  <Text color="muted">{t('period')}</Text>
                  <DateFilter value={dateRange} onChange={setDateRange} renderDate />
                </Row>
              </Grid>

              <Panel title={t('period-summary')} border borderRadius>
                <MetricsBar gap="3" columns={{ base: '1fr 1fr', md: 'repeat(3, 1fr)', xl: 'repeat(4, 1fr)' }}>
                  <StatCard
                    label={t('registrations')}
                    value={formatLongNumber(data.registrations.total)}
                    color="#3b82f6"
                  />
                  <StatCard
                    label={t('websites')}
                    value={formatLongNumber(data.websites.total)}
                    color="#0ea5e9"
                  />
                  <StatCard
                    label={t('logins')}
                    value={formatLongNumber(data.logins.total)}
                    color="#22c55e"
                  />
                  <StatCard
                    label={t('recharges-approved')}
                    value={formatLongCurrency(data.recharges.approved.amount, 'USDT')}
                    subValue={t('recharges-approved-count', { count: data.recharges.approved.count })}
                    color="#22c55e"
                  />
                  <StatCard
                    label={t('recharges-rejected')}
                    value={formatLongCurrency(data.recharges.rejected.amount, 'USDT')}
                    subValue={t('recharges-rejected-count', { count: data.recharges.rejected.count })}
                    color="#ef4444"
                  />
                  <StatCard
                    label={t('subscriptions-debit-pro')}
                    value={formatLongCurrency(data.subscriptions.debits.pro.amount, 'USDT')}
                    subValue={t('subscriptions-debit-count', { count: data.subscriptions.debits.pro.count })}
                    color="#8b5cf6"
                  />
                  <StatCard
                    label={t('subscriptions-debit-business')}
                    value={formatLongCurrency(data.subscriptions.debits.business.amount, 'USDT')}
                    subValue={t('subscriptions-debit-count', {
                      count: data.subscriptions.debits.business.count,
                    })}
                    color="#6366f1"
                  />
                </MetricsBar>
              </Panel>

              <Column gap="3">
                <Text weight="bold" size="lg">
                  {t('trends')}
                </Text>
                <GridRow layout="two" gap="4" alignItems="stretch">
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
                    seriesList={[
                      {
                        label: t('recharges-approved'),
                        series: data.recharges.series.approved,
                        color: '#22c55e',
                      },
                      {
                        label: t('recharges-rejected'),
                        series: data.recharges.series.rejected,
                        color: '#ef4444',
                      },
                    ]}
                    minDate={minDate}
                    maxDate={maxDate}
                    currency="USDT"
                  />
                  <MetricChartPanel
                    title={t('subscriptions-debit-chart')}
                    seriesList={[
                      {
                        label: t('subscriptions-debit-pro'),
                        series: data.subscriptions.series.debits.pro,
                        color: '#8b5cf6',
                      },
                      {
                        label: t('subscriptions-debit-business'),
                        series: data.subscriptions.series.debits.business,
                        color: '#6366f1',
                      },
                    ]}
                    minDate={minDate}
                    maxDate={maxDate}
                    currency="USDT"
                  />
                </GridRow>
              </Column>
            </Column>
          )}
        </LoadingPanel>
      </Column>
    </PageBody>
  );
}
