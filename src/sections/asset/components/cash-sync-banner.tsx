'use client';

import dayjs from 'dayjs';
import { useTransition } from 'react';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';

import { fCurrency } from 'src/utils/format-number';

import { toast } from 'src/components/snackbar';

import type { AssetRow, CashDelta } from '../types';
import { applyCashDelta } from '../actions/asset-actions';

type Props = {
  cashAssets: AssetRow[];
  cashDelta: CashDelta;
  // Called when user has multiple CASH assets and needs to pick which one
  // gets the delta. Single-CASH path skips this and applies directly.
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

export function CashSyncBanner({ cashAssets, cashDelta, onPickerOpen }: Props) {
  const [isPending, startTransition] = useTransition();

  const { delta, count } = cashDelta;
  const positive = delta >= 0;
  const sign = positive ? '+' : '−';

  // Single CASH → apply directly, skip picker.
  const handleClick = () => {
    if (cashAssets.length > 1) {
      onPickerOpen();
      return;
    }
    const target = cashAssets[0];
    startTransition(async () => {
      try {
        await applyCashDelta(target.id);
        toast.success(`Đã cập nhật ${target.name}`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Cập nhật thất bại');
      }
    });
  };

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
          onClick={handleClick}
          loading={isPending}
        >
          {cashAssets.length > 1 ? 'Cập nhật ví…' : 'Cập nhật ngay'}
        </Button>
      </Box>
    </Alert>
  );
}
