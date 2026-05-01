'use client';

import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';

import { fCurrency } from 'src/utils/format-number';

import { Chart, useChart } from 'src/components/chart';

type Props = {
  data: Array<{ label: string; expense: number; income: number }>;
};

// 6-month area chart of expense vs income. Area instead of line so months with
// zero spend don't look like missing data points — the baseline reads as zero.
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
    fill: { type: 'gradient', gradient: { opacityFrom: 0.4, opacityTo: 0 } },
    colors: ['#FF5630', '#22C55E'],
    dataLabels: { enabled: false },
    legend: { position: 'top', horizontalAlign: 'right' },
    tooltip: {
      y: { formatter: (val: number) => fCurrency(val) },
    },
  });

  const series = [
    { name: 'Chi', data: data.map((d) => d.expense) },
    { name: 'Thu', data: data.map((d) => d.income) },
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
