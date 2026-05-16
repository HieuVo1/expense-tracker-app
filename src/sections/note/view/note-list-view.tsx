import { DashboardContent } from 'src/layouts/dashboard';

import { listNotes } from '../actions/note-actions';
import { NoteListClient } from './note-list-client';

// ----------------------------------------------------------------------

export async function NoteListView() {
  const notes = await listNotes();

  return (
    <DashboardContent>
      <NoteListClient initial={notes} />
    </DashboardContent>
  );
}
