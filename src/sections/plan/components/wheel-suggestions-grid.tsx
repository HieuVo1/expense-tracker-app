'use client';

import type { WheelScores, WheelSuggestion } from 'src/lib/ai/wheel-types';

import { useState } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';

import { WheelSuggestionCard } from './wheel-suggestion-card';

// ----------------------------------------------------------------------

const COLLAPSED_LIMIT = 4;

type Props = {
  suggestions: WheelSuggestion[];
  scores: WheelScores;
  creatingArea: string | null;
  onCreateTask: (s: WheelSuggestion) => void;
};

export function WheelSuggestionsGrid({
  suggestions,
  scores,
  creatingArea,
  onCreateTask,
}: Props) {
  const [showAll, setShowAll] = useState(false);

  // Filter weak areas + sort ascending by score
  const sorted = [...suggestions].sort((a, b) => scores[a.area] - scores[b.area]);
  const visible = showAll ? sorted : sorted.slice(0, COLLAPSED_LIMIT);

  if (sorted.length === 0) return null;

  return (
    <Box>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
          gap: 2,
        }}
      >
        {visible.map((s, idx) => (
          <WheelSuggestionCard
            key={`${s.area}-${idx}`}
            suggestion={s}
            score={scores[s.area]}
            onCreateTask={onCreateTask}
            isCreating={creatingArea === `${s.area}-${idx}`}
          />
        ))}
      </Box>

      {sorted.length > COLLAPSED_LIMIT && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Button size="small" onClick={() => setShowAll((v) => !v)} color="inherit">
            {showAll ? 'Thu gọn' : `Xem thêm (${sorted.length - COLLAPSED_LIMIT})`}
          </Button>
        </Box>
      )}
    </Box>
  );
}
