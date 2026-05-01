'use client';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';

import { fCurrency } from 'src/utils/format-number';

import { Iconify } from 'src/components/iconify';

type Props = {
  totalExpense: number;
  expenseDeltaPct: number | null;
  monthLabel: string;
};

// Headline card showing current-month spend with a trend chip vs prev month.
// Trend hidden when prev month is 0 — undefined delta would mislead.
export function SummaryCard({ totalExpense, expenseDeltaPct, monthLabel }: Props) {
  const delta = expenseDeltaPct;
  const showTrend = delta !== null;
  const isUp = (delta ?? 0) > 0.5;
  const isDown = (delta ?? 0) < -0.5;
  const trendColor = isUp ? 'error.main' : isDown ? 'success.dark' : 'text.secondary';
  const trendIcon = isUp
    ? 'eva:arrow-upward-fill'
    : isDown
      ? 'eva:arrow-downward-fill'
      : 'eva:arrow-forward-fill';

  return (
    <Card sx={{ p: 3 }}>
      <Typography variant="caption" color="text.secondary">
        Tổng chi tháng {monthLabel}
      </Typography>
      <Typography variant="h3" className="tabular" sx={{ mt: 0.5 }}>
        {fCurrency(totalExpense)}
      </Typography>

      {showTrend && (
        <Box
          sx={{
            mt: 1.5,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.5,
            color: trendColor,
            typography: 'caption',
          }}
        >
          <Iconify icon={trendIcon} width={14} />
          <span className="tabular">{Math.abs(delta!).toFixed(1)}%</span>
          <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
            so với tháng trước
          </Typography>
        </Box>
      )}
    </Card>
  );
}
