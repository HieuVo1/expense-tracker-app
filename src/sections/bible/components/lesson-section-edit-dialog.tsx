'use client';

import type { LessonSectionKey } from '../types';

import dynamic from 'next/dynamic';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';

import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import CircularProgress from '@mui/material/CircularProgress';

import { updateLessonSection } from '../actions/bible-lesson-actions';

// Lazy-load TipTap so this dialog stays light until the user actually opens
// it. The view accordion does NOT use this — it renders markdown headlessly
// (Editor with editable=false hides the toolbar).
const Editor = dynamic(
  () => import('src/components/editor').then((m) => ({ default: m.Editor })),
  {
    ssr: false,
    loading: () => (
      <Stack alignItems="center" justifyContent="center" sx={{ minHeight: 300 }}>
        <CircularProgress size={28} />
      </Stack>
    ),
  }
);

type Props = {
  open: boolean;
  onClose: () => void;
  lessonId: string;
  section: LessonSectionKey;
  sectionTitle: string;
  initialContent: string;
};

export function LessonSectionEditDialog({
  open,
  onClose,
  lessonId,
  section,
  sectionTitle,
  initialContent,
}: Props) {
  const [content, setContent] = useState(initialContent);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setContent(initialContent);
  }, [open, initialContent]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateLessonSection({ id: lessonId, section, content });
      toast.success('Đã lưu');
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi lưu');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="md" scroll="paper">
      <DialogTitle>Sửa: {sectionTitle}</DialogTitle>
      <Divider />
      <DialogContent sx={{ px: 3, py: 2.5 }}>
        <Editor
          value={content}
          onChange={setContent}
          placeholder="Viết nội dung bằng markdown — # tiêu đề, ** bold, - bullet..."
          sx={{ minHeight: 360 }}
        />
      </DialogContent>
      <Divider />
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} color="inherit" disabled={saving}>
          Huỷ
        </Button>
        <LoadingButton variant="contained" onClick={handleSave} loading={saving}>
          Lưu thay đổi
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}
