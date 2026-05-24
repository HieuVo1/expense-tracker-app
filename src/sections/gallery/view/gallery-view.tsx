import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { DashboardContent } from 'src/layouts/dashboard';

import { GalleryGridClient } from './gallery-grid-client';
import { listGalleryImages } from '../actions/gallery-actions';

// ----------------------------------------------------------------------

export async function GalleryView() {
  const images = await listGalleryImages();

  return (
    <DashboardContent>
      <Stack spacing={0.5} sx={{ mb: 3 }}>
        <Typography variant="h4">Thư viện ảnh</Typography>
        <Typography variant="body2" color="text.secondary">
          Tất cả ảnh bạn đã đính kèm trong Nhật ký và Về tôi
          {images.length > 0 ? ` · ${images.length} ảnh` : ''}.
        </Typography>
      </Stack>

      <GalleryGridClient images={images} />
    </DashboardContent>
  );
}
