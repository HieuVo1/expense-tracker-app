'use client';

import type { IconifyName } from 'src/components/iconify';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import LinearProgress from '@mui/material/LinearProgress';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { fCurrency } from 'src/utils/format-number';

import Link from '@mui/material/Link';
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
  const tracked = rows.filter((r) => r.limit > 0);

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
        <Stack spacing={2.5}>
          {tracked.map((r) => {
            const pct = Math.min(100, (r.spent / r.limit) * 100);
            const isOver = r.spent > r.limit;
            return (
              <Box key={r.categoryId}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
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
                    height: 6,
                    borderRadius: 3,
                    bgcolor: 'action.hover',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: isOver ? 'error.main' : r.color,
                      borderRadius: 3,
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
