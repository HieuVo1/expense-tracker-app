'use client';

import type { NoteType } from '@prisma/client';
import type { NoteRow } from '../types';

import { useMemo, useState, useCallback } from 'react';

import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';

import { Iconify } from 'src/components/iconify';

import { NoteList } from '../components/note-list';
import { deleteNote } from '../actions/note-actions';
import { NoteFilterBar } from '../components/note-filter-bar';
import { NoteEmptyState } from '../components/note-empty-state';
import { NoteEditDialog } from '../components/note-edit-dialog';
import { NoteDetailDialog } from '../components/note-detail-dialog';

// ----------------------------------------------------------------------

type ActiveType = NoteType | 'all';

type NoteListClientProps = {
  initial: NoteRow[];
};

export function NoteListClient({ initial }: NoteListClientProps) {
  const [activeType, setActiveType] = useState<ActiveType>('all');
  const [query, setQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Dialog state
  const [viewNote, setViewNote] = useState<NoteRow | null>(null);
  const [editNote, setEditNote] = useState<NoteRow | null | undefined>(undefined); // undefined = closed
  const [createOpen, setCreateOpen] = useState(false);

  // All unique tags across the user's notes — sorted alphabetically.
  const allTags = useMemo(() => {
    const set = new Set<string>();
    initial.forEach((n) => n.tags.forEach((t) => set.add(t)));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [initial]);

  const filtered = useMemo(() => {
    let rows = initial;

    if (activeType !== 'all') {
      rows = rows.filter((r) => r.type === activeType);
    }

    if (selectedTags.length > 0) {
      // OR semantic: note matches if it has ANY of the selected tags
      // (matches Obsidian's tag pane click behavior).
      rows = rows.filter((r) => r.tags.some((t) => selectedTags.includes(t)));
    }

    if (query.trim()) {
      const q = query.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.content.toLowerCase().includes(q) ||
          r.tags.some((t) => t.includes(q))
      );
    }

    return rows;
  }, [initial, activeType, query, selectedTags]);

  const isFiltered =
    activeType !== 'all' || query.trim() !== '' || selectedTags.length > 0;

  const handleDelete = useCallback(async (note: NoteRow) => {
    try {
      await deleteNote(note.id);
    } catch {
      // toast shown by action caller; revalidatePath re-fetches server component
    }
  }, []);

  const handleOpenEdit = useCallback((note: NoteRow) => {
    setViewNote(null);
    setEditNote(note);
  }, []);

  const handleCloseEdit = useCallback(() => {
    setEditNote(undefined);
  }, []);

  return (
    <Stack spacing={3}>
      <Stack direction="row" alignItems="flex-start" justifyContent="flex-end">
        <Button
          variant="contained"
          startIcon={<Iconify icon="mingcute:add-line" />}
          onClick={() => setCreateOpen(true)}
        >
          Tạo ghi chú
        </Button>
      </Stack>

      <NoteFilterBar
        activeType={activeType}
        query={query}
        allTags={allTags}
        selectedTags={selectedTags}
        onTypeChange={setActiveType}
        onQueryChange={setQuery}
        onTagsChange={setSelectedTags}
      />

      {filtered.length === 0 ? (
        <NoteEmptyState
          filtered={isFiltered && initial.length > 0}
          onCreate={initial.length === 0 ? () => setCreateOpen(true) : undefined}
        />
      ) : (
        <NoteList
          notes={filtered}
          onView={setViewNote}
          onEdit={handleOpenEdit}
          onDelete={handleDelete}
        />
      )}

      {/* Detail dialog */}
      <NoteDetailDialog
        note={viewNote}
        open={!!viewNote}
        onClose={() => setViewNote(null)}
        onEdit={handleOpenEdit}
        onDelete={handleDelete}
      />

      {/* Edit dialog */}
      <NoteEditDialog
        open={editNote !== undefined}
        note={editNote ?? null}
        knownTags={allTags}
        onClose={handleCloseEdit}
      />

      {/* Create dialog */}
      <NoteEditDialog
        open={createOpen}
        note={null}
        knownTags={allTags}
        onClose={() => setCreateOpen(false)}
      />
    </Stack>
  );
}
