'use client';

import type { AssetRow, CashDelta } from '../types';

import { useMemo, useState, useTransition } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Radio from '@mui/material/Radio';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import InputAdornment from '@mui/material/InputAdornment';

import { fCurrency } from 'src/utils/format-number';

import { toast } from 'src/components/snackbar';

import { applyCashDelta } from '../actions/asset-actions';

type Props = {
  open: boolean;
  onClose: () => void;
  cashAssets: AssetRow[];
  cashDelta: CashDelta;
};

// Picker for applying a delta into a CASH wallet. The amount is editable so
// the user can subtract past transactions they don't want to sync (e.g.
// backdated entries). Default = server-suggested net delta.
export function CashSyncPicker({ open, onClose, cashAssets, cashDelta }: Props) {
  const [selectedId, setSelectedId] = useState<string>(cashAssets[0]?.id ?? '');
  // String state so the user can type freely (incl. minus, partial input).
  const [amountText, setAmountText] = useState<string>(String(cashDelta.delta));
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const parsedAmount = useMemo(() => {
    const trimmed = amountText.trim();
    if (trimmed === '' || trimmed === '-') return NaN;
    return Number(trimmed);
  }, [amountText]);
  const isAmountValid = Number.isFinite(parsedAmount);

  const handleApply = () => {
    if (!selectedId || !isAmountValid) return;
    setError(null);
    startTransition(async () => {
      try {
        await applyCashDelta(selectedId, parsedAmount);
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

          <TextField
            label="Số tiền điều chỉnh (VND)"
            value={amountText}
            onChange={(e) => setAmountText(e.target.value)}
            error={!isAmountValid}
            helperText={
              isAmountValid
                ? 'Số dương = cộng vào ví, số âm = trừ. Bạn có thể sửa để bỏ qua giao dịch không muốn đồng bộ.'
                : 'Số tiền không hợp lệ'
            }
            slotProps={{
              input: {
                endAdornment: <InputAdornment position="end">₫</InputAdornment>,
              },
              htmlInput: {
                inputMode: 'numeric',
                pattern: '-?[0-9]*',
              },
            }}
            fullWidth
          />

          <Stack spacing={1}>
            {cashAssets.map((asset) => {
              const projected = isAmountValid
                ? Math.max(0, asset.currentValue + parsedAmount)
                : asset.currentValue;
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
          disabled={!selectedId || !isAmountValid}
          loading={isPending}
        >
          Áp dụng
        </Button>
      </DialogActions>
    </Dialog>
  );
}
