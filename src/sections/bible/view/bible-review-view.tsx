import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';

import { ChallengeGrid } from '../components/challenge-grid';
import { listThemes } from '../actions/bible-theme-actions';
import { getChallengeDeck } from '../actions/bible-challenge-actions';

// "Kho vũ khí" page — user's full arsenal of challenge→verse cards.
// Fetches every theme + the full deck (themeId: null). The client component
// renders one tab per theme that has at least 1 card, plus a "Tất cả" tab.
//
// SM-2 verse memorization (review-flashcard + listDueVerses) is intentionally
// not surfaced here anymore; the action files remain in the codebase for
// future re-introduction via a dedicated route if needed.

export async function BibleReviewView() {
  const [themes, deck] = await Promise.all([
    listThemes(),
    getChallengeDeck({ themeId: null }),
  ]);

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
            Kho vũ khí
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Câu kinh để chiến thắng thử thách
          </Typography>
        </Box>

        <ChallengeGrid themes={themes} deck={deck} />
      </Stack>
    </DashboardContent>
  );
}
