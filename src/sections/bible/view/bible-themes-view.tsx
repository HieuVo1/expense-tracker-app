import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { DashboardContent } from 'src/layouts/dashboard';

import { BibleThemesClient } from './bible-themes-client';
import { listThemes } from '../actions/bible-theme-actions';

export async function BibleThemesView() {
  const themes = await listThemes();

  return (
    <DashboardContent>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h4">Chủ đề Học tập</Typography>
          <Typography variant="body2" color="text.secondary">
            Gom câu kinh theo chủ đề tự tạo. AI có thể gợi ý khi gắn từ trang bài học.
          </Typography>
        </Box>

        <BibleThemesClient themes={themes} />
      </Stack>
    </DashboardContent>
  );
}
