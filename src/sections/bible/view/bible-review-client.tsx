'use client';

import type { ThemeRow, ReviewCardRow, ChallengeCardRow } from '../types';

import { useRouter, useSearchParams } from 'next/navigation';

import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Stack from '@mui/material/Stack';

import { paths } from 'src/routes/paths';

import { ReviewFlashcard } from '../components/review-flashcard';
import { ChallengeFlashcard } from '../components/challenge-flashcard';

type Props =
  | { mode: 'sm2'; sm2Cards: ReviewCardRow[] }
  | {
      mode: 'challenge';
      themes: ThemeRow[];
      deck: ChallengeCardRow[];
      selectedThemeId: string | null;
    };

export function BibleReviewClient(props: Props) {
  const router = useRouter();
  const sp = useSearchParams();

  const switchMode = (m: 'sm2' | 'challenge') => {
    const next = new URLSearchParams(sp.toString());
    next.set('mode', m);
    if (m === 'sm2') next.delete('themeId');
    router.replace(`?${next.toString()}`);
  };

  return (
    <Stack spacing={2}>
      <Tabs
        value={props.mode}
        onChange={(_, v) => switchMode(v as 'sm2' | 'challenge')}
        variant="fullWidth"
      >
        <Tab value="challenge" label="Theo thử thách" />
        <Tab value="sm2" label="Học thuộc" />
      </Tabs>

      {props.mode === 'sm2' && (
        <ReviewFlashcard
          cards={props.sm2Cards}
          emptyHref={paths.dashboard.bible.root}
        />
      )}

      {props.mode === 'challenge' && (
        <ChallengeFlashcard
          themes={props.themes}
          deck={props.deck}
          selectedThemeId={props.selectedThemeId}
        />
      )}
    </Stack>
  );
}
