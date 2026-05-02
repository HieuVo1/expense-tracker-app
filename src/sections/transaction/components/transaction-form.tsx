'use client';

import * as z from 'zod';
import dayjs from 'dayjs';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useEffect, useTransition } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';

import { TypeToggle } from './type-toggle';
import { CategoryChipSelect } from './category-chip-select';
import { createTransaction } from '../actions/transaction-actions';

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
  // RHFDateTimePicker stores `dayjs(value).format()` — ISO with offset. We
  // accept any string here and let dayjs validate; the strict wire format
  // (`YYYY-MM-DDTHH:mm`) is built at submit time.
  date: z.string().refine((v) => dayjs(v).isValid(), { error: 'Ngày không hợp lệ' }),
  categoryId: z.string().min(1, { error: 'Vui lòng chọn danh mục' }),
  description: z.string().max(200).optional(),
  merchant: z.string().max(100).optional(),
});

type FormValues = z.infer<typeof schema>;

type Props = {
  categories: Category[];
  // Caller (e.g., scan-fill) provides starting field values. Component is
  // remounted via `key` when a new prefill arrives so RHF picks up changes.
  initialValues?: Partial<FormValues>;
};

// Manual single-transaction form. Scan-and-multi flow lives in the parent
// client wrapper; this component just handles the "edit + save one row" case.
export function TransactionForm({ categories, initialValues }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const methods = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: 'expense',
      amount: '',
      // Default = today at noon, produced as a UTC dayjs ISO string so the
      // picker (configured `timezone="UTC"`) renders the wall-clock as
      // entered. Any caller-supplied date in `initialValues` already comes in
      // as a UTC ISO string for the same reason.
      date: dayjs.utc().hour(12).minute(0).second(0).millisecond(0).format(),
      categoryId: '',
      description: '',
      merchant: '',
      ...initialValues,
    },
  });

  // Reactively narrow category list to the current type. When the user toggles
  // Chi/Thu, the selected categoryId is reset if it no longer belongs to the
  // active list — prevents saving a "Lương" entry under "expense". Cleared in
  // an effect to avoid setState-during-render warnings on the Controller.
  const currentType = methods.watch('type');
  const filteredCategories = categories.filter((c) => c.type === currentType);
  useEffect(() => {
    const current = methods.getValues('categoryId');
    if (current && !categories.some((c) => c.type === currentType && c.id === current)) {
      methods.setValue('categoryId', '');
    }
  }, [currentType, categories, methods]);

  const onSubmit = methods.handleSubmit((data) => {
    setError(null);
    startTransition(async () => {
      try {
        await createTransaction({
          amount: Number(data.amount),
          type: data.type,
          categoryId: data.categoryId,
          // ISO with offset → server wire format `YYYY-MM-DDTHH:mm`.
          // `.utc()` makes the format read the wall-clock the user picked.
          date: dayjs.utc(data.date).format('YYYY-MM-DDTHH:mm'),
          description: data.description,
          merchant: data.merchant,
        });
        toast.success('Đã lưu giao dịch');
        router.push(paths.dashboard.transactions);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Có lỗi xảy ra');
      }
    });
  });

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Stack spacing={3}>
        {!!error && <Alert severity="error">{error}</Alert>}

        <Card sx={{ p: 3 }}>
          <Stack spacing={3}>
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
              autoFocus
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
              <CategoryChipSelect name="categoryId" categories={filteredCategories} />
            </Box>

            <Field.Text
              name="description"
              label="Mô tả"
              placeholder="Ví dụ: Cơm trưa, cà phê Highlands"
              slotProps={{ inputLabel: { shrink: true } }}
            />

            <Field.Text
              name="merchant"
              label="Cửa hàng (tuỳ chọn)"
              placeholder="Ví dụ: Highlands Coffee"
              slotProps={{ inputLabel: { shrink: true } }}
              helperText="App sẽ nhớ và auto-fill danh mục cho cửa hàng này lần sau"
            />
          </Stack>
        </Card>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button onClick={() => router.back()} color="inherit">
            Huỷ
          </Button>
          <Button type="submit" variant="contained" loading={isPending}>
            Lưu giao dịch
          </Button>
        </Box>
      </Stack>
    </Form>
  );
}
