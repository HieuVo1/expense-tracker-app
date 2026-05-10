'use client';

import type { AboutMeRow , GoalMetadata } from '../types';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';

import { fDate } from 'src/utils/format-time';

import { GOAL_KIND_CHIP, GOAL_KIND_LABELS, GOAL_STATUS_LABELS } from '../constants/about-me-copy';

// ----------------------------------------------------------------------

function GoalKindChip({ kind }: { kind: GoalMetadata['kind'] }) {
  const { bg, fg } = GOAL_KIND_CHIP[kind];
  return (
    <Box
      component="span"
      sx={{
        fontSize: 10,
        fontWeight: 600,
        px: 0.75,
        py: 0.125,
        borderRadius: 0.5,
        bgcolor: bg,
        color: fg,
        flexShrink: 0,
        lineHeight: 1.8,
      }}
    >
      {GOAL_KIND_LABELS[kind]}
    </Box>
  );
}

// ----------------------------------------------------------------------

type Props = {
  rows: AboutMeRow[];
};

export function AboutMeCardGoalBody({ rows }: Props) {
  if (rows.length === 0) return null;

  return (
    <>
      {rows.map((row) => {
        const meta = row.metadata as Partial<GoalMetadata> | null;
        const kind = meta?.kind ?? 'short';
        const status = meta?.status ?? 'active';
        const progress = meta?.progress;
        const targetDate = meta?.targetDate;
        const showProgress = status === 'active' && progress != null;

        return (
          <Box
            key={row.id}
            sx={{
              px: 1.5,
              py: 1.25,
              bgcolor: 'background.neutral',
              borderRadius: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: 0.5,
            }}
          >
            <Stack direction="row" alignItems="center" justifyContent="space-between" gap={0.75}>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 500,
                  flex: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontSize: 13,
                }}
              >
                {row.title}
              </Typography>
              <GoalKindChip kind={kind as GoalMetadata['kind']} />
            </Stack>

            <Stack direction="row" justifyContent="space-between">
              <Typography variant="caption" color="text.secondary">
                {GOAL_STATUS_LABELS[status as GoalMetadata['status']]}
              </Typography>
              {targetDate && (
                <Typography variant="caption" color="text.secondary" className="tabular">
                  {fDate(targetDate)}
                </Typography>
              )}
            </Stack>

            {showProgress && (
              <LinearProgress
                variant="determinate"
                value={progress}
                sx={{ height: 4, borderRadius: 1, mt: 0.25, bgcolor: 'divider' }}
              />
            )}
          </Box>
        );
      })}
    </>
  );
}
