'use client';

import type { SearchResult } from '../types';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';

import { fDate } from 'src/utils/format-time';

import { BibleSearchBar } from '../components/bible-search-bar';

// ---------------------------------------------------------------------------
// Highlight helper — splits text on q (case-insensitive) and wraps matches in
// <strong>.  No dangerouslySetInnerHTML; regex special chars are escaped.
// ---------------------------------------------------------------------------

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function Highlight({ text, q }: { text: string; q: string }) {
  if (!q) return <>{text}</>;
  const parts = text.split(new RegExp(`(${escapeRe(q)})`, 'gi'));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === q.toLowerCase() ? (
          <Box
            key={i}
            component="mark"
            sx={{
              bgcolor: 'warning.lighter',
              color: 'warning.darker',
              px: 0.25,
              borderRadius: 0.5,
              fontWeight: 'bold',
            }}
          >
            {part}
          </Box>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// matchField badge
// ---------------------------------------------------------------------------

const MATCH_LABELS: Record<string, string> = {
  title: 'Tiêu đề',
  content: 'Nội dung',
  text: 'Câu kinh',
  ref: 'Tham chiếu',
};

function MatchBadge({ field }: { field: string }) {
  return (
    <Chip
      size="small"
      label={MATCH_LABELS[field] ?? field}
      variant="soft"
      color="default"
      sx={{ height: 18, fontSize: 10 }}
    />
  );
}

// ---------------------------------------------------------------------------
// Lesson hits section
// ---------------------------------------------------------------------------

function LessonHits({ lessons, q, truncated }: { lessons: SearchResult['lessons']; q: string; truncated: boolean }) {
  return (
    <Stack spacing={1}>
      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
        Bài học{' '}
        <Typography component="span" variant="caption" color="text.secondary">
          ({lessons.length}{truncated ? '+' : ''})
        </Typography>
      </Typography>

      {lessons.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ pl: 1 }}>
          Không có bài học nào khớp.
        </Typography>
      ) : (
        <>
          <Stack spacing={1}>
            {lessons.map((l) => (
              <Card key={l.id} sx={{ p: 2 }}>
                <Stack spacing={0.5}>
                  <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
                    <Link
                      href={paths.dashboard.bible.lessonDetail(l.id)}
                      underline="hover"
                      color="text.primary"
                      variant="subtitle2"
                    >
                      <Highlight text={l.title} q={q} />
                    </Link>
                    <MatchBadge field={l.matchField} />
                  </Stack>
                  <Typography variant="caption" color="text.secondary">
                    {fDate(l.date, 'DD/MM/YYYY')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    <Highlight text={l.snippet} q={q} />
                  </Typography>
                </Stack>
              </Card>
            ))}
          </Stack>

          {truncated && (
            <Typography variant="caption" color="text.secondary" sx={{ pl: 1 }}>
              Còn nhiều kết quả — thử truy vấn cụ thể hơn.
            </Typography>
          )}
        </>
      )}
    </Stack>
  );
}

// ---------------------------------------------------------------------------
// Verse hits section
// ---------------------------------------------------------------------------

function VerseHits({ verses, q, truncated }: { verses: SearchResult['verses']; q: string; truncated: boolean }) {
  return (
    <Stack spacing={1}>
      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
        Câu kinh{' '}
        <Typography component="span" variant="caption" color="text.secondary">
          ({verses.length}{truncated ? '+' : ''})
        </Typography>
      </Typography>

      {verses.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ pl: 1 }}>
          Không có câu kinh nào khớp.
        </Typography>
      ) : (
        <>
          <Stack spacing={1}>
            {verses.map((v) => (
              <Card key={v.verseId} sx={{ p: 2 }}>
                <Stack spacing={0.5}>
                  <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
                    <Typography variant="subtitle2" color="primary.main">
                      <Highlight text={v.refLabel} q={q} />
                    </Typography>
                    <MatchBadge field={v.matchField} />
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    <Highlight text={v.snippet} q={q} />
                  </Typography>
                </Stack>
              </Card>
            ))}
          </Stack>

          {truncated && (
            <Typography variant="caption" color="text.secondary" sx={{ pl: 1 }}>
              Còn nhiều kết quả — thử truy vấn cụ thể hơn.
            </Typography>
          )}
        </>
      )}
    </Stack>
  );
}

// ---------------------------------------------------------------------------
// Public component — receives pre-fetched result from the server view
// ---------------------------------------------------------------------------

type Props = {
  result: SearchResult;
};

export function BibleSearchClient({ result }: Props) {
  const { q, lessons, verses, truncated } = result;
  const hasResults = lessons.length > 0 || verses.length > 0;

  return (
    <Stack spacing={3}>
      {/* Inline search bar so users can refine without going back to hub */}
      <BibleSearchBar defaultValue={q} />

      {!hasResults ? (
        <Card sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Không có kết quả cho &ldquo;<strong>{q}</strong>&rdquo;.
          </Typography>
        </Card>
      ) : (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <LessonHits lessons={lessons} q={q} truncated={truncated.lessons} />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <VerseHits verses={verses} q={q} truncated={truncated.verses} />
          </Grid>
        </Grid>
      )}
    </Stack>
  );
}
