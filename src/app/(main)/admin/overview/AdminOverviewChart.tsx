'use client';
import { colord } from 'colord';
import { useMemo } from 'react';
import { BarChart } from '@/components/charts/BarChart';
import { useLocale } from '@/components/hooks';
import { renderDateLabels } from '@/lib/charts';
import { generateTimeSeries } from '@/lib/date';
import type { AdminStatsSeriesPoint } from '@/queries/prisma/adminStats';

export function AdminOverviewChart({
  label,
  series,
  minDate,
  maxDate,
  color = '#2680eb',
  currency,
  height = '280px',
}: {
  label: string;
  series: AdminStatsSeriesPoint[];
  minDate: Date;
  maxDate: Date;
  color?: string;
  currency?: string;
  height?: string;
}) {
  const { locale, dateLocale } = useLocale();
  const unit = 'day';
  const base = colord(color);

  const chartData = useMemo(() => {
    return {
      __id: Date.now(),
      datasets: [
        {
          type: 'bar',
          label,
          data: generateTimeSeries(series ?? [], minDate, maxDate, unit, dateLocale),
          borderWidth: 1,
          barPercentage: 0.9,
          categoryPercentage: 0.9,
          hoverBackgroundColor: base.alpha(0.7).toRgbString(),
          backgroundColor: base.alpha(0.4).toRgbString(),
          borderColor: base.alpha(0.7).toRgbString(),
          hoverBorderColor: base.toRgbString(),
        },
      ],
    };
  }, [color, dateLocale, label, maxDate, minDate, series]);

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
