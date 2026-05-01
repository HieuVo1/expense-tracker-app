'use client';

import type { IconifyName } from 'src/components/iconify';

import dayjs from 'dayjs';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';

import { fCurrency } from 'src/utils/format-number';

import { Iconify } from 'src/components/iconify';

type Tx = {
  id: string;
  amount: number;
  date: string;
  description: string | null;
  category: { name: string; icon: string; color: string };
};

type Props = {
  rows: Tx[];
};

// Top 5 expenses of the current month — useful for spotting outliers.
// Showing them numbered (1-5) gives the list a leaderboard feel without being
// preachy about spending habits.
export function TopTransactionsCard({ rows }: Props) {
  return (
    <Card sx={{ p: 3 }}>
      <Typography variant="subtitle1" sx={{ mb: 2 }}>
        Top 5 chi tiêu lớn nhất
      </Typography>

      {rows.length === 0 ? (
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <Typography color="text.secondary" variant="body2">
            Chưa có chi tiêu nào tháng này.
          </Typography>
        </Box>
      ) : (
        rows.map((r, idx) => (
          <Box
            key={r.id}
            sx={{
              py: 1.5,
              gap: 2,
              display: 'flex',
              alignItems: 'center',
              borderTop: idx > 0 ? '0.5px solid' : 'none',
              borderColor: 'divider',
            }}
          >
            <Box
              sx={{
                width: 28,
                height: 28,
                display: 'grid',
                placeItems: 'center',
                borderRadius: '50%',
                bgcolor: 'action.hover',
                fontSize: 12,
                fontWeight: 500,
                flexShrink: 0,
              }}
            >
              {idx + 1}
            </Box>
            <Box
              sx={{
                width: 32,
                height: 32,
                display: 'grid',
                placeItems: 'center',
                borderRadius: 1,
                bgcolor: `${r.category.color}1a`,
                color: r.category.color,
                flexShrink: 0,
              }}
            >
              <Iconify icon={r.category.icon as IconifyName} width={18} />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="body2" noWrap>
                {r.description || r.category.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {dayjs(r.date).format('DD/MM/YYYY')} · {r.category.name}
              </Typography>
            </Box>
            <Typography variant="subtitle2" className="tabular" sx={{ whiteSpace: 'nowrap' }}>
              −{fCurrency(r.amount)}
            </Typography>
          </Box>
        ))
      )}
    </Card>
  );
}
