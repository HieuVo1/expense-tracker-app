'use client';

import type { GratitudeEntryRow } from '../types';
import type { GratitudeEditFormValues } from '../schemas';

import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Drawer from '@mui/material/Drawer';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import useMediaQuery from '@mui/material/useMediaQuery';
import DialogContent from '@mui/material/DialogContent';

import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';

import { gratitudeEditFormSchema } from '../schemas';
import { GRATITUDE_TARGET } from '../constants/gratitude';
import { GratitudeItemsEditor } from './gratitude-items-editor';
import { updateGratitude, deleteGratitude } from '../actions/gratitude-actions';

// ----------------------------------------------------------------------

function buildDefaults(entry: GratitudeEntryRow): GratitudeEditFormValues {
  const rows = entry.items.map((value) => ({ value }));
  while (rows.length < GRATITUDE_TARGET) rows.push({ value: '' });
  return { date: entry.date, items: rows };
}

type Props = { entry: GratitudeEntryRow | null; open: boolean; onClose: () => void };

export function GratitudeEditDialog({ entry, open, onClose }: Props) {
  const isMobile = useMediaQuery('(max-width:600px)');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const methods = useForm<GratitudeEditFormValues>({
    resolver: zodResolver(gratitudeEditFormSchema),
    defaultValues: entry ? buildDefaults(entry) : { date: '', items: [] },
  });

  const {
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = methods;

  // Sync form + reset confirm state whenever the dialog opens on a new entry.
  useEffect(() => {
    if (open && entry) {
      reset(buildDefaults(entry));
      setConfirmDelete(false);
    }
  }, [open, entry, reset]);

  const onSubmit = handleSubmit(async (data) => {
    if (!entry) return;
    try {
      await updateGratitude({
        id: entry.id,
        date: data.date,
        items: data.items.map((r) => r.value),
      });
      toast.success('Đã cập nhật');
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không lưu được. Vui lòng thử lại.');
    }
  });

  const handleDelete = async () => {
    if (!entry) return;
    try {
      await deleteGratitude(entry.id);
      toast.success('Đã xoá');
      onClose();
    } catch {
      toast.error('Không xoá được. Vui lòng thử lại.');
    }
  };

  const content = (
    <Form methods={methods} onSubmit={onSubmit}>
      <Stack spacing={2.5}>
        <Field.DatePicker
          name="date"
          label="Ngày"
          format="DD/MM/YYYY"
          disableFuture
          slotProps={{ textField: { fullWidth: true, size: 'small' } }}
        />

        <GratitudeItemsEditor label="Bạn đã biết ơn điều gì?" />

        <Divider />

        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          flexWrap="wrap"
          gap={1}
        >
          {confirmDelete ? (
            <Stack direction="row" alignItems="center" gap={1}>
              <Typography variant="caption" color="error">
                Xoá ngày này?
              </Typography>
              <Button
                size="small"
                color="error"
                variant="contained"
                onClick={handleDelete}
                disabled={isSubmitting}
              >
                Xoá
              </Button>
              <Button size="small" color="inherit" onClick={() => setConfirmDelete(false)}>
                Huỷ
              </Button>
            </Stack>
          ) : (
            <Button
              size="small"
              color="error"
              variant="outlined"
              disabled={isSubmitting}
              onClick={() => setConfirmDelete(true)}
              startIcon={<Iconify icon="solar:trash-bin-trash-bold" width={16} />}
            >
              Xoá
            </Button>
          )}

          <Stack direction="row" gap={1}>
            <Button color="inherit" onClick={onClose} disabled={isSubmitting}>
              Đóng
            </Button>
            <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
              Lưu thay đổi
            </LoadingButton>
          </Stack>
        </Stack>
      </Stack>
    </Form>
  );

  if (isMobile) {
    return (
      <Drawer
        anchor="bottom"
        open={open}
        onClose={onClose}
        PaperProps={{
          sx: {
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            maxHeight: '92vh',
            overflowY: 'auto',
            px: 2.5,
            pt: 2,
            pb: 3,
          },
        }}
      >
        <Box sx={{ width: 40, height: 4, bgcolor: 'divider', borderRadius: 2, mx: 'auto', mb: 2 }} />
        <Typography variant="h6" sx={{ mb: 2 }}>
          Sửa lòng biết ơn
        </Typography>
        {content}
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" scroll="paper">
      <DialogTitle>Sửa lòng biết ơn</DialogTitle>
      <Divider />
      <DialogContent sx={{ px: 3, py: 2.5 }}>{content}</DialogContent>
    </Dialog>
  );
}
