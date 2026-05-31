import { notFound } from 'next/navigation';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';

import { fDate } from 'src/utils/format-time';

import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';

import { getThemeVerses } from '../actions/bible-theme-actions';

type Props = { themeId: string };

export async function BibleThemeDetailView({ themeId }: Props) {
  const data = await getThemeVerses(themeId);
  if (!data) notFound();

  const { theme, verses } = data;

  return (
    <DashboardContent>
      <Stack spacing={3}>
        <Box>
          <Link
            href={paths.dashboard.bible.themes}
            underline="hover"
            color="text.secondary"
            sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}
          >
            <Iconify icon="eva:arrow-ios-back-fill" width={16} />
            <Typography variant="body2">Tất cả chủ đề</Typography>
          </Link>
          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mt: 0.5 }}>
            <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: theme.color }} />
            <Typography variant="h4">{theme.name}</Typography>
          </Stack>
          {theme.description && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {theme.description}
            </Typography>
          )}
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            {verses.length} câu kinh
          </Typography>
        </Box>

        {verses.length === 0 ? (
          <Card sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Chưa có câu kinh nào trong chủ đề này. Gắn từ trang bài học (chip &ldquo;Chủ đề&rdquo;
              dưới mỗi câu).
            </Typography>
          </Card>
        ) : (
          <Stack spacing={1.5}>
            {verses.map((v) => {
              const range =
                v.startVerse === v.endVerse ? `${v.startVerse}` : `${v.startVerse}-${v.endVerse}`;
              return (
                <Card key={v.verseId} sx={{ p: 2 }}>
                  <Stack spacing={1}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Typography variant="subtitle2" sx={{ color: 'primary.main' }}>
                        {v.bookName} {v.chapter}:{range}
                      </Typography>
                      <Box sx={{ flex: 1 }} />
                      <Typography variant="caption" color="text.secondary">
                        Thêm {fDate(v.addedAt, 'DD/MM/YYYY')}
                      </Typography>
                    </Stack>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                      {v.text}
                    </Typography>
                  </Stack>
                </Card>
              );
            })}
          </Stack>
        )}
      </Stack>
    </DashboardContent>
  );
}
