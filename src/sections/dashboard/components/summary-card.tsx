'use client';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';

import { fCurrency } from 'src/utils/format-number';

import { Iconify } from 'src/components/iconify';

type Props = {
  totalExpense: number;
  totalIncome: number;
  expenseDeltaPct: number | null;
  monthLabel: string;
};

// Three side-by-side cards: Chi (expense) with month-over-month trend,
// Thu (income), and Số dư (net). Each card stands alone so the eye latches
// onto a single metric at a time, instead of scanning across cells in one
// shared card. Mobile stacks them.
export function SummaryCard({ totalExpense, totalIncome, expenseDeltaPct, monthLabel }: Props) {
  const balance = totalIncome - totalExpense;
  const balancePositive = balance >= 0;

  const delta = expenseDeltaPct;
  const isUp = (delta ?? 0) > 0.5;
  const isDown = (delta ?? 0) < -0.5;
  const trendColor = isUp ? 'error.main' : isDown ? 'success.dark' : 'text.secondary';
  const trendIcon = isUp
    ? 'eva:arrow-upward-fill'
    : isDown
      ? 'eva:arrow-downward-fill'
      : 'eva:arrow-forward-fill';

  return (
    <Box
      sx={{
        display: 'grid',
        gap: 3,
        gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
      }}
    >
      <MetricCard
        label={`Tổng chi tháng ${monthLabel}`}
        value={`−${fCurrency(totalExpense)}`}
        footer={
          delta !== null ? (
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.5,
                color: trendColor,
                typography: 'caption',
              }}
            >
              <Iconify icon={trendIcon} width={14} />
              <span className="tabular">{Math.abs(delta).toFixed(1)}%</span>
              <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
                so với tháng trước
              </Typography>
            </Box>
          ) : null
        }
      />

      <MetricCard
        label={`Tổng thu tháng ${monthLabel}`}
        value={`+${fCurrency(totalIncome)}`}
        valueColor="success.dark"
      />

      <MetricCard
        label="Số dư"
        value={`${balancePositive ? '+' : '−'}${fCurrency(Math.abs(balance))}`}
        valueColor={balancePositive ? 'success.dark' : 'error.main'}
        footer={
          <Typography variant="caption" color="text.secondary">
            Thu − Chi tháng này
          </Typography>
        }
      />
    </Box>
  );
}

type MetricCardProps = {
  label: string;
  value: string;
  valueColor?: string;
  footer?: React.ReactNode;
};

function MetricCard({ label, value, valueColor = 'text.primary', footer }: MetricCardProps) {
  return (
    <Card sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="h4" className="tabular" sx={{ color: valueColor }}>
        {value}
      </Typography>
      {footer && <Box sx={{ mt: 0.5 }}>{footer}</Box>}
    </Card>
  );
}
