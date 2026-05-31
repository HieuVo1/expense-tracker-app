import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';

import { listDueVerses } from '../actions/bible-review-actions';
import { ReviewFlashcard } from '../components/review-flashcard';

export async function BibleReviewView() {
  const cards = await listDueVerses();

  return (
    <DashboardContent>
      <Stack spacing={3}>
        <Box>
          <Link
            href={paths.dashboard.bible.root}
            underline="hover"
            color="text.secondary"
            sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}
          >
            <Iconify icon="eva:arrow-ios-back-fill" width={16} />
            <Typography variant="body2">Học tập</Typography>
          </Link>
          <Typography variant="h4" sx={{ mt: 0.5 }}>
            Ôn tập câu kinh
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Lật thẻ → đọc lại trong đầu → bấm mức nhớ. Lịch ôn tự điều chỉnh (SM-2).
          </Typography>
        </Box>

        <ReviewFlashcard cards={cards} emptyHref={paths.dashboard.bible.root} />
      </Stack>
    </DashboardContent>
  );
}
