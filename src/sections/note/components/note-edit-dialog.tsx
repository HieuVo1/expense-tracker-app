'use client';

import type { z } from 'zod';
import type { NoteType } from '@prisma/client';
import type { NoteRow } from '../types';

import dayjs from 'dayjs';
import { toast } from 'sonner';
import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch, useFormContext } from 'react-hook-form';

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

import { noteFormSchema } from '../schemas';
import { createNote, updateNote } from '../actions/note-actions';
import {
  NOTE_TYPE_VALUES,
  NOTE_TYPE_LABELS,
  NOTE_TYPE_COLORS,
} from '../constants/note-types';

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

// Type picker isolated in its own component so the heavy TipTap editor in
// the parent doesn't re-render when the user changes type. Also owns the
// daily auto-fill side effect for the same reason.
function NoteTypePicker({ isEdit }: { isEdit: boolean }) {
  const { control, setValue, getValues } = useFormContext<NoteFormValues>();
  const activeType = useWatch({ control, name: 'type' }) as NoteType;

  useEffect(() => {
    if (isEdit) return;
    if (activeType !== 'daily') return;
    const { title } = getValues();
    if (!title?.trim()) {
      setValue('title', buildDailyTitle(), { shouldDirty: true, shouldValidate: true });
    }
  }, [activeType, isEdit, getValues, setValue]);

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        Phân loại
      </Typography>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        {NOTE_TYPE_VALUES.map((type) => {
          const isActive = activeType === type;
          return (
            <Button
              key={type}
              size="small"
              variant={isActive ? 'contained' : 'outlined'}
              onClick={() => setValue('type', type, { shouldValidate: true })}
              sx={{
                ...(isActive && {
                  backgroundColor: NOTE_TYPE_COLORS[type],
                  borderColor: NOTE_TYPE_COLORS[type],
                  '&:hover': { backgroundColor: NOTE_TYPE_COLORS[type], opacity: 0.9 },
                }),
                ...(!isActive && {
                  borderColor: NOTE_TYPE_COLORS[type],
                  color: NOTE_TYPE_COLORS[type],
                }),
              }}
            >
              {NOTE_TYPE_LABELS[type]}
            </Button>
          );
        })}
      </Box>
    </Box>
  );
}

export function NoteEditDialog({ open, note, knownTags = [], onClose }: NoteEditDialogProps) {
  const isEdit = !!note;

  const methods = useForm<NoteFormValues>({
    resolver: zodResolver(noteFormSchema),
    defaultValues: {
      type: note?.type ?? 'daily',
      title: note?.title ?? '',
      content: note?.content ?? '',
      tags: note?.tags ?? [],
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
        type: note?.type ?? 'daily',
        title: note?.title ?? '',
        content: note?.content ?? '',
        tags: note?.tags ?? [],
      });
    }
  }, [open, note, reset]);

  const onSubmit = handleSubmit(async (data) => {
    try {
      if (isEdit && note) {
        await updateNote({ id: note.id, ...data });
        toast.success('Đã cập nhật ghi chú');
      } else {
        await createNote(data);
        toast.success('Đã tạo ghi chú');
      }
      onClose();
    } catch (err) {
      toast.error('Có lỗi xảy ra. Vui lòng thử lại.');
      console.error(err);
    }
  });

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" scroll="paper">
      <DialogTitle>{isEdit ? 'Sửa ghi chú' : 'Tạo ghi chú mới'}</DialogTitle>

      <Divider />

      <Form methods={methods} onSubmit={onSubmit}>
        <DialogContent sx={{ px: 3, py: 2.5 }}>
          <Stack spacing={3}>
            {/* Type picker — isolated so type changes don't re-render the editor */}
            <NoteTypePicker isEdit={isEdit} />

            {/* Title */}
            <Field.Text
              name="title"
              label="Tiêu đề"
              placeholder="Nhập tiêu đề ghi chú..."
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
              helperText="Thẻ giúp gom nhóm và lọc ghi chú."
            />

            {/* Content — markdown editor (lazy-loaded via Field.Editor / RHFEditor) */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Nội dung
              </Typography>
              <Field.Editor name="content" placeholder="Viết ghi chú của bạn ở đây..." />
            </Box>
          </Stack>
        </DialogContent>

        <Divider />

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} color="inherit" disabled={isSubmitting}>
            Huỷ
          </Button>
          <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
            {isEdit ? 'Lưu thay đổi' : 'Tạo ghi chú'}
          </LoadingButton>
        </DialogActions>
      </Form>
    </Dialog>
  );
}
