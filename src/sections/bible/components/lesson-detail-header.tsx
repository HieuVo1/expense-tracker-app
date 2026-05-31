'use client';

import { toast } from 'sonner';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { paths } from 'src/routes/paths';

import { fDate } from 'src/utils/format-time';

import { Iconify } from 'src/components/iconify';

import { LessonEditDialog } from './lesson-edit-dialog';
import { deleteLesson } from '../actions/bible-lesson-actions';

// Client-side header for the lesson detail page: breadcrumb + title + edit
// pencil + meta row. Kept thin — the actual edit form lives in
// LessonEditDialog. Server view stays a pure server component this way.

type Props = {
  lesson: {
    id: string;
    title: string;
    date: string;
    verseCount: number;
    bibleVersion: string;
  };
};

export function LessonDetailHeader({ lesson }: Props) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteLesson({ id: lesson.id });
      toast.success('Đã xoá bài học');
      router.push(paths.dashboard.bible.root);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi xoá');
      setDeleting(false);
    }
  };

  return (
    <Box>
      <Link
        href={paths.dashboard.bible.root}
        underline="hover"
        color="text.secondary"
        sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}
      >
        <Iconify icon="eva:arrow-ios-back-fill" width={16} />
        <Typography variant="body2">Học tập</Typography>
      </Link>

      <Stack direction="row" alignItems="center" gap={1} sx={{ mt: 0.5 }}>
        <Typography variant="h4">{lesson.title}</Typography>
        <Tooltip title="Sửa bài học">
          <IconButton size="small" onClick={() => setEditOpen(true)}>
            <Iconify icon="solar:pen-bold" width={18} />
          </IconButton>
        </Tooltip>
        <Tooltip title="Xoá bài học">
          <IconButton size="small" color="error" onClick={() => setDeleteOpen(true)}>
            <Iconify icon="solar:trash-bin-trash-bold" width={18} />
          </IconButton>
        </Tooltip>
      </Stack>

      <Typography variant="body2" color="text.secondary">
        {fDate(lesson.date, 'DD/MM/YYYY')} · {lesson.verseCount} câu kinh · {lesson.bibleVersion}
      </Typography>

      <LessonEditDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        lesson={{ id: lesson.id, title: lesson.title, date: lesson.date }}
      />

      <Dialog open={deleteOpen} onClose={deleting ? undefined : () => setDeleteOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Xoá bài học?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Bài học &ldquo;{lesson.title}&rdquo; sẽ bị xoá vĩnh viễn. Câu kinh trong các bài khác
            không bị ảnh hưởng.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)} disabled={deleting}>
            Huỷ
          </Button>
          <Button color="error" variant="contained" onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Đang xoá...' : 'Xoá'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
