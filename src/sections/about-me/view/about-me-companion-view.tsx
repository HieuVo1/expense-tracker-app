import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';

import { AboutMeCompanionClient } from './about-me-companion-client';

// ----------------------------------------------------------------------

export function AboutMeCompanionView() {
  return (
    <DashboardContent maxWidth="md">
      <Stack
        direction="row"
        alignItems="flex-start"
        justifyContent="space-between"
        gap={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
            Tâm sự
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Chia sẻ điều bạn đang trăn trở — trợ lý sẽ nhắc lại bài học bạn từng vượt qua.
          </Typography>
        </Box>

        <Button
          href={paths.dashboard.aboutMe}
          color="inherit"
          size="small"
          startIcon={<Iconify icon="eva:arrow-ios-back-fill" />}
          sx={{ flexShrink: 0 }}
        >
          Về tôi
        </Button>
      </Stack>

      <AboutMeCompanionClient />
    </DashboardContent>
  );
}
