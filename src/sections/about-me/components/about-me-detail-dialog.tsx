'use client';

import type { ReactNode } from 'react';
import type { AboutMeRow, GoalMetadata } from '../types';

import { useMemo, useState } from 'react';

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
import LinearProgress from '@mui/material/LinearProgress';

import { fDate } from 'src/utils/format-time';

import { Lightbox, useLightbox } from 'src/components/lightbox';

import { AboutMeEditDialog } from './about-me-edit-dialog';
import { AboutMeDeleteConfirm } from './about-me-delete-confirm';
import { ABOUT_ME_TYPE_LABELS, ABOUT_ME_TYPE_COLORS } from '../constants/about-me-types';
import {
  SOURCE_LABELS,
  GOAL_KIND_LABELS,
  TRAIT_KIND_LABELS,
  GOAL_STATUS_LABELS,
  SIGNAL_KIND_LABELS,
  ACTION_STATUS_LABELS,
} from '../constants/about-me-copy';

// ----------------------------------------------------------------------

function MetaRow({ label, value }: { label: string; value: string }): ReactNode {
  return (
    <Stack direction="row" gap={1} alignItems="baseline">
      <Typography variant="caption" color="text.secondary" sx={{ minWidth: 80, flexShrink: 0 }}>
        {label}
      </Typography>
      <Typography variant="body2">{value}</Typography>
    </Stack>
  );
}

function renderGoalMeta(row: AboutMeRow): ReactNode {
  const meta = row.metadata as Partial<GoalMetadata> | null;
  if (!meta) return null;
  const showProgress = meta.status === 'active' && meta.progress != null;
  return (
    <Stack spacing={1}>
      {meta.kind && <MetaRow label="Loại" value={GOAL_KIND_LABELS[meta.kind]} />}
      {meta.status && <MetaRow label="Trạng thái" value={GOAL_STATUS_LABELS[meta.status]} />}
      {meta.targetDate && <MetaRow label="Hạn" value={fDate(meta.targetDate)} />}
      {showProgress && (
        <Box>
          <Typography variant="caption" color="text.secondary">
            Tiến độ: {meta.progress}%
          </Typography>
          <LinearProgress
            variant="determinate"
            value={meta.progress}
            sx={{ mt: 0.5, height: 6, borderRadius: 1 }}
          />
        </Box>
      )}
    </Stack>
  );
}

function renderLessonMeta(row: AboutMeRow): ReactNode {
  const source = (row.metadata as Record<string, unknown> | null)?.source;
  if (typeof source !== 'string') return null;
  return (
    <MetaRow label="Nguồn" value={SOURCE_LABELS[source as keyof typeof SOURCE_LABELS] ?? source} />
  );
}

function renderSignalMeta(row: AboutMeRow): ReactNode {
  const meta = row.metadata as Record<string, unknown> | null;
  if (!meta) return null;
  const kind = typeof meta.kind === 'string' ? meta.kind : null;
  const trigger = typeof meta.trigger === 'string' ? meta.trigger : null;
  const emotion = typeof meta.emotion === 'string' ? meta.emotion : null;
  const meaning = typeof meta.meaning === 'string' ? meta.meaning : null;
  const action = typeof meta.action === 'string' ? meta.action : null;
  return (
    <Stack spacing={0.75}>
      {kind && (
        <MetaRow label="Loại" value={SIGNAL_KIND_LABELS[kind as 'positive' | 'negative'] ?? kind} />
      )}
      {trigger && <MetaRow label="Trigger" value={trigger} />}
      {emotion && <MetaRow label="Cảm xúc" value={emotion} />}
      {meaning && <MetaRow label="Ý nghĩa" value={meaning} />}
      {action && <MetaRow label="Hành động" value={action} />}
    </Stack>
  );
}

function renderActionMeta(row: AboutMeRow): ReactNode {
  const meta = row.metadata as Record<string, unknown> | null;
  if (!meta) return null;
  const status = typeof meta.status === 'string' ? meta.status : null;
  const dueDate = typeof meta.dueDate === 'string' ? meta.dueDate : null;
  return (
    <Stack spacing={0.75}>
      {status && (
        <MetaRow
          label="Trạng thái"
          value={ACTION_STATUS_LABELS[status as keyof typeof ACTION_STATUS_LABELS] ?? status}
        />
      )}
      {dueDate && <MetaRow label="Hạn" value={fDate(dueDate)} />}
    </Stack>
  );
}

function renderTraitMeta(row: AboutMeRow): ReactNode {
  const kind = (row.metadata as Record<string, unknown> | null)?.kind;
  if (typeof kind !== 'string') return null;
  return (
    <MetaRow label="Loại" value={TRAIT_KIND_LABELS[kind as 'strength' | 'weakness'] ?? kind} />
  );
}

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  row: AboutMeRow | null;
  onClose: () => void;
};

export function AboutMeDetailDialog({ open, row, onClose }: Props) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Hooks must run unconditionally — derive slides from a possibly-null row.
  const slides = useMemo(
    () => (row?.imageUrls ?? []).filter(Boolean).map((src) => ({ src })),
    [row]
  );
  const lightbox = useLightbox(slides);

  if (!row) return null;

  return (
    <>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" scroll="paper">
        <DialogTitle>
          <Stack direction="row" alignItems="center" gap={1}>
            <Chip
              label={ABOUT_ME_TYPE_LABELS[row.type]}
              size="small"
              sx={{ bgcolor: ABOUT_ME_TYPE_COLORS[row.type], fontWeight: 600, fontSize: 12 }}
            />
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              {row.title}
            </Typography>
          </Stack>
        </DialogTitle>

        <Divider />

        <DialogContent sx={{ px: 3, py: 2.5 }}>
          <Stack spacing={2}>
            {row.type === 'GOAL' && renderGoalMeta(row)}
            {row.type === 'LESSON' && renderLessonMeta(row)}
            {row.type === 'SIGNAL' && renderSignalMeta(row)}
            {row.type === 'ACTION' && renderActionMeta(row)}
            {row.type === 'TRAIT' && renderTraitMeta(row)}

            {/* Attached images — private, shown via signed URLs. Tap to preview. */}
            {row.imageUrls.some((u) => u) && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {row.imageUrls.map((url, i) =>
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
              </Box>
            )}

            {/* Content — written via TipTap, rendered as escaped plain text.
                Using whiteSpace: pre-wrap so newlines are preserved without
                dangerouslySetInnerHTML — React escapes HTML automatically,
                preventing XSS from any script/img/link tags the user may have typed. */}
            {row.content && (
              <>
                <Divider />
                <Typography
                  variant="body2"
                  sx={{ lineHeight: 1.7, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
                >
                  {row.content}
                </Typography>
              </>
            )}

            <Typography variant="caption" color="text.disabled">
              Cập nhật: {fDate(row.updatedAt)}
            </Typography>
          </Stack>
        </DialogContent>

        <Divider />

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button color="error" variant="outlined" size="small" onClick={() => setDeleteOpen(true)}>
            Xoá
          </Button>
          <Box sx={{ flex: 1 }} />
          <Button color="inherit" onClick={onClose}>
            Đóng
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              onClose();
              setEditOpen(true);
            }}
          >
            Sửa
          </Button>
        </DialogActions>
      </Dialog>

      <AboutMeEditDialog
        open={editOpen}
        type={row.type}
        row={row}
        onClose={() => setEditOpen(false)}
      />

      <AboutMeDeleteConfirm
        open={deleteOpen}
        row={row}
        onClose={() => setDeleteOpen(false)}
        onDeleted={onClose}
      />

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
