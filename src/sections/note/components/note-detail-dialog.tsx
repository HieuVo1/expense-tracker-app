'use client';

import type { NoteRow } from '../types';

import dynamic from 'next/dynamic';
import { useRef, useMemo } from 'react';

import Box from '@mui/material/Box';
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
import { Lightbox, useLightbox } from 'src/components/lightbox';

import { NOTE_TYPE_ICONS, NOTE_TYPE_LABELS, NOTE_TYPE_COLORS } from '../constants/note-types';

// ----------------------------------------------------------------------

// Lazy-load Editor so the 150KB bundle only loads when dialog opens
const Editor = dynamic(() => import('src/components/editor').then((m) => ({ default: m.Editor })), {
  ssr: false,
  loading: () => (
    <Stack alignItems="center" justifyContent="center" sx={{ minHeight: 200 }}>
      <CircularProgress size={32} />
    </Stack>
  ),
});

// ----------------------------------------------------------------------

type NoteDetailDialogProps = {
  note: NoteRow | null;
  open: boolean;
  onClose: () => void;
  onEdit: (note: NoteRow) => void;
  onDelete: (note: NoteRow) => void;
  onExited?: () => void;
};

export function NoteDetailDialog({
  note,
  open,
  onClose,
  onEdit,
  onDelete,
  onExited,
}: NoteDetailDialogProps) {
  // Keep last note in a ref so the Dialog can render its content during the
  // exit transition (after parent sets note=null). Without this the Dialog
  // unmounts instantly and onExited never fires — breaking the detail→edit
  // hand-off below.
  const lastNoteRef = useRef<NoteRow | null>(note);
  if (note) lastNoteRef.current = note;
  const view = note ?? lastNoteRef.current;

  // Hooks must run unconditionally — derive slides before any early return.
  const slides = useMemo(
    () => (view?.imageUrls ?? []).filter(Boolean).map((src) => ({ src })),
    [view]
  );
  const lightbox = useLightbox(slides);

  if (!view) return null;

  // Notes module only shows 'daily' type entries.
  const typeColor = NOTE_TYPE_COLORS['daily'];
  const typeLabel = NOTE_TYPE_LABELS['daily'];
  const typeIcon = NOTE_TYPE_ICONS['daily'];

  const handleDelete = () => {
    if (window.confirm(`Xoá ghi chú "${view.title}"?`)) {
      onDelete(view);
      onClose();
    }
  };

  const handleEdit = () => {
    // Parent's onEdit already closes this dialog (clears viewNote) and
    // queues edit-open for after our exit transition. No onClose() here —
    // calling it would cause two state updates that re-trigger render and
    // can break MUI's modal stack timing.
    onEdit(view);
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        fullWidth
        maxWidth="md"
        scroll="paper"
        slotProps={{ transition: { onExited } }}
      >
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
                Cập nhật: {fDate(view.updatedAt)}
              </Typography>
            </Stack>
            <Typography variant="h6">{view.title}</Typography>
            {view.tags.length > 0 && (
              <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                {view.tags.map((tag) => (
                  <Chip
                    key={tag}
                    size="small"
                    label={`#${tag}`}
                    variant="outlined"
                    sx={{ height: 22 }}
                  />
                ))}
              </Stack>
            )}
          </Stack>
        </DialogTitle>

        <Divider />

        <DialogContent sx={{ pt: 2 }}>
          <Editor value={view.content} editable={false} />

          {/* Attached images — private, shown via signed URLs. Tap to preview. */}
          {view.imageUrls.some((u) => u) && (
            <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mt: 2 }}>
              {view.imageUrls.map((url, i) =>
                url ? (
                  <Box
                    key={i}
                    onClick={() => lightbox.onOpen(url)}
                    sx={{
                      cursor: 'pointer',
                      width: 96,
                      height: 96,
                      borderRadius: 1,
                      overflow: 'hidden',
                      border: '1px solid',
                      borderColor: 'divider',
                      transition: (t) => t.transitions.create('opacity'),
                      '&:hover': { opacity: 0.85 },
                    }}
                  >
                    <Box
                      component="img"
                      src={url}
                      alt=""
                      sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                  </Box>
                ) : null
              )}
            </Stack>
          )}
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

      <Lightbox
        open={lightbox.open}
        close={lightbox.onClose}
        slides={slides}
        index={lightbox.selected}
        onGetCurrentIndex={(index) => lightbox.setSelected(index)}
        disableVideo
        disableSlideshow
        disableThumbnails
      />
    </>
  );
}
