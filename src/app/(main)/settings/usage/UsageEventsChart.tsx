'use client';
import { colord } from 'colord';
import { useMemo } from 'react';
import { BarChart } from '@/components/charts/BarChart';
import { useLocale } from '@/components/hooks';
import { useTranslations } from 'next-intl';
import { renderDateLabels } from '@/lib/charts';
import { generateTimeSeries } from '@/lib/date';
import type { UsageCategory } from '@/queries/sql/billing/getOwnerUsageMetrics';

const CATEGORY_ORDER: UsageCategory[] = [
  'events',
  'event-data',
  'session-data',
  'heatmaps',
];

const CATEGORY_COLORS: Record<UsageCategory, string> = {
  events: '#3b82f6',
  'event-data': '#f97316',
  'session-data': '#22c55e',
  heatmaps: '#ec4899',
};

function getDatasetColors(color: string) {
  const base = colord(color);

  return {
    hoverBackgroundColor: base.alpha(0.7).toRgbString(),
    backgroundColor: base.alpha(0.4).toRgbString(),
    borderColor: base.alpha(0.7).toRgbString(),
    hoverBorderColor: base.toRgbString(),
  };
}

export function UsageEventsChart({
  series,
  minDate,
  maxDate,
}: {
  series: Record<UsageCategory, { x: string; y: number }[]>;
  minDate: Date;
  maxDate: Date;
}) {
  const t = useTranslations();
  const { locale, dateLocale } = useLocale();
  const unit = 'day';

  const chartData = useMemo(() => {
    return {
      __id: Date.now(),
      datasets: CATEGORY_ORDER.map((category, index) => ({
        type: 'bar',
        label: t(`usage.type-${category}`),
        data: generateTimeSeries(series[category] ?? [], minDate, maxDate, unit, dateLocale),
        borderWidth: 1,
        barPercentage: 0.9,
        categoryPercentage: 0.9,
        order: index + 1,
        ...getDatasetColors(CATEGORY_COLORS[category]),
      })),
    };
  }, [dateLocale, maxDate, minDate, series, t]);

  return (
    <BarChart
      minDate={minDate}
      maxDate={maxDate}
      unit={unit}
      chartData={chartData}
      renderXLabel={renderDateLabels(unit, locale)}
      stacked
      height="320px"
    />
  );
}
