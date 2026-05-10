import type { GoalMetadata } from '../types';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';

import { AboutMeHubClient } from './about-me-hub-client';
import { listAboutMe } from '../actions/about-me-actions';
import { getAboutMeStats } from '../actions/about-me-stats';
import { AboutMeStatsStrip } from '../components/about-me-stats-strip';
import { getSignalPatterns } from '../actions/about-me-signal-patterns';



// ----------------------------------------------------------------------

const SLICE = 3;

export async function AboutMeHubView() {
  const [allRows, stats, patterns] = await Promise.all([
    listAboutMe(),
    getAboutMeStats(),
    getSignalPatterns(),
  ]);

  // Group by type — top 3 most recent each (already ordered by updatedAt desc)
  const byType = {
    GOAL: allRows.filter((r) => r.type === 'GOAL').slice(0, SLICE),
    THOUGHT: allRows.filter((r) => r.type === 'THOUGHT').slice(0, SLICE),
    LESSON: allRows.filter((r) => r.type === 'LESSON').slice(0, SLICE),
    SIGNAL: allRows.filter((r) => r.type === 'SIGNAL').slice(0, SLICE),
    PRINCIPLE: allRows.filter((r) => r.type === 'PRINCIPLE').slice(0, SLICE),
    TRAIT: allRows.filter((r) => r.type === 'TRAIT').slice(0, SLICE),
    ACTION: allRows.filter((r) => r.type === 'ACTION').slice(0, SLICE),
  };

  // Active goal count for GOAL card header badge
  const activeGoalCount = byType.GOAL.filter(
    (r) => (r.metadata as Partial<GoalMetadata> | null)?.status === 'active'
  ).length;

  return (
    <DashboardContent>
      {/* Header */}
      <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'flex-start' }} justifyContent="space-between" gap={2} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
            <Box
              component="a"
              href={paths.dashboard.notes}
              sx={{ color: 'inherit', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
            >
              Nhật ký
            </Box>
            {' / '}
            Về tôi
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
            Về tôi
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Tuần này:{' '}
            <Box component="b" sx={{ color: 'primary.dark', fontWeight: 600 }}>
              {stats.weeklyNew} entry
            </Box>{' '}
            ·{' '}
            <Box component="b" sx={{ color: 'primary.dark', fontWeight: 600 }}>
              {patterns.negative.length + patterns.positive.length} tín hiệu cảm xúc
            </Box>
          </Typography>
        </Box>

      </Stack>

      {/* Stats strip */}
      <AboutMeStatsStrip stats={stats} />

      {/* 7-card bento grid — client shell handles dialog state */}
      <AboutMeHubClient
        patterns={patterns}
        cardData={{
          GOAL: { rows: byType.GOAL, activeGoalCount },
          THOUGHT: { rows: byType.THOUGHT },
          LESSON: { rows: byType.LESSON },
          SIGNAL: { rows: byType.SIGNAL },
          PRINCIPLE: { rows: byType.PRINCIPLE },
          TRAIT: { rows: byType.TRAIT },
          ACTION: { rows: byType.ACTION },
        }}
      />
    </DashboardContent>
  );
}
