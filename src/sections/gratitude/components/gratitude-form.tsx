'use client';

import type { GratitudeEntryRow } from '../types';
import type { GratitudeFormValues } from '../schemas';

import { toast } from 'sonner';
import { useMemo } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch, useFieldArray } from 'react-hook-form';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import { alpha } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';

import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';

import { gratitudeFormSchema } from '../schemas';
import { upsertTodayGratitude } from '../actions/gratitude-actions';
import {
  GRATITUDE_ACCENT,
  GRATITUDE_MIN_ITEMS,
  GRATITUDE_MAX_ITEMS,
  GRATITUDE_ITEM_MAX_LEN,
  GRATITUDE_PLACEHOLDERS,
} from '../constants/gratitude';

// ----------------------------------------------------------------------

function defaultsFromItems(items: string[]): GratitudeFormValues {
  const rows = items.map((value) => ({ value }));
  while (rows.length < GRATITUDE_MIN_ITEMS) rows.push({ value: '' });
  return { items: rows };
}

type Props = { entry: GratitudeEntryRow | null };

export function GratitudeForm({ entry }: Props) {
  const methods = useForm<GratitudeFormValues>({
    resolver: zodResolver(gratitudeFormSchema),
    defaultValues: defaultsFromItems(entry?.items ?? []),
  });

  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting, errors },
  } = methods;

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  const watched = useWatch({ control, name: 'items' });
  const filledCount = useMemo(
    () => (watched ?? []).filter((r) => (r?.value ?? '').trim().length > 0).length,
    [watched]
  );
  const reached = filledCount >= GRATITUDE_MIN_ITEMS;

  const onSubmit = handleSubmit(async (data) => {
    try {
      const values = data.items.map((r) => r.value);
      await upsertTodayGratitude(values);
      toast.success('Đã lưu lòng biết ơn hôm nay');
      reset(defaultsFromItems(values.filter((v) => v.trim().length > 0)));
    } catch {
      toast.error('Không lưu được. Vui lòng thử lại.');
    }
  });

  // zodResolver may attach the array-level superRefine message at `.message`
  // or (newer RHF) at `.root.message` — read both.
  const itemsError = errors.items as
    | { message?: string; root?: { message?: string } }
    | undefined;
  const rootError = itemsError?.message ?? itemsError?.root?.message;

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Stack spacing={2}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="subtitle2" color="text.secondary">
            Hôm nay bạn biết ơn điều gì?
          </Typography>
          <Chip
            size="small"
            label={`${filledCount}/${GRATITUDE_MIN_ITEMS}`}
            color={reached ? 'success' : 'default'}
            variant={reached ? 'filled' : 'outlined'}
            icon={<Iconify icon={reached ? 'solar:check-circle-bold' : 'solar:pen-bold'} width={16} />}
          />
        </Stack>

        <Stack spacing={{ xs: 1.25, sm: 1.5 }}>
          {fields.map((field, index) => {
            const removable = fields.length > GRATITUDE_MIN_ITEMS;
            return (
              <Stack
                key={field.id}
                direction="row"
                alignItems="flex-start"
                spacing={{ xs: 1, sm: 1.5 }}
              >
                <Box
                  sx={{
                    mt: 1,
                    width: 26,
                    height: 26,
                    flexShrink: 0,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: 13,
                    color: GRATITUDE_ACCENT,
                    bgcolor: alpha(GRATITUDE_ACCENT, 0.16),
                  }}
                >
                  {index + 1}
                </Box>
                <Field.Text
                  name={`items.${index}.value`}
                  placeholder={GRATITUDE_PLACEHOLDERS[index] ?? 'Một điều bạn biết ơn...'}
                  multiline
                  size="small"
                  fullWidth
                  inputProps={{ maxLength: GRATITUDE_ITEM_MAX_LEN }}
                />
                {/* Only show delete once a row is actually removable — keeps the
                    base 5 rows uncluttered on narrow screens. */}
                {removable && (
                  <IconButton
                    size="small"
                    aria-label="Xoá dòng"
                    sx={{ mt: 0.25, color: 'text.disabled', '&:hover': { color: 'error.main' } }}
                    onClick={() => remove(index)}
                  >
                    <Iconify icon="solar:trash-bin-trash-bold" width={18} />
                  </IconButton>
                )}
              </Stack>
            );
          })}
        </Stack>

        {rootError && (
          <Typography variant="caption" color="error">
            {rootError}
          </Typography>
        )}

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          alignItems={{ xs: 'stretch', sm: 'center' }}
          justifyContent="space-between"
          gap={1.5}
          sx={{ pt: 0.5 }}
        >
          <Button
            color="inherit"
            startIcon={<Iconify icon="solar:add-circle-bold" />}
            disabled={fields.length >= GRATITUDE_MAX_ITEMS}
            onClick={() => append({ value: '' })}
            sx={{ alignSelf: { xs: 'center', sm: 'auto' } }}
          >
            Thêm điều biết ơn
          </Button>
          <LoadingButton
            type="submit"
            variant="contained"
            size="large"
            loading={isSubmitting}
            startIcon={<Iconify icon="solar:heart-bold" />}
            sx={{ width: { xs: '100%', sm: 'auto' } }}
          >
            Lưu hôm nay
          </LoadingButton>
        </Stack>
      </Stack>
    </Form>
  );
}
