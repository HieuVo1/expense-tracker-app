'use client';

import type { NoteRow } from '../types';

import Box from '@mui/material/Box';

import { NoteListItem } from './note-list-item';

// ----------------------------------------------------------------------

type NoteListProps = {
  notes: NoteRow[];
  onView: (note: NoteRow) => void;
  onEdit: (note: NoteRow) => void;
  onDelete: (note: NoteRow) => void;
};

export function NoteList({ notes, onView, onEdit, onDelete }: NoteListProps) {
  return (
    <Box
      sx={{
        display: 'grid',
        gap: 2,
        gridTemplateColumns: {
          xs: '1fr',
          sm: 'repeat(2, 1fr)',
          md: 'repeat(3, 1fr)',
        },
      }}
    >
      {notes.map((note) => (
        <NoteListItem
          key={note.id}
          note={note}
          onView={onView}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </Box>
  );
}
