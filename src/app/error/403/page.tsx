import type { Metadata } from 'next';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';

import { CONFIG } from 'src/global-config';

export const metadata: Metadata = { title: `403 - ${CONFIG.appName}` };

export default function Page() {
  return (
    <Box sx={{ p: 5, textAlign: 'center' }}>
      <Typography variant="h3" sx={{ mb: 2 }}>
        403
      </Typography>
      <Typography sx={{ color: 'text.secondary', mb: 3 }}>
        Bạn không có quyền truy cập trang này.
      </Typography>
      <Button href={paths.dashboard.root} variant="contained">
        Về trang chủ
      </Button>
    </Box>
  );
}
