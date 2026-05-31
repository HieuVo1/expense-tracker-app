'use client';

import type { WheelScores } from 'src/lib/ai/wheel-types';

import { useTheme } from '@mui/material/styles';

import { Chart, useChart } from 'src/components/chart';

import { LIFE_AREA_ORDER, LIFE_AREA_LABEL } from '../constants/life-area';

// ----------------------------------------------------------------------

type Props = {
  current: WheelScores;
  prev?: WheelScores;
  height?: number;
};

export function WheelRadarChart({ current, prev, height = 480 }: Props) {
  const theme = useTheme();

  const categories = LIFE_AREA_ORDER.map((a) => LIFE_AREA_LABEL[a]);

  const series = [
    {
      name: 'Hiện tại',
      data: LIFE_AREA_ORDER.map((a) => current[a]),
    },
    ...(prev
      ? [{ name: 'Lần trước', data: LIFE_AREA_ORDER.map((a) => prev[a]) }]
      : []),
  ];

  const colors = prev
    ? [theme.palette.primary.main, theme.palette.text.disabled]
    : [theme.palette.primary.main];

  const options = useChart({
    chart: { toolbar: { show: false }, sparkline: { enabled: false } },
    xaxis: {
      categories,
      labels: {
        style: {
          colors: Array(categories.length).fill(theme.palette.text.secondary),
          fontSize: '13px',
          fontWeight: 500,
        },
      },
    },
    yaxis: {
      min: 0,
      max: 10,
      tickAmount: 5,
      labels: { show: false },
    },
    colors,
    fill: { opacity: prev ? [0.45, 0.15] : [0.45] },
    stroke: { width: 2.5 },
    markers: { size: 5, hover: { size: 7 } },
    legend: { show: !!prev, position: 'bottom' },
    tooltip: { y: { formatter: (val: number) => `${val}/10` } },
    plotOptions: {
      radar: {
        polygons: {
          strokeColors: theme.palette.divider,
          connectorColors: theme.palette.divider,
        },
      },
    },
  });

  return (
    <Chart type="radar" series={series} options={options} sx={{ width: '100%', height }} />
  );
}
