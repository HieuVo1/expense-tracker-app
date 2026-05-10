import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';

import { listNotes } from '../actions/note-actions';
import { NoteListClient } from './note-list-client';

// ----------------------------------------------------------------------

export async function NoteListView() {
  const notes = await listNotes();

  return (
    <DashboardContent>
      <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'flex-start' }} justifyContent="space-between" gap={2} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ mb: 0.5 }}>
            Nhật ký
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Nhật ký hàng ngày của bạn.
          </Typography>
        </Box>

        <Button
          variant="outlined"
          size="small"
          href={paths.dashboard.aboutMe}
          endIcon={<Iconify icon="eva:arrow-ios-forward-fill" width={16} />}
          sx={{ flexShrink: 0, whiteSpace: 'nowrap' }}
        >
          Sang Về tôi
        </Button>
      </Stack>

      <NoteListClient initial={notes} />
    </DashboardContent>
  );
}
