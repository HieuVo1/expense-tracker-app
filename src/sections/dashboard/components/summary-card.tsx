'use client';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';

import { fCurrency } from 'src/utils/format-number';

import { Iconify } from 'src/components/iconify';

type Props = {
  totalExpense: number;
  totalIncome: number;
  expenseDeltaPct: number | null;
  monthLabel: string;
};

// Three-column summary: Chi (expense), Thu (income), Số dư (net).
// The trend chip is only shown on Chi because that's the only metric we have
// a meaningful month-over-month comparison for. Net balance color flips
// red/green based on sign so the user reads "in the black" / "in the red"
// without doing the math.
export function SummaryCard({ totalExpense, totalIncome, expenseDeltaPct, monthLabel }: Props) {
  const balance = totalIncome - totalExpense;
  const balancePositive = balance >= 0;

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
      <Box
        sx={{
          display: 'grid',
          gap: { xs: 2, md: 0 },
          gridTemplateColumns: { xs: '1fr', md: '1fr auto 1fr auto 1fr' },
          alignItems: 'stretch',
        }}
      >
        <Cell label={`Tổng chi tháng ${monthLabel}`}>
          <Typography variant="h4" className="tabular" sx={{ mt: 0.5 }}>
            −{fCurrency(totalExpense)}
          </Typography>
          {showTrend && (
            <Box
              sx={{
                mt: 1,
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
        </Cell>

        <DividerCell />

        <Cell label={`Tổng thu tháng ${monthLabel}`}>
          <Typography variant="h4" className="tabular" sx={{ mt: 0.5, color: 'success.dark' }}>
            +{fCurrency(totalIncome)}
          </Typography>
        </Cell>

        <DividerCell />

        <Cell label="Số dư">
          <Typography
            variant="h4"
            className="tabular"
            sx={{ mt: 0.5, color: balancePositive ? 'success.dark' : 'error.main' }}
          >
            {balancePositive ? '+' : '−'}
            {fCurrency(Math.abs(balance))}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Thu − Chi tháng này
          </Typography>
        </Cell>
      </Box>
    </Card>
  );
}

function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Box sx={{ px: { md: 3 }, '&:first-of-type': { pl: { md: 0 } }, '&:last-of-type': { pr: { md: 0 } } }}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      {children}
    </Box>
  );
}

// Vertical hairline between cells on md+; hidden on mobile (cells stack via gap).
function DividerCell() {
  return (
    <Divider
      orientation="vertical"
      flexItem
      sx={{ display: { xs: 'none', md: 'block' } }}
    />
  );
}
