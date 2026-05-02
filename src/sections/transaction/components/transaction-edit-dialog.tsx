'use client';

import * as z from 'zod';
import dayjs from 'dayjs';
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

import { TypeToggle } from './type-toggle';
import { CategoryChipSelect } from './category-chip-select';
import { updateTransaction, listCategoriesForForm } from '../actions/transaction-actions';

type Category = {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'expense' | 'income';
};

type Transaction = {
  id: string;
  amount: number;
  type: 'expense' | 'income';
  date: string;
  description: string | null;
  category: { id: string; name: string; icon: string; color: string };
};

const schema = z.object({
  type: z.enum(['expense', 'income']),
  amount: z
    .string()
    .min(1, { error: 'Vui lòng nhập số tiền' })
    .refine((v) => /^\d+$/.test(v) && Number(v) > 0, { error: 'Số tiền phải là số nguyên dương' }),
  // RHFDateTimePicker stores `dayjs(value).format()` — ISO with offset. Strict
  // wire format (`YYYY-MM-DDTHH:mm`) is built at submit time.
  date: z.string().refine((v) => dayjs(v).isValid(), { error: 'Ngày không hợp lệ' }),
  categoryId: z.string().min(1, { error: 'Vui lòng chọn danh mục' }),
  description: z.string().max(200).optional(),
});

type FormValues = z.infer<typeof schema>;

type Props = {
  open: boolean;
  onClose: () => void;
  transaction: Transaction;
};

// Lazily fetches the category list when the dialog opens — avoids loading all
// categories on every page that renders TransactionListItem (dashboard recent,
// full list). Cached in component state for the dialog's lifetime.
export function TransactionEditDialog({ open, onClose, transaction }: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[] | null>(null);

  const methods = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: transaction.type,
      amount: String(transaction.amount),
      // Server returns full UTC ISO; pass through to the picker which is
      // configured `timezone="UTC"` so the wall-clock the user sees matches
      // what's stored.
      date: transaction.date,
      categoryId: transaction.category.id,
      description: transaction.description ?? '',
    },
  });

  // Fetch categories the first time the dialog opens.
  useEffect(() => {
    if (open && categories === null) {
      listCategoriesForForm().then(setCategories).catch(() => {
        setError('Không tải được danh mục');
      });
    }
  }, [open, categories]);

  // Filter categories by current type. If the user switches type and the
  // current category no longer matches, clear it so they have to re-select.
  const currentType = methods.watch('type');
  const filteredCategories = (categories ?? []).filter((c) => c.type === currentType);
  const selectedCategoryId = methods.watch('categoryId');
  if (
    categories &&
    selectedCategoryId &&
    !filteredCategories.some((c) => c.id === selectedCategoryId)
  ) {
    methods.setValue('categoryId', '');
  }

  const onSubmit = methods.handleSubmit((data) => {
    setError(null);
    startTransition(async () => {
      try {
        await updateTransaction({
          id: transaction.id,
          amount: Number(data.amount),
          type: data.type,
          categoryId: data.categoryId,
          date: dayjs.utc(data.date).format('YYYY-MM-DDTHH:mm'),
          description: data.description,
        });
        toast.success('Đã cập nhật giao dịch');
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Có lỗi xảy ra');
      }
    });
  });

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <Form methods={methods} onSubmit={onSubmit}>
        <DialogTitle>Sửa giao dịch</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            {!!error && <Alert severity="error">{error}</Alert>}

            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                Loại giao dịch
              </Typography>
              <TypeToggle name="type" />
            </Box>

            <Field.Text
              name="amount"
              label="Số tiền"
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

            <Field.DateTimePicker
              name="date"
              label="Ngày & giờ"
              timezone="UTC"
              ampm={false}
              format="DD/MM/YYYY HH:mm"
            />

            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                Danh mục
              </Typography>
              {categories === null ? (
                <Typography variant="body2" color="text.secondary">
                  Đang tải danh mục…
                </Typography>
              ) : (
                <CategoryChipSelect name="categoryId" categories={filteredCategories} />
              )}
            </Box>

            <Field.Text
              name="description"
              label="Mô tả"
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="inherit">
            Huỷ
          </Button>
          <Button type="submit" variant="contained" loading={isPending}>
            Lưu
          </Button>
        </DialogActions>
      </Form>
    </Dialog>
  );
}
