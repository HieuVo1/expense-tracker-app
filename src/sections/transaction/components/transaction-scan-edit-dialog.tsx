'use client';

import * as z from 'zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import InputAdornment from '@mui/material/InputAdornment';

import { Form, Field } from 'src/components/hook-form';

import { TypeToggle } from './type-toggle';
import { CategoryChipSelect } from './category-chip-select';

import type { PreviewItem } from './transaction-scan-preview';

type Category = {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'expense' | 'income';
};

const schema = z.object({
  type: z.enum(['expense', 'income']),
  amount: z
    .string()
    .min(1, { error: 'Vui lòng nhập số tiền' })
    .refine((v) => /^\d+$/.test(v) && Number(v) > 0, { error: 'Số tiền phải là số nguyên dương' }),
  date: z.iso.date({ error: 'Ngày không hợp lệ' }),
  categoryId: z.string().min(1, { error: 'Vui lòng chọn danh mục' }),
  description: z.string().max(200).optional(),
});

type FormValues = z.infer<typeof schema>;

type Props = {
  open: boolean;
  onClose: () => void;
  item: PreviewItem | null;
  categories: Category[];
  onSave: (updated: PreviewItem) => void;
};

// Mirrors TransactionEditDialog but mutates client state — scan rows are
// unsaved drafts, so onSave is a callback rather than a server action.
export function TransactionScanEditDialog({ open, onClose, item, categories, onSave }: Props) {
  const methods = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { type: 'expense', amount: '', date: '', categoryId: '', description: '' },
  });

  useEffect(() => {
    if (open && item) {
      methods.reset({
        type: item.type,
        amount: String(item.amount),
        date: item.date,
        categoryId: item.categoryId,
        description: item.description ?? '',
      });
    }
  }, [open, item, methods]);

  const currentType = methods.watch('type');
  const filteredCategories = categories.filter((c) => c.type === currentType);
  const selectedCategoryId = methods.watch('categoryId');
  if (selectedCategoryId && !filteredCategories.some((c) => c.id === selectedCategoryId)) {
    methods.setValue('categoryId', '');
  }

  const onSubmit = methods.handleSubmit((data) => {
    if (!item) return;
    onSave({
      ...item,
      type: data.type,
      amount: Number(data.amount),
      date: data.date,
      categoryId: data.categoryId,
      description: data.description ?? '',
    });
    onClose();
  });

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <Form methods={methods} onSubmit={onSubmit}>
        <DialogTitle>Sửa giao dịch</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
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

            <Field.Text
              name="date"
              type="date"
              label="Ngày"
              slotProps={{ inputLabel: { shrink: true } }}
            />

            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                Danh mục
              </Typography>
              <CategoryChipSelect name="categoryId" categories={filteredCategories} />
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
          <Button type="submit" variant="contained">
            Lưu
          </Button>
        </DialogActions>
      </Form>
    </Dialog>
  );
}
