'use client';

import type { CashDelta } from '../types';

import dayjs from 'dayjs';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';

import { fCurrency } from 'src/utils/format-number';

type Props = {
  cashDelta: CashDelta;
  // Always opens the picker — user can edit the amount before apply, so the
  // banner doesn't try to apply directly.
  onPickerOpen: () => void;
};

function formatSinceLabel(sinceISO: string): string {
  const days = dayjs().diff(dayjs(sinceISO), 'day');
  if (days <= 0) return 'hôm nay';
  if (days === 1) return '1 ngày qua';
  if (days < 30) return `${days} ngày qua`;
  const months = Math.floor(days / 30);
  return `${months} tháng qua`;
}

export function CashSyncBanner({ cashDelta, onPickerOpen }: Props) {
  const { delta, count } = cashDelta;
  const positive = delta >= 0;
  const sign = positive ? '+' : '−';

  return (
    <Alert severity={positive ? 'success' : 'warning'}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          flexWrap: 'wrap',
        }}
      >
        <Box sx={{ flex: 1, minWidth: 200 }}>
          Trong {formatSinceLabel(cashDelta.sinceISO)}: <strong>{count} giao dịch</strong> · net{' '}
          <strong className="tabular">
            {sign}
            {fCurrency(Math.abs(delta))}
          </strong>
          {' '}— có thể đã trừ vào ví tiền mặt
        </Box>
        <Button
          size="small"
          variant="contained"
          color={positive ? 'success' : 'warning'}
          onClick={onPickerOpen}
        >
          Cập nhật ví…
        </Button>
      </Box>
    </Alert>
  );
}
