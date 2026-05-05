'use client';

import type { NoteRow } from '../types';

import dynamic from 'next/dynamic';

import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';

import { fDate } from 'src/utils/format-time';

import { Iconify } from 'src/components/iconify';

import { NOTE_TYPE_ICONS, NOTE_TYPE_LABELS, NOTE_TYPE_COLORS } from '../constants/note-types';

// ----------------------------------------------------------------------

// Lazy-load Editor so the 150KB bundle only loads when dialog opens
const Editor = dynamic(
  () => import('src/components/editor').then((m) => ({ default: m.Editor })),
  {
    ssr: false,
    loading: () => (
      <Stack alignItems="center" justifyContent="center" sx={{ minHeight: 200 }}>
        <CircularProgress size={32} />
      </Stack>
    ),
  }
);

// ----------------------------------------------------------------------

type NoteDetailDialogProps = {
  note: NoteRow | null;
  open: boolean;
  onClose: () => void;
  onEdit: (note: NoteRow) => void;
  onDelete: (note: NoteRow) => void;
};

export function NoteDetailDialog({ note, open, onClose, onEdit, onDelete }: NoteDetailDialogProps) {
  if (!note) return null;

  const typeColor = NOTE_TYPE_COLORS[note.type];
  const typeLabel = NOTE_TYPE_LABELS[note.type];
  const typeIcon = NOTE_TYPE_ICONS[note.type];

  const handleDelete = () => {
    if (window.confirm(`Xoá ghi chú "${note.title}"?`)) {
      onDelete(note);
      onClose();
    }
  };

  const handleEdit = () => {
    onEdit(note);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" scroll="paper">
      <DialogTitle sx={{ pb: 1 }}>
        <Stack spacing={1}>
          <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
            <Chip
              size="small"
              icon={<Iconify icon={typeIcon} width={14} />}
              label={typeLabel}
              sx={{
                backgroundColor: typeColor,
                color: '#fff',
                '& .MuiChip-icon': { color: '#fff' },
              }}
            />
            <Typography variant="caption" color="text.disabled">
              Cập nhật: {fDate(note.updatedAt)}
            </Typography>
          </Stack>
          <Typography variant="h6">{note.title}</Typography>
        </Stack>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ pt: 2 }}>
        <Editor value={note.content} editable={false} />
      </DialogContent>

      <Divider />

      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Đóng
        </Button>
        <Button
          onClick={handleDelete}
          color="error"
          startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
        >
          Xoá
        </Button>
        <Button
          onClick={handleEdit}
          variant="contained"
          startIcon={<Iconify icon="solar:pen-bold" />}
        >
          Sửa
        </Button>
      </DialogActions>
    </Dialog>
  );
}
