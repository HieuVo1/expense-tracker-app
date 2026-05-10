'use client';

import type { BillingCycle } from '@prisma/client';
import type { SubscriptionRow } from '../types';
import type { SubscriptionFormValues } from '../schemas';

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useEffect, useTransition } from 'react';

dayjs.extend(utc);

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
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

import { listCategoriesForForm } from 'src/sections/transaction/actions/transaction-actions';
import { CategoryChipSelect } from 'src/sections/transaction/components/category-chip-select';

import { subscriptionFormSchema } from '../schemas';
import {
  BILLING_CYCLE_LABEL,
  BILLING_CYCLE_VALUES,
} from '../constants/billing-cycle';
import {
  createSubscription,
  updateSubscription,
} from '../actions/subscription-actions';

type Category = {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'expense' | 'income';
};

type Props = {
  open: boolean;
  onClose: () => void;
  // null/undefined = create mode
  editing?: SubscriptionRow | null;
};

const EMPTY_DEFAULTS: SubscriptionFormValues = {
  name: '',
  amount: '',
  cycle: 'monthly',
  categoryId: '',
  nextDueDate: dayjs().format('YYYY-MM-DD'),
  notes: '',
};

function defaultsFromRow(row: SubscriptionRow): SubscriptionFormValues {
  return {
    name: row.name,
    amount: String(row.amount),
    cycle: row.cycle,
    categoryId: row.categoryId,
    nextDueDate: row.nextDueDate,
    notes: row.notes ?? '',
  };
}

export function SubscriptionFormDialog({ open, onClose, editing }: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[] | null>(null);

  const methods = useForm<SubscriptionFormValues>({
    resolver: zodResolver(subscriptionFormSchema),
    defaultValues: editing ? defaultsFromRow(editing) : EMPTY_DEFAULTS,
  });

  useEffect(() => {
    if (open) {
      methods.reset(editing ? defaultsFromRow(editing) : EMPTY_DEFAULTS);
      setError(null);
    }
  }, [open, editing, methods]);

  useEffect(() => {
    if (open && categories === null) {
      listCategoriesForForm()
        .then((rows) => setCategories(rows as Category[]))
        .catch(() => setError('Không tải được danh mục'));
    }
  }, [open, categories]);

  // Subscriptions are bills → expense categories only.
  const expenseCategories = (categories ?? []).filter((c) => c.type === 'expense');

  const cycle = methods.watch('cycle') as BillingCycle;

  const onSubmit = methods.handleSubmit((data) => {
    setError(null);
    // Normalize picker output (ISO with TZ offset, or seed YYYY-MM-DD) to a
    // calendar-day string so the server stores exactly the day the user picked.
    const payload = {
      ...data,
      nextDueDate: dayjs(data.nextDueDate).format('YYYY-MM-DD'),
    };
    startTransition(async () => {
      try {
        if (editing) {
          await updateSubscription(editing.id, payload);
          toast.success('Đã cập nhật hoá đơn');
        } else {
          await createSubscription(payload);
          toast.success('Đã thêm hoá đơn');
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
        <DialogTitle>{editing ? 'Sửa hoá đơn' : 'Thêm hoá đơn định kỳ'}</DialogTitle>

        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            {!!error && <Alert severity="error">{error}</Alert>}

            <Field.Text
              name="name"
              label="Tên dịch vụ"
              placeholder="VD: Claude Pro, Vercel, Netflix"
              slotProps={{ inputLabel: { shrink: true }, htmlInput: { maxLength: 100 } }}
            />

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

            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                Chu kỳ
              </Typography>
              <Tabs
                value={cycle}
                onChange={(_, v: BillingCycle) =>
                  methods.setValue('cycle', v, { shouldDirty: true })
                }
              >
                {BILLING_CYCLE_VALUES.map((c) => (
                  <Tab key={c} label={BILLING_CYCLE_LABEL[c]} value={c} />
                ))}
              </Tabs>
            </Box>

            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                Danh mục
              </Typography>
              {categories === null ? (
                <Typography variant="body2" color="text.secondary">
                  Đang tải danh mục…
                </Typography>
              ) : (
                <CategoryChipSelect name="categoryId" categories={expenseCategories} />
              )}
            </Box>

            <Field.DatePicker
              name="nextDueDate"
              label="Ngày đến hạn kế tiếp"
              format="DD/MM/YYYY"
            />

            <Field.Text
              name="notes"
              label="Ghi chú (tuỳ chọn)"
              multiline
              minRows={2}
              slotProps={{ inputLabel: { shrink: true }, htmlInput: { maxLength: 500 } }}
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
