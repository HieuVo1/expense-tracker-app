'use client';

import type { NoteRow } from '../types';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';

import { fDate } from 'src/utils/format-time';

import { Iconify } from 'src/components/iconify';

import { NOTE_TYPE_ICONS, NOTE_TYPE_LABELS, NOTE_TYPE_COLORS } from '../constants/note-types';

// ----------------------------------------------------------------------

// Strip markdown syntax for plain-text preview (no Editor import here)
function stripMarkdown(md: string): string {
  return md
    .replace(/[#*_>`~[\]()]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

type NoteListItemProps = {
  note: NoteRow;
  onView: (note: NoteRow) => void;
  onEdit: (note: NoteRow) => void;
  onDelete: (note: NoteRow) => void;
};

export function NoteListItem({ note, onView, onEdit, onDelete }: NoteListItemProps) {
  const preview = stripMarkdown(note.content).slice(0, 160);
  const typeColor = NOTE_TYPE_COLORS[note.type];
  const typeLabel = NOTE_TYPE_LABELS[note.type];
  const typeIcon = NOTE_TYPE_ICONS[note.type];

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Xoá ghi chú "${note.title}"?`)) {
      onDelete(note);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(note);
  };

  // Use a clickable Box (not CardActionArea) to allow nested IconButtons —
  // <button> inside <button> is invalid HTML and breaks hydration.
  return (
    <Card>
      <Box
        role="button"
        tabIndex={0}
        onClick={() => onView(note)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onView(note);
          }
        }}
        sx={{
          p: 2,
          cursor: 'pointer',
          transition: (theme) => theme.transitions.create('background-color'),
          '&:hover': { bgcolor: 'action.hover' },
          '&:focus-visible': { outline: 2, outlineColor: 'primary.main', outlineOffset: -2 },
        }}
      >
        <Stack spacing={1}>
          {/* Header row: type chip + actions */}
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Chip
              size="small"
              icon={<Iconify icon={typeIcon} width={14} />}
              label={typeLabel}
              sx={{
                backgroundColor: typeColor,
                color: '#fff',
                fontWeight: 'fontWeightMedium',
                '& .MuiChip-icon': { color: '#fff' },
              }}
            />
            <Stack direction="row" spacing={0.5} onClick={(e) => e.stopPropagation()}>
              <IconButton size="small" onClick={handleEdit} aria-label="Sửa">
                <Iconify icon="solar:pen-bold" width={16} />
              </IconButton>
              <IconButton size="small" onClick={handleDelete} aria-label="Xoá" color="error">
                <Iconify icon="solar:trash-bin-trash-bold" width={16} />
              </IconButton>
            </Stack>
          </Stack>

          {/* Title */}
          <Typography variant="subtitle2" noWrap>
            {note.title}
          </Typography>

          {/* Preview */}
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              minHeight: 40,
            }}
          >
            {preview || '—'}
          </Typography>

          {/* Tags (if any) */}
          {note.tags.length > 0 && (
            <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
              {note.tags.slice(0, 4).map((tag) => (
                <Chip
                  key={tag}
                  size="small"
                  label={`#${tag}`}
                  variant="outlined"
                  sx={{ height: 20, fontSize: 11 }}
                />
              ))}
              {note.tags.length > 4 && (
                <Chip
                  size="small"
                  label={`+${note.tags.length - 4}`}
                  variant="outlined"
                  sx={{ height: 20, fontSize: 11 }}
                />
              )}
            </Stack>
          )}

          {/* Updated at */}
          <Typography variant="caption" color="text.disabled">
            {fDate(note.updatedAt)}
          </Typography>
        </Stack>
      </Box>
    </Card>
  );
}
