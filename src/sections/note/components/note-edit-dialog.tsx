'use client';

import type { z } from 'zod';
import type { NoteRow } from '../types';

import dayjs from 'dayjs';
import { toast } from 'sonner';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

import { Form, Field } from 'src/components/hook-form';
import { NoteImagesField } from 'src/components/note-images/note-images-field';

import { noteFormSchema } from '../schemas';
import { createNote, updateNote } from '../actions/note-actions';

// ----------------------------------------------------------------------

type NoteFormValues = z.infer<typeof noteFormSchema>;

type NoteEditDialogProps = {
  open: boolean;
  note?: NoteRow | null; // null/undefined = create mode
  knownTags?: string[]; // existing tags for autocomplete suggestions
  onClose: () => void;
};

// Daily-note title — Obsidian-style date prefix.
function buildDailyTitle(date = dayjs()): string {
  return `Nhật ký ${date.format('DD/MM/YYYY')}`;
}

export function NoteEditDialog({ open, note, knownTags = [], onClose }: NoteEditDialogProps) {
  const isEdit = !!note;

  const methods = useForm<NoteFormValues>({
    resolver: zodResolver(noteFormSchema),
    defaultValues: {
      type: 'daily',
      title: note?.title ?? (isEdit ? '' : buildDailyTitle()),
      content: note?.content ?? '',
      tags: note?.tags ?? [],
      images: note?.images ?? [],
    },
  });

  const {
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = methods;

  // Sync form when note changes or dialog re-opens
  useEffect(() => {
    if (open) {
      reset({
        type: 'daily',
        title: note?.title ?? (isEdit ? '' : buildDailyTitle()),
        content: note?.content ?? '',
        tags: note?.tags ?? [],
        images: note?.images ?? [],
      });
    }
  }, [open, note, isEdit, reset]);

  // Seed signed display URLs for existing images so the uploader shows previews.
  const initialSignedUrls: Record<string, string> = {};
  if (note) {
    note.images.forEach((path, i) => {
      initialSignedUrls[path] = note.imageUrls[i] ?? '';
    });
  }

  const onSubmit = handleSubmit(async (data) => {
    try {
      if (isEdit && note) {
        await updateNote({ id: note.id, ...data });
        toast.success('Đã cập nhật nhật ký');
      } else {
        await createNote(data);
        toast.success('Đã tạo nhật ký mới');
      }
      onClose();
    } catch (err) {
      toast.error('Có lỗi xảy ra. Vui lòng thử lại.');
      console.error(err);
    }
  });

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" scroll="paper">
      <DialogTitle>{isEdit ? 'Sửa nhật ký' : 'Tạo nhật ký mới'}</DialogTitle>

      <Divider />

      <Form methods={methods} onSubmit={onSubmit}>
        <DialogContent sx={{ px: 3, py: 2.5 }}>
          <Stack spacing={3}>
            {/* Title */}
            <Field.Text
              name="title"
              label="Tiêu đề"
              placeholder="Nhập tiêu đề nhật ký..."
              inputProps={{ maxLength: 120 }}
            />

            {/* Tags */}
            <Field.Autocomplete
              name="tags"
              label="Thẻ"
              placeholder="Gõ rồi Enter để thêm thẻ..."
              multiple
              freeSolo
              options={knownTags}
              helperText="Thẻ giúp gom nhóm và lọc nhật ký."
            />

            {/* Content — markdown editor (lazy-loaded via Field.Editor / RHFEditor) */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Nội dung
              </Typography>
              <Field.Editor name="content" placeholder="Viết nhật ký của bạn ở đây..." />
            </Box>

            {/* Image attachments — private, stored in `note-images` bucket */}
            <NoteImagesField initialSignedUrls={initialSignedUrls} />
          </Stack>
        </DialogContent>

        <Divider />

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} color="inherit" disabled={isSubmitting}>
            Huỷ
          </Button>
          <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
            {isEdit ? 'Lưu thay đổi' : 'Tạo nhật ký'}
          </LoadingButton>
        </DialogActions>
      </Form>
    </Dialog>
  );
}
