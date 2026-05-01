'use client';

import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { useState, useTransition } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import type { IconifyName } from 'src/components/iconify';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';

import { upsertBudgets } from '../actions/budget-actions';

type BudgetRow = {
  categoryId: string;
  name: string;
  icon: string;
  color: string;
  limit: number;
};

// Limit is held as a string in the form (HTML <input type="number"> always
// produces strings), then parsed on submit. Avoids the input/output type
// asymmetry that z.coerce would introduce.
const schema = z.object({
  budgets: z.array(
    z.object({
      categoryId: z.string(),
      limit: z
        .string()
        .refine((v) => v === '' || /^\d+$/.test(v), { error: 'Chỉ nhập số nguyên dương' }),
    })
  ),
});

type FormValues = z.infer<typeof schema>;

type Props = {
  initial: BudgetRow[];
};

export function BudgetForm({ initial }: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const methods = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      budgets: initial.map((b) => ({
        categoryId: b.categoryId,
        limit: b.limit ? String(b.limit) : '',
      })),
    },
  });

  const onSubmit = methods.handleSubmit((data) => {
    setError(null);
    startTransition(async () => {
      try {
        await upsertBudgets({
          budgets: data.budgets.map((b) => ({
            categoryId: b.categoryId,
            limit: b.limit === '' ? 0 : Number(b.limit),
          })),
        });
        toast.success('Đã lưu ngân sách tháng này');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Có lỗi xảy ra');
      }
    });
  });

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Stack spacing={3}>
        {!!error && <Alert severity="error">{error}</Alert>}

        <Card>
          {initial.map((row, idx) => (
            <Box
              key={row.categoryId}
              sx={{
                py: 2,
                px: 2.5,
                gap: 2,
                display: 'flex',
                alignItems: 'center',
                borderBottom: '0.5px solid',
                borderColor: 'divider',
                '&:last-of-type': { borderBottom: 'none' },
              }}
            >
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  display: 'grid',
                  placeItems: 'center',
                  borderRadius: 1,
                  bgcolor: `${row.color}1a`,
                  color: row.color,
                  flexShrink: 0,
                }}
              >
                <Iconify icon={row.icon as IconifyName} width={22} />
              </Box>

              <Typography variant="body1" sx={{ flex: 1 }}>
                {row.name}
              </Typography>

              <Field.Text
                name={`budgets.${idx}.limit`}
                size="small"
                placeholder="0"
                inputMode="numeric"
                sx={{ width: 160 }}
                slotProps={{ input: { endAdornment: <Typography variant="caption">₫</Typography> } }}
              />
            </Box>
          ))}
        </Card>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button type="submit" variant="contained" loading={isPending}>
            Lưu ngân sách
          </Button>
        </Box>
      </Stack>
    </Form>
  );
}
