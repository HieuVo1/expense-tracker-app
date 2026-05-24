'use client';

import type { GalleryGroup, GalleryImage } from '../types';

import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import { alpha } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { fDate } from 'src/utils/format-time';

import { Iconify } from 'src/components/iconify';
import { Lightbox, useLightbox } from 'src/components/lightbox';

// ----------------------------------------------------------------------

type Filter = 'all' | GalleryGroup;

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'Tất cả' },
  { value: 'aboutme', label: 'Về tôi' },
  { value: 'daily', label: 'Nhật ký' },
];

// Deep-link to the source note's page with `?open=<id>` — the list client there
// auto-opens that note's detail dialog.
function noteHref(img: GalleryImage): string {
  return img.group === 'daily'
    ? `${paths.dashboard.notes}?open=${img.noteId}`
    : `${paths.dashboard.aboutMeType(img.noteType)}?open=${img.noteId}`;
}

type Props = { images: GalleryImage[] };

export function GalleryGridClient({ images }: Props) {
  const [filter, setFilter] = useState<Filter>('all');

  const filtered = useMemo(
    () => (filter === 'all' ? images : images.filter((i) => i.group === filter)),
    [images, filter]
  );

  // Slides mirror the filtered grid so lightbox prev/next stays in sync.
  const slides = useMemo(
    () =>
      filtered.map((i) => ({
        src: i.url,
        title: i.noteTitle,
        description: fDate(i.updatedAt, 'DD/MM/YYYY'),
      })),
    [filtered]
  );
  const lightbox = useLightbox(slides);

  if (images.length === 0) {
    return (
      <Stack alignItems="center" spacing={1.5} sx={{ py: 8, color: 'text.disabled' }}>
        <Iconify icon="solar:gallery-wide-bold" width={48} />
        <Box sx={{ typography: 'body2', textAlign: 'center' }}>
          Chưa có ảnh nào. Đính kèm ảnh trong Nhật ký hoặc Về tôi để chúng xuất hiện ở đây.
        </Box>
      </Stack>
    );
  }

  return (
    <>
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 3 }}>
        {FILTERS.map((f) => (
          <Chip
            key={f.value}
            label={f.label}
            color={filter === f.value ? 'primary' : 'default'}
            variant={filter === f.value ? 'filled' : 'outlined'}
            onClick={() => setFilter(f.value)}
          />
        ))}
      </Stack>

      <Box
        sx={{
          display: 'grid',
          gap: 1,
          gridTemplateColumns: {
            xs: 'repeat(2, 1fr)',
            sm: 'repeat(3, 1fr)',
            md: 'repeat(4, 1fr)',
            lg: 'repeat(5, 1fr)',
          },
        }}
      >
        {filtered.map((img) => (
          <Box
            key={img.path}
            onClick={() => lightbox.onOpen(img.url)}
            sx={{
              position: 'relative',
              cursor: 'pointer',
              aspectRatio: '1 / 1',
              borderRadius: 1.5,
              overflow: 'hidden',
              border: '1px solid',
              borderColor: 'divider',
              '&:hover .gallery-overlay': { opacity: 1 },
            }}
          >
            <Box
              component="img"
              src={img.url}
              alt={img.noteTitle}
              loading="lazy"
              sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />

            {/* Open the source note — stop propagation so it doesn't open the lightbox. */}
            <IconButton
              component={RouterLink}
              href={noteHref(img)}
              size="small"
              aria-label="Mở ghi chú"
              onClick={(e) => e.stopPropagation()}
              sx={{
                position: 'absolute',
                top: 4,
                right: 4,
                zIndex: 2, // above the decorative overlay so it stays clickable
                p: 0.5,
                color: 'common.white',
                bgcolor: (t) => alpha(t.palette.common.black, 0.5),
                '&:hover': { bgcolor: (t) => alpha(t.palette.common.black, 0.7) },
              }}
            >
              <Iconify icon="solar:notebook-bold-duotone" width={16} />
            </IconButton>

            <Box
              className="gallery-overlay"
              sx={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'flex-end',
                p: 1,
                opacity: 0,
                transition: 'opacity .2s',
                background: 'linear-gradient(to top, rgba(0,0,0,.65), transparent 55%)',
                // Decorative only — must not swallow clicks meant for the
                // image (lightbox) or the corner "open note" button.
                pointerEvents: 'none',
              }}
            >
              <Box
                sx={{
                  typography: 'caption',
                  color: 'common.white',
                  fontWeight: 600,
                  width: '100%',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {img.noteTitle}
              </Box>
            </Box>
          </Box>
        ))}
      </Box>

      {filtered.length === 0 && (
        <Box sx={{ py: 6, textAlign: 'center', color: 'text.disabled', typography: 'body2' }}>
          Không có ảnh cho mục này.
        </Box>
      )}

      <Lightbox
        open={lightbox.open}
        close={lightbox.onClose}
        slides={slides}
        index={lightbox.selected}
        onGetCurrentIndex={(index) => lightbox.setSelected(index)}
        disableVideo
        disableSlideshow
        disableThumbnails
      />
    </>
  );
}
