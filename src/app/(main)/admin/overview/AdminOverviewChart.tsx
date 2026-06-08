'use client';
import { colord } from 'colord';
import { useMemo } from 'react';
import { BarChart } from '@/components/charts/BarChart';
import { useLocale } from '@/components/hooks';
import { renderDateLabels } from '@/lib/charts';
import { generateTimeSeries } from '@/lib/date';
import type { AdminStatsSeriesPoint } from '@/queries/prisma/adminStats';

type AdminOverviewChartSeries = {
  label: string;
  series: AdminStatsSeriesPoint[];
  color: string;
};

export function AdminOverviewChart({
  label,
  series,
  seriesList,
  minDate,
  maxDate,
  color = '#2680eb',
  currency,
  height = '280px',
}: {
  label?: string;
  series?: AdminStatsSeriesPoint[];
  seriesList?: AdminOverviewChartSeries[];
  minDate: Date;
  maxDate: Date;
  color?: string;
  currency?: string;
  height?: string;
}) {
  const { locale, dateLocale } = useLocale();
  const unit = 'day';

  const chartData = useMemo(() => {
    const datasets = (seriesList?.length
      ? seriesList
      : [{ label: label ?? '', series: series ?? [], color }]
    ).map(({ label: datasetLabel, series: datasetSeries, color: datasetColor }) => {
      const base = colord(datasetColor);

      return {
        type: 'bar',
        label: datasetLabel,
        data: generateTimeSeries(datasetSeries ?? [], minDate, maxDate, unit, dateLocale),
        borderWidth: 1,
        barPercentage: 0.9,
        categoryPercentage: 0.9,
        hoverBackgroundColor: base.alpha(0.7).toRgbString(),
        backgroundColor: base.alpha(0.4).toRgbString(),
        borderColor: base.alpha(0.7).toRgbString(),
        hoverBorderColor: base.toRgbString(),
      };
    });

    return {
      __id: Date.now(),
      datasets,
    };
  }, [color, dateLocale, label, maxDate, minDate, series, seriesList]);

  return (
    <BarChart
      minDate={minDate}
      maxDate={maxDate}
      unit={unit}
      chartData={chartData}
      renderXLabel={renderDateLabels(unit, locale)}
      currency={currency}
      height={height}
    />
  );
}
