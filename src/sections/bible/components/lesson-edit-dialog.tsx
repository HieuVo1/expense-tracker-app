'use client';

import { z } from 'zod';
import dayjs from 'dayjs';
import { toast } from 'sonner';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { Form, Field } from 'src/components/hook-form';

import { updateLesson } from '../actions/bible-lesson-actions';

// Edit lesson metadata (title + date). Verses + raw markdown are immutable
// post-import — re-importing the .md file is the path for content changes.

const formSchema = z.object({
  title: z.string().trim().min(1, 'Tiêu đề không được trống').max(200, 'Tối đa 200 ký tự'),
  date: z.string().min(1, 'Cần chọn ngày'),
});
type FormValues = z.infer<typeof formSchema>;

type Props = {
  open: boolean;
  onClose: () => void;
  lesson: { id: string; title: string; date: string };
};

export function LessonEditDialog({ open, onClose, lesson }: Props) {
  const methods = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { title: lesson.title, date: lesson.date },
  });

  const {
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = methods;

  useEffect(() => {
    if (open) reset({ title: lesson.title, date: lesson.date });
  }, [open, lesson, reset]);

  const onSubmit = handleSubmit(async (data) => {
    try {
      const isoDay = dayjs(data.date).format('YYYY-MM-DD');
      await updateLesson({ id: lesson.id, title: data.title.trim(), date: isoDay });
      toast.success('Đã cập nhật bài học');
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi lưu');
    }
  });

  return (
    <Dialog
      open={open}
      onClose={isSubmitting ? undefined : onClose}
      fullWidth
      maxWidth="sm"
      scroll="paper"
    >
      <DialogTitle>Sửa bài học</DialogTitle>
      <Divider />
      <Form methods={methods} onSubmit={onSubmit}>
        <DialogContent sx={{ px: 3, py: 2.5 }}>
          <Stack spacing={3}>
            <Field.Text
              name="title"
              label="Tiêu đề"
              placeholder="Nhập tiêu đề bài học..."
              slotProps={{ htmlInput: { maxLength: 200 } }}
            />
            <Field.DatePicker name="date" label="Ngày" format="DD/MM/YYYY" />
          </Stack>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} color="inherit" disabled={isSubmitting}>
            Huỷ
          </Button>
          <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
            Lưu thay đổi
          </LoadingButton>
        </DialogActions>
      </Form>
    </Dialog>
  );
}
