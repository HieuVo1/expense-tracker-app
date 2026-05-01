import type { Metadata } from 'next';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { CONFIG } from 'src/global-config';
import { paths } from 'src/routes/paths';

export const metadata: Metadata = { title: `404 - ${CONFIG.appName}` };

export default function Page() {
  return (
    <Box sx={{ p: 5, textAlign: 'center' }}>
      <Typography variant="h3" sx={{ mb: 2 }}>
        404
      </Typography>
      <Typography sx={{ color: 'text.secondary', mb: 3 }}>
        Trang không tồn tại.
      </Typography>
      <Button href={paths.dashboard.root} variant="contained">
        Về trang chủ
      </Button>
    </Box>
  );
}
