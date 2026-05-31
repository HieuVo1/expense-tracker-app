'use client';

import { toast } from 'sonner';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';

import { Iconify } from 'src/components/iconify';

import { importLessonFile } from '../actions/bible-lesson-import';

type Props = {
  open: boolean;
  onClose: () => void;
};

// File-picker → POST → redirect to lesson detail. We deliberately do NOT show
// progress per ref because chunked fetch finishes inside a single action call;
// total wait is <12s typical. A spinner + disabled state covers the wait.

export function ImportLessonDialog({ open, onClose }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handlePick = () => inputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
  };

  const handleImport = async () => {
    if (!file) return;
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const result = await importLessonFile(fd);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      const parts = [`Đã tạo bài học (${result.verseCount} câu kinh)`];
      if (result.ambiguousCount > 0) {
        parts.push(`${result.ambiguousCount} câu cần làm rõ sách`);
      }
      if (result.malformedCount > 0) {
        parts.push(`${result.malformedCount} dòng không đọc được`);
      }
      toast.success(parts.join(' · '));
      onClose();
      router.push(paths.dashboard.bible.lessonDetail(result.lessonId));
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Lỗi không xác định';
      toast.error(`Import thất bại: ${msg}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (submitting) return;
    setFile(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Import bài học Kinh Thánh</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Alert severity="info" variant="outlined">
            Tệp <code>.md</code> theo template <code>bible-lesson-v1</code>. AI sẽ tự lấy nội dung
            câu kinh từ bible.com cho mỗi reference ở section &ldquo;## 2. Câu kinh trong bài&rdquo;.
          </Alert>

          <input
            ref={inputRef}
            type="file"
            accept=".md,text/markdown"
            hidden
            onChange={handleFileChange}
          />

          <Box
            onClick={handlePick}
            sx={(theme) => ({
              p: 3,
              border: '1px dashed',
              borderColor: file ? 'primary.main' : 'divider',
              borderRadius: 1,
              cursor: 'pointer',
              textAlign: 'center',
              transition: theme.transitions.create('border-color'),
              '&:hover': { borderColor: 'primary.main' },
            })}
          >
            <Iconify
              icon={file ? 'solar:file-text-bold' : 'solar:import-bold'}
              width={40}
              sx={{ color: file ? 'primary.main' : 'text.secondary', mb: 1 }}
            />
            <Typography variant="body2" color={file ? 'text.primary' : 'text.secondary'}>
              {file ? file.name : 'Chọn tệp .md'}
            </Typography>
            {file && (
              <Typography variant="caption" color="text.secondary">
                {(file.size / 1024).toFixed(1)} KB
              </Typography>
            )}
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={submitting}>
          Huỷ
        </Button>
        <Button
          variant="contained"
          onClick={handleImport}
          disabled={!file || submitting}
          startIcon={
            submitting ? <CircularProgress size={16} color="inherit" /> : <Iconify icon="solar:import-bold" />
          }
        >
          {submitting ? 'Đang xử lý...' : 'Import'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
