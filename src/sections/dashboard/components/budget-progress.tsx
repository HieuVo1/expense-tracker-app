'use client';

import type { IconifyName } from 'src/components/iconify';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';

import { paths } from 'src/routes/paths';

import { fCurrency } from 'src/utils/format-number';

import { Iconify } from 'src/components/iconify';

type Row = {
  categoryId: string;
  name: string;
  icon: string;
  color: string;
  spent: number;
  limit: number;
};

type Props = {
  rows: Row[];
};

// Hairline progress bars per category. Bar fills with the category's own color
// so the dashboard reads as one cohesive visual instead of competing palettes.
// Categories without a budget are excluded — showing "0 / 0" feels noisy.
export function BudgetProgress({ rows }: Props) {
  // Filter to budgeted categories, then sort by actual spend desc so the most
  // pressing rows (and any overspend) sit at the top instead of being buried.
  const tracked = rows.filter((r) => r.limit > 0).sort((a, b) => b.spent - a.spent);

  return (
    <Card sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="subtitle1">Ngân sách</Typography>
        <Link
          href={paths.dashboard.budgets}
          underline="hover"
          variant="caption"
          color="text.secondary"
        >
          Cập nhật
        </Link>
      </Box>

      {tracked.length === 0 ? (
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <Typography color="text.secondary" variant="body2">
            Chưa đặt ngân sách nào.{' '}
            <Link href={paths.dashboard.budgets} underline="hover">
              Thiết lập ngay
            </Link>
            .
          </Typography>
        </Box>
      ) : (
        <Stack spacing={4}>
          {tracked.map((r) => {
            const pct = Math.min(100, (r.spent / r.limit) * 100);
            const isOver = r.spent > r.limit;
            return (
              <Box key={r.categoryId}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Box sx={{ color: r.color, display: 'flex' }}>
                    <Iconify icon={r.icon as IconifyName} width={16} />
                  </Box>
                  <Typography variant="body2" sx={{ flex: 1 }}>
                    {r.name}
                  </Typography>
                  <Typography
                    className="tabular"
                    variant="caption"
                    color={isOver ? 'error.main' : 'text.secondary'}
                  >
                    {fCurrency(r.spent)} / {fCurrency(r.limit)}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={pct}
                  sx={{
                    height: 10,
                    borderRadius: 5,
                    bgcolor: 'action.hover',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: isOver ? 'error.main' : r.color,
                      borderRadius: 5,
                    },
                  }}
                />
              </Box>
            );
          })}
        </Stack>
      )}
    </Card>
  );
}
