'use client';

import type { AssetRow } from '../types';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useEffect, useTransition } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import InputAdornment from '@mui/material/InputAdornment';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';

import { AssetTypeSelect } from './asset-type-select';
import { assetFormSchema, type AssetFormValues } from '../schemas';
import { createAsset, updateAsset } from '../actions/asset-actions';

type Props = {
  open: boolean;
  onClose: () => void;
  // null/undefined = create mode; row = edit mode
  editing?: AssetRow | null;
};

const EMPTY_DEFAULTS: AssetFormValues = {
  name: '',
  type: 'CASH',
  capital: '',
  currentValue: '',
  interestRate: '',
  maturityDate: '',
  notes: '',
};

function defaultsFromRow(row: AssetRow): AssetFormValues {
  return {
    name: row.name,
    type: row.type,
    capital: String(row.capital),
    currentValue: String(row.currentValue),
    interestRate: row.interestRate !== null ? String(row.interestRate) : '',
    maturityDate: row.maturityDate ?? '',
    notes: row.notes ?? '',
  };
}

export function AssetFormDialog({ open, onClose, editing }: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const methods = useForm<AssetFormValues>({
    resolver: zodResolver(assetFormSchema),
    defaultValues: editing ? defaultsFromRow(editing) : EMPTY_DEFAULTS,
  });

  // Reset form when the dialog opens for a different row (or switches mode).
  useEffect(() => {
    if (open) {
      methods.reset(editing ? defaultsFromRow(editing) : EMPTY_DEFAULTS);
      setError(null);
    }
  }, [open, editing, methods]);

  const currentType = methods.watch('type');
  const isSavings = currentType === 'SAVINGS';

  // When type leaves SAVINGS, clear the savings-only fields so they don't
  // submit as orphan values.
  useEffect(() => {
    if (!isSavings) {
      methods.setValue('interestRate', '');
      methods.setValue('maturityDate', '');
    }
  }, [isSavings, methods]);

  const onSubmit = methods.handleSubmit((data) => {
    setError(null);
    startTransition(async () => {
      try {
        if (editing) {
          await updateAsset({ id: editing.id, ...data });
          toast.success('Đã cập nhật tài sản');
        } else {
          await createAsset(data);
          toast.success('Đã thêm tài sản');
        }
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Có lỗi xảy ra');
      }
    });
  });

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <Form methods={methods} onSubmit={onSubmit}>
        <DialogTitle>{editing ? 'Sửa tài sản' : 'Thêm tài sản'}</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            {!!error && <Alert severity="error">{error}</Alert>}

            <Field.Text
              name="name"
              label="Tên"
              placeholder="VD: VCB, VFM VFB, Tiết kiệm Techcombank 6T"
              slotProps={{ inputLabel: { shrink: true } }}
            />

            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                Loại
              </Typography>
              <AssetTypeSelect name="type" />
            </Box>

            <Field.Text
              name="capital"
              label="Vốn"
              type="text"
              inputMode="numeric"
              slotProps={{
                inputLabel: { shrink: true },
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <Typography variant="body2" color="text.secondary">
                        ₫
                      </Typography>
                    </InputAdornment>
                  ),
                },
              }}
            />

            <Field.Text
              name="currentValue"
              label="Giá trị hiện tại"
              type="text"
              inputMode="numeric"
              slotProps={{
                inputLabel: { shrink: true },
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <Typography variant="body2" color="text.secondary">
                        ₫
                      </Typography>
                    </InputAdornment>
                  ),
                },
              }}
            />

            {isSavings && (
              <>
                <Field.Text
                  name="interestRate"
                  label="Lãi suất / năm"
                  type="text"
                  inputMode="decimal"
                  placeholder="VD: 6.5"
                  slotProps={{
                    inputLabel: { shrink: true },
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">
                          <Typography variant="body2" color="text.secondary">
                            %
                          </Typography>
                        </InputAdornment>
                      ),
                    },
                  }}
                />

                <Field.Text
                  name="maturityDate"
                  type="date"
                  label="Ngày đáo hạn"
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </>
            )}

            <Field.Text
              name="notes"
              label="Ghi chú"
              multiline
              minRows={2}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="inherit">
            Huỷ
          </Button>
          <Button type="submit" variant="contained" loading={isPending}>
            {editing ? 'Lưu' : 'Thêm'}
          </Button>
        </DialogActions>
      </Form>
    </Dialog>
  );
}
