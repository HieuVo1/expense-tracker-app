'use client';

import { useState, useTransition } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Radio from '@mui/material/Radio';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

import { fCurrency } from 'src/utils/format-number';

import { toast } from 'src/components/snackbar';

import type { AssetRow, CashDelta } from '../types';
import { applyCashDelta } from '../actions/asset-actions';

type Props = {
  open: boolean;
  onClose: () => void;
  cashAssets: AssetRow[];
  cashDelta: CashDelta;
};

// Picker for multi-CASH case — user chooses which wallet absorbs the delta.
// Shows current value + projected value side-by-side so the impact is visible.
export function CashSyncPicker({ open, onClose, cashAssets, cashDelta }: Props) {
  const [selectedId, setSelectedId] = useState<string>(cashAssets[0]?.id ?? '');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const { delta } = cashDelta;
  const positive = delta >= 0;
  const sign = positive ? '+' : '−';

  const handleApply = () => {
    if (!selectedId) return;
    setError(null);
    startTransition(async () => {
      try {
        await applyCashDelta(selectedId);
        const target = cashAssets.find((a) => a.id === selectedId);
        toast.success(`Đã cập nhật ${target?.name ?? 'tài sản'}`);
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Cập nhật thất bại');
      }
    });
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Áp dụng vào ví tiền mặt</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {!!error && <Alert severity="error">{error}</Alert>}

          <Typography variant="body2" color="text.secondary">
            Net{' '}
            <strong className="tabular">
              {sign}
              {fCurrency(Math.abs(delta))}
            </strong>{' '}
            sẽ được cộng vào ví bạn chọn. Số dư âm sẽ được giữ ở 0.
          </Typography>

          <Stack spacing={1}>
            {cashAssets.map((asset) => {
              const projected = Math.max(0, asset.currentValue + delta);
              const isSelected = selectedId === asset.id;
              return (
                <Box
                  key={asset.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedId(asset.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedId(asset.id);
                    }
                  }}
                  sx={{
                    p: 2,
                    borderRadius: 1.5,
                    border: '0.5px solid',
                    borderColor: isSelected ? 'primary.main' : 'divider',
                    bgcolor: isSelected ? 'primary.lighter' : 'transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    transition: 'all 120ms ease',
                  }}
                >
                  <Radio checked={isSelected} size="small" sx={{ p: 0.5 }} />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" noWrap>
                      {asset.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" className="tabular">
                      {fCurrency(asset.currentValue)} →{' '}
                      <strong>{fCurrency(projected)}</strong>
                    </Typography>
                  </Box>
                </Box>
              );
            })}
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Huỷ
        </Button>
        <Button
          variant="contained"
          onClick={handleApply}
          disabled={!selectedId}
          loading={isPending}
        >
          Áp dụng
        </Button>
      </DialogActions>
    </Dialog>
  );
}
