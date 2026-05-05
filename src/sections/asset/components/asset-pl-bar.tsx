'use client';

import type { AssetRow } from '../types';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';

import { fCurrency, fShortenNumber } from 'src/utils/format-number';

import { Chart, useChart } from 'src/components/chart';

import { computeAssetPL } from '../utils/compute-totals';

type Props = {
  assets: AssetRow[];
};

const POSITIVE = '#22C55E';
const NEGATIVE = '#EF4444';
const NEUTRAL = '#9CA3AF';

export function AssetPLBar({ assets }: Props) {
  const rows = assets.map((a) => computeAssetPL(a)).sort((a, b) => b.pl - a.pl);

  const chartOptions = useChart({
    chart: { type: 'bar', toolbar: { show: false } },
    plotOptions: {
      bar: { horizontal: true, borderRadius: 3, distributed: true, barHeight: '60%' },
    },
    legend: { show: false },
    grid: { show: false },
    dataLabels: { enabled: false },
    xaxis: {
      categories: rows.map((r) => r.asset.name),
      labels: { formatter: (val: string) => fShortenNumber(Number(val)) },
    },
    yaxis: { labels: { style: { fontSize: '12px' } } },
    tooltip: {
      y: {
        formatter: (val: number) => {
          const sign = val >= 0 ? '+' : '−';
          return `${sign}${fCurrency(Math.abs(val))}`;
        },
      },
    },
    colors: rows.map((r) => (r.pl > 0 ? POSITIVE : r.pl < 0 ? NEGATIVE : NEUTRAL)),
  });

  return (
    <Card sx={{ p: 3 }}>
      <Typography variant="subtitle1" sx={{ mb: 2 }}>
        Lời / Lỗ theo tài sản
      </Typography>

      {rows.length === 0 ? (
        <Box sx={{ py: 6, textAlign: 'center' }}>
          <Typography color="text.secondary">Thêm tài sản để xem biểu đồ.</Typography>
        </Box>
      ) : (
        <Chart
          type="bar"
          series={[{ name: 'Lời/Lỗ', data: rows.map((r) => r.pl) }]}
          options={chartOptions}
          sx={{ height: Math.max(180, rows.length * 36) }}
        />
      )}
    </Card>
  );
}
