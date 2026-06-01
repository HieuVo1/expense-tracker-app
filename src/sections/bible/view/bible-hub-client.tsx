'use client';

import type { LessonListItem } from '../types';

import { useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';

import { fDate } from 'src/utils/format-time';

import { Iconify } from 'src/components/iconify';

import { BibleSearchBar } from '../components/bible-search-bar';
import { ImportLessonDialog } from '../components/import-lesson-dialog';

type Props = {
  lessons: LessonListItem[];
  dueCount: number;
};

export function BibleHubClient({ lessons, dueCount }: Props) {
  const [importOpen, setImportOpen] = useState(false);

  return (
    <>
      {/* Sticky search bar — above the action button row */}
      <Box
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          bgcolor: 'background.default',
          py: 1,
        }}
      >
        <BibleSearchBar />
      </Box>

      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        <Button
          variant="contained"
          startIcon={<Iconify icon="solar:import-bold" />}
          onClick={() => setImportOpen(true)}
        >
          Import bài học
        </Button>
        <Button
          variant="outlined"
          startIcon={<Iconify icon="solar:notebook-bold-duotone" />}
          href={paths.dashboard.bible.themes}
        >
          Chủ đề
        </Button>
        <Button
          variant={dueCount > 0 ? 'contained' : 'outlined'}
          color="success"
          startIcon={<Iconify icon="solar:book-bookmark-bold" />}
          href={paths.dashboard.bible.review}
        >
          Kho vũ khí {dueCount > 0 ? `(${dueCount})` : ''}
        </Button>
      </Stack>

      <Box>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Bài học gần đây
        </Typography>
        {lessons.length === 0 ? (
          <Card sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Chưa có bài học nào. Bấm <strong>Import bài học</strong> để bắt đầu.
            </Typography>
          </Card>
        ) : (
          <Stack spacing={1.5}>
            {lessons.map((l) => (
              <Card key={l.id} sx={{ p: 2 }}>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Link
                      href={paths.dashboard.bible.lessonDetail(l.id)}
                      underline="hover"
                      color="text.primary"
                      sx={{ display: 'block' }}
                    >
                      <Typography variant="subtitle2" noWrap>
                        {l.title}
                      </Typography>
                    </Link>
                    <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                      <Typography variant="caption" color="text.secondary">
                        {fDate(l.date, 'DD/MM/YYYY')}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        · {l.verseCount} câu kinh
                      </Typography>
                    </Stack>
                  </Box>
                  {l.ambiguousCount > 0 && (
                    <Chip
                      size="small"
                      color="warning"
                      label={`${l.ambiguousCount} cần làm rõ`}
                    />
                  )}
                </Stack>
              </Card>
            ))}
          </Stack>
        )}
      </Box>

      <ImportLessonDialog open={importOpen} onClose={() => setImportOpen(false)} />
    </>
  );
}
