'use client';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';

import { fCurrency } from 'src/utils/format-number';

type Row = {
  merchant: string;
  total: number;
  count: number;
  primaryCategory: { name: string; color: string } | null;
};

type Props = {
  rows: Row[];
};

// Top merchants ranked by total spend over 6 months. Currently keys on the
// description text since merchant column isn't denormalised onto Transaction
// — accurate enough for a personal tracker, will need a schema migration if
// merchant analytics become heavier.
export function TopMerchantsCard({ rows }: Props) {
  return (
    <Card sx={{ p: 3 }}>
      <Typography variant="subtitle1" sx={{ mb: 2 }}>
        Top 5 nơi chi nhiều
      </Typography>

      {rows.length === 0 ? (
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <Typography color="text.secondary" variant="body2">
            Chưa đủ dữ liệu để xếp hạng.
          </Typography>
        </Box>
      ) : (
        rows.map((r, idx) => (
          <Box
            key={r.merchant}
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
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="body2" noWrap>
                {r.merchant}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                {r.primaryCategory && (
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      bgcolor: r.primaryCategory.color,
                    }}
                  />
                )}
                <Typography variant="caption" color="text.secondary">
                  {r.primaryCategory?.name ?? 'Không phân loại'} · {r.count} giao dịch
                </Typography>
              </Box>
            </Box>
            <Typography variant="subtitle2" className="tabular" sx={{ whiteSpace: 'nowrap' }}>
              −{fCurrency(r.total)}
            </Typography>
          </Box>
        ))
      )}
    </Card>
  );
}
