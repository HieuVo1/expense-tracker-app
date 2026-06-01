import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';

import { BibleReviewClient } from './bible-review-client';
import { listThemes } from '../actions/bible-theme-actions';
import { listDueVerses } from '../actions/bible-review-actions';
import { getChallengeDeck } from '../actions/bible-challenge-actions';

type Props = {
  mode: 'sm2' | 'challenge';
  themeId: string | null;
};

export async function BibleReviewView({ mode, themeId }: Props) {
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

        <BibleReviewClientLoader mode={mode} themeId={themeId} />
      </Stack>
    </DashboardContent>
  );
}

// Inner async component that does the data fetch so BibleReviewView stays clean.
async function BibleReviewClientLoader({
  mode,
  themeId,
}: {
  mode: 'sm2' | 'challenge';
  themeId: string | null;
}) {
  if (mode === 'challenge') {
    const [themes, deck] = await Promise.all([
      listThemes(),
      getChallengeDeck({ themeId }),
    ]);
    return (
      <BibleReviewClient
        mode="challenge"
        themes={themes}
        deck={deck}
        selectedThemeId={themeId}
      />
    );
  }

  const sm2Cards = await listDueVerses();
  return <BibleReviewClient mode="sm2" sm2Cards={sm2Cards} />;
}
