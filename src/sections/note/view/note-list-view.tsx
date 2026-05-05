import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import { DashboardContent } from 'src/layouts/dashboard';

import { listNotes } from '../actions/note-actions';
import { NoteListClient } from './note-list-client';

// ----------------------------------------------------------------------

export async function NoteListView() {
  const notes = await listNotes();

  return (
    <DashboardContent>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ mb: 0.5 }}>
          Ghi chú
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Ghi lại hiểu biết, điểm mạnh, điểm yếu và ý tưởng của bạn.
        </Typography>
      </Box>

      <NoteListClient initial={notes} />
    </DashboardContent>
  );
}
