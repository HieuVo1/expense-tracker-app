'use client';

import type { GratitudeEntryRow } from '../types';
import type { GratitudeFormValues } from '../schemas';

import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Stack from '@mui/material/Stack';
import LoadingButton from '@mui/lab/LoadingButton';

import { Form } from 'src/components/hook-form';
import { Iconify } from 'src/components/iconify';

import { gratitudeFormSchema } from '../schemas';
import { GRATITUDE_TARGET } from '../constants/gratitude';
import { GratitudeItemsEditor } from './gratitude-items-editor';
import { upsertTodayGratitude } from '../actions/gratitude-actions';

// ----------------------------------------------------------------------

function defaultsFromItems(items: string[]): GratitudeFormValues {
  const rows = items.map((value) => ({ value }));
  while (rows.length < GRATITUDE_TARGET) rows.push({ value: '' });
  return { items: rows };
}

type Props = { entry: GratitudeEntryRow | null };

export function GratitudeForm({ entry }: Props) {
  const methods = useForm<GratitudeFormValues>({
    resolver: zodResolver(gratitudeFormSchema),
    defaultValues: defaultsFromItems(entry?.items ?? []),
  });

  const {
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = methods;

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

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Stack spacing={2.5}>
        <GratitudeItemsEditor />

        <Stack direction="row" justifyContent={{ xs: 'stretch', sm: 'flex-end' }}>
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
