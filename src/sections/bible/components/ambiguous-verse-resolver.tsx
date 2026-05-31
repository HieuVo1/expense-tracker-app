'use client';

import { toast } from 'sonner';
import { useState } from 'react';

import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { Iconify } from 'src/components/iconify';

import { BOOKS } from '../lib/book-map';
import { resolveAmbiguousVerse } from '../actions/bible-lesson-actions';

type Props = {
  verseId: string;
  ambiguousBookName: string;
  chapter: number;
  startVerse: number;
  endVerse: number;
};

export function AmbiguousVerseResolver({
  verseId,
  ambiguousBookName,
  chapter,
  startVerse,
  endVerse,
}: Props) {
  const [open, setOpen] = useState(false);
  const [bookCode, setBookCode] = useState('');
  const [busy, setBusy] = useState(false);

  const range = startVerse === endVerse ? `${startVerse}` : `${startVerse}-${endVerse}`;

  const handleResolve = async () => {
    if (!bookCode) return;
    setBusy(true);
    try {
      await resolveAmbiguousVerse({ verseId, bookCode });
      toast.success('Đã làm rõ sách + tải nội dung câu kinh');
      setOpen(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Lỗi không xác định';
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Button
        size="small"
        variant="outlined"
        color="warning"
        startIcon={<Iconify icon="solar:danger-bold" />}
        onClick={() => setOpen(true)}
      >
        Làm rõ sách
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Làm rõ sách Kinh Thánh</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Typography variant="body2">
              Tên sách <strong>&ldquo;{ambiguousBookName}&rdquo;</strong> chương {chapter}:{range}{' '}
              khớp nhiều sách. Chọn sách đúng:
            </Typography>
            <TextField
              select
              label="Sách"
              value={bookCode}
              onChange={(e) => setBookCode(e.target.value)}
              size="small"
              fullWidth
            >
              {BOOKS.map((b) => (
                <MenuItem key={b.code} value={b.code}>
                  {b.vn} ({b.code})
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} disabled={busy}>
            Huỷ
          </Button>
          <Button variant="contained" onClick={handleResolve} disabled={!bookCode || busy}>
            {busy ? 'Đang tải...' : 'Làm rõ'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
