'use client';

import type { CardProps } from '@mui/material/Card';
import type { PaletteColorKey } from 'src/theme/core';
import type { ChartOptions } from 'src/components/chart';

import { varAlpha } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import { useTheme } from '@mui/material/styles';

import { fNumber, fCurrency, fPercent, fShortenNumber } from 'src/utils/format-number';

import { CONFIG } from 'src/global-config';

import { Iconify } from 'src/components/iconify';
import { SvgColor } from 'src/components/svg-color';
import { Chart, useChart } from 'src/components/chart';

// ----------------------------------------------------------------------

type Props = CardProps & {
  title: string;
  total: number;
  percent: number;
  color?: PaletteColorKey;
  icon: React.ReactNode;
  chart: {
    series: number[];
    categories: string[];
    options?: ChartOptions;
  };
  /**
   * Number format mode. String discriminator (not a function) so this prop
   * can cross the server→client boundary in App Router RSC pages.
   * - `shorten` → "8,51 Tr" (default)
   * - `currency` → "−8.510.902 ₫"
   * - `number` → "8.510.902"
   */
  format?: 'shorten' | 'currency' | 'number';
};

/**
 * Reusable summary (widget) card — pastel gradient bg, icon, trending %, sparkline.
 * Matches the Minimal UI Kit Pro `analytics-widget-summary` style.
 *
 * Usage:
 *   <SummaryCard
 *     title="Tổng chi"
 *     total={4_500_000}
 *     percent={-12.5}
 *     color="error"
 *     icon={<Iconify icon="solar:wallet-money-bold" width={48} />}
 *     chart={{ series: [1, 2, 3, 4, 5, 6], categories: ['T1','T2','T3','T4','T5','T6'] }}
 *   />
 */
export function SummaryCard({
  sx,
  icon,
  title,
  total,
  chart,
  percent,
  color = 'primary',
  format = 'shorten',
  ...other
}: Props) {
  const formatter =
    format === 'currency' ? fCurrency : format === 'number' ? fNumber : fShortenNumber;
  const theme = useTheme();

  const chartColors = [theme.palette[color].dark];

  const chartOptions = useChart({
    chart: { sparkline: { enabled: true } },
    colors: chartColors,
    // Explicitly hide axis labels — base useChart config sets yaxis.tickAmount=5
    // which renders 5 number labels even in sparkline mode, looking like "}}}"
    // artifacts on the left edge of the card.
    xaxis: {
      categories: chart.categories,
      labels: { show: false },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: { show: false },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    grid: {
      show: false,
      padding: { top: 6, left: 6, right: 6, bottom: 6 },
    },
    tooltip: {
      y: {
        formatter: (value: number) => fNumber(value),
        title: { formatter: () => '' },
      },
    },
    markers: { strokeWidth: 0 },
    ...chart.options,
  });

  const renderTrending = () => {
    // percent === 0 means no comparison available — skip indicator.
    if (percent === 0) return null;

    return (
      <Box
        sx={{
          top: 16,
          gap: 0.5,
          right: 16,
          display: 'flex',
          position: 'absolute',
          alignItems: 'center',
        }}
      >
        <Iconify
          width={20}
          icon={percent < 0 ? 'eva:trending-down-fill' : 'eva:trending-up-fill'}
        />
        <Box component="span" sx={{ typography: 'subtitle2' }}>
          {percent > 0 && '+'}
          {fPercent(percent)}
        </Box>
      </Box>
    );
  };

  return (
    <Card
      sx={[
        () => ({
          p: 3,
          boxShadow: 'none',
          position: 'relative',
          color: `${color}.darker`,
          backgroundColor: 'common.white',
          backgroundImage: `linear-gradient(135deg, ${varAlpha(theme.vars.palette[color].lighterChannel, 0.48)}, ${varAlpha(theme.vars.palette[color].lightChannel, 0.48)})`,
        }),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      <Box sx={{ width: 48, height: 48, mb: 3 }}>{icon}</Box>

      {renderTrending()}

      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'flex-end',
          justifyContent: 'flex-end',
        }}
      >
        <Box sx={{ flexGrow: 1, minWidth: 112 }}>
          <Box sx={{ mb: 1, typography: 'subtitle2' }}>{title}</Box>
          <Box sx={{ typography: 'h4' }} className="tabular">
            {formatter(total)}
          </Box>
        </Box>

        {chart.series.length > 0 && (
          <Chart
            type="line"
            series={[{ data: chart.series }]}
            options={chartOptions}
            sx={{ width: 84, height: 56 }}
          />
        )}
      </Box>

      <SvgColor
        src={`${CONFIG.assetsDir}/assets/background/shape-square.svg`}
        sx={{
          top: 0,
          left: -20,
          width: 240,
          zIndex: -1,
          height: 240,
          opacity: 0.24,
          position: 'absolute',
          color: `${color}.main`,
        }}
      />
    </Card>
  );
}
