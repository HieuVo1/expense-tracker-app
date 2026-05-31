import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';
import { SummaryCard } from 'src/components/summary-card';

import { BibleHubClient } from './bible-hub-client';
import { listThemes } from '../actions/bible-theme-actions';
import { listLessons } from '../actions/bible-lesson-actions';
import { getDueCount } from '../actions/bible-review-actions';

// Server component — fetches stats + lesson list, passes to client for the
// import dialog + nav buttons. Stat cards use shared SummaryCard for visual
// consistency with /dashboard/about-me and the rest of the app.

export async function BibleHubView() {
  const [lessons, themes, dueCount] = await Promise.all([
    listLessons(),
    listThemes(),
    getDueCount(),
  ]);

  const verseCount = lessons.reduce((sum, l) => sum + l.verseCount, 0);

  return (
    <DashboardContent>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h4">Học tập</Typography>
          <Typography variant="body2" color="text.secondary">
            Bài học hằng ngày + câu kinh theo chủ đề + ôn tập SM-2
          </Typography>
        </Box>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <SummaryCard
              title="Bài học"
              total={lessons.length}
              percent={0}
              color="info"
              icon={<Iconify icon="solar:notebook-bold-duotone" width={48} />}
              chart={{ series: [], categories: [] }}
              format="number"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <SummaryCard
              title="Câu kinh"
              total={verseCount}
              percent={0}
              color="success"
              icon={<Iconify icon="solar:book-bookmark-bold" width={48} />}
              chart={{ series: [], categories: [] }}
              format="number"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <SummaryCard
              title="Chủ đề"
              total={themes.length}
              percent={0}
              color="warning"
              icon={<Iconify icon="solar:hand-heart-bold" width={48} />}
              chart={{ series: [], categories: [] }}
              format="number"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <SummaryCard
              title="Câu cần ôn"
              total={dueCount}
              percent={0}
              color={dueCount > 0 ? 'error' : 'success'}
              icon={<Iconify icon="solar:lightbulb-bolt-bold" width={48} />}
              chart={{ series: [], categories: [] }}
              format="number"
            />
          </Grid>
        </Grid>

        <BibleHubClient lessons={lessons} dueCount={dueCount} />
      </Stack>
    </DashboardContent>
  );
}
