'use client';

import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';

import { fCurrency } from 'src/utils/format-number';

import { Chart, useChart } from 'src/components/chart';

import {
  TRANSACTION_TYPES,
  TRANSACTION_TYPE_COLOR,
  TRANSACTION_TYPE_LABEL,
} from 'src/sections/transaction/lib/transaction-type';

type Props = {
  data: Array<{ label: string; expense: number; income: number; investment: number }>;
};

// 6-month area chart of expense vs income vs investment. Area instead of line so
// months with zero spend don't look like missing data points — the baseline
// reads as zero. Three overlapping fills at 0.4 opacity would muddy each other,
// so the fill fades out faster now that a third series shares the plot.
// Currency formatter keeps Y-axis values readable in VND ("1.5tr" style).
function shortVnd(v: number) {
  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}tỷ`;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}tr`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}k`;
  return String(v);
}

export function MonthlyTrendChart({ data }: Props) {
  const chartOptions = useChart({
    chart: { toolbar: { show: false }, zoom: { enabled: false } },
    xaxis: { categories: data.map((d) => d.label) },
    yaxis: {
      labels: { formatter: (v: number) => shortVnd(v) },
    },
    stroke: { curve: 'smooth', width: 2 },
    fill: { type: 'gradient', gradient: { opacityFrom: 0.28, opacityTo: 0 } },
    colors: TRANSACTION_TYPES.map((t) => TRANSACTION_TYPE_COLOR[t]),
    dataLabels: { enabled: false },
    // useChart's base options hide the legend. With three series the tooltip
    // alone isn't enough to tell the lines apart, so turn it back on here.
    legend: { show: true, position: 'top', horizontalAlign: 'right' },
    tooltip: {
      y: { formatter: (val: number) => fCurrency(val) },
    },
  });

  // Series order must match the `colors` array above — both derive from
  // TRANSACTION_TYPES so they can't drift apart.
  const series = [
    { name: TRANSACTION_TYPE_LABEL.expense, data: data.map((d) => d.expense) },
    { name: TRANSACTION_TYPE_LABEL.income, data: data.map((d) => d.income) },
    { name: TRANSACTION_TYPE_LABEL.investment, data: data.map((d) => d.investment) },
  ];

  return (
    <Card sx={{ p: 3 }}>
      <Typography variant="subtitle1" sx={{ mb: 2 }}>
        6 tháng gần nhất
      </Typography>
      <Chart type="area" series={series} options={chartOptions} sx={{ height: 280 }} />
    </Card>
  );
}
