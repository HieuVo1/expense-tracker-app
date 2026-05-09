'use client';

import type { NoteType } from '@prisma/client';
import type { NoteRow } from '../types';

import { useRef, useMemo, useState, useCallback } from 'react';

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
  // Single edit-dialog state covers both create + edit modes:
  //   undefined = closed | null = create | NoteRow = edit
  // Two NoteEditDialog instances mounted simultaneously caused the save button
  // to become unresponsive when modal stacks overlapped — keep just one.
  const [editorTarget, setEditorTarget] =
    useState<NoteRow | null | undefined>(undefined);
  // Note queued from detail dialog "Sửa" click — opens edit dialog only after
  // detail dialog finishes its exit transition. Stacking two MUI Dialogs while
  // both are mid-transition can leave the resulting dialog unresponsive
  // (focus trap and backdrop pointer-events get out of sync).
  const [pendingEdit, setPendingEdit] = useState<NoteRow | null>(null);

  const viewNoteRef = useRef(viewNote);
  viewNoteRef.current = viewNote;

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
    // If detail dialog is currently open, queue the edit to fire after its
    // exit transition completes (see pendingEdit + onExited below).
    // Otherwise open edit dialog immediately (called directly from list).
    if (viewNoteRef.current) {
      setPendingEdit(note);
      setViewNote(null);
    } else {
      setEditorTarget(note);
    }
  }, []);

  const handleOpenCreate = useCallback(() => {
    setEditorTarget(null); // null = create mode
  }, []);

  const handleCloseEditor = useCallback(() => {
    setEditorTarget(undefined);
  }, []);

  const handleDetailExited = useCallback(() => {
    if (pendingEdit) {
      setEditorTarget(pendingEdit);
      setPendingEdit(null);
    }
  }, [pendingEdit]);

  return (
    <Stack spacing={3}>
      <Stack direction="row" alignItems="flex-start" justifyContent="flex-end">
        <Button
          variant="contained"
          startIcon={<Iconify icon="mingcute:add-line" />}
          onClick={handleOpenCreate}
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
          onCreate={initial.length === 0 ? handleOpenCreate : undefined}
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
        onExited={handleDetailExited}
      />

      {/* Editor dialog — single instance handles both create + edit modes */}
      <NoteEditDialog
        open={editorTarget !== undefined}
        note={editorTarget ?? null}
        knownTags={allTags}
        onClose={handleCloseEditor}
      />
    </Stack>
  );
}
