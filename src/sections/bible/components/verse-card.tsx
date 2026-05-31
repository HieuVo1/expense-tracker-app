'use client';

import type { ThemeRow, LessonVerseRow } from '../types';

import { toast } from 'sonner';
import { useTransition } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { youVersionUrl } from 'src/lib/bible';

import { Iconify } from 'src/components/iconify';

import { VerseThemePicker } from './verse-theme-picker';
import { refreshVerse } from '../actions/bible-lesson-actions';
import { AmbiguousVerseResolver } from './ambiguous-verse-resolver';

type Props = {
  verse: LessonVerseRow;
  allThemes: Pick<ThemeRow, 'id' | 'name' | 'color'>[];
};

// One verse in a lesson detail page. Shows ref + text + theme picker; for
// ambiguous/failed rows surfaces a remediation button instead of text.

export function VerseCard({ verse, allThemes }: Props) {
  const [refreshing, startRefresh] = useTransition();

  const range =
    verse.startVerse === verse.endVerse
      ? `${verse.startVerse}`
      : `${verse.startVerse}-${verse.endVerse}`;
  const refLabel = `${verse.bookName} ${verse.chapter}:${range}`;
  const externalUrl = youVersionUrl({
    bookCode: verse.bookCode,
    chapter: verse.chapter,
    startVerse: verse.startVerse,
    endVerse: verse.endVerse,
  });

  const onRefresh = () => {
    startRefresh(async () => {
      try {
        await refreshVerse({ id: verse.verseId });
        toast.success('Đã tải lại');
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Lỗi tải lại');
      }
    });
  };

  return (
    <Card sx={{ p: 2 }}>
      <Stack spacing={1.5}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography variant="subtitle2" sx={{ color: 'primary.main' }}>
            {refLabel}
          </Typography>
          {verse.fetchStatus !== 'ambiguous' && (
            <>
              <Tooltip title="Mở trên bible.com">
                <Link
                  href={externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ display: 'inline-flex', color: 'text.secondary', '&:hover': { color: 'primary.main' } }}
                >
                  <Iconify icon="solar:export-bold" width={14} />
                </Link>
              </Tooltip>
              <Tooltip title="Tải lại text từ bible.com">
                <IconButton
                  size="small"
                  onClick={onRefresh}
                  disabled={refreshing}
                  sx={{ p: 0.25, color: 'text.secondary', '&:hover': { color: 'primary.main' } }}
                >
                  <Iconify icon="solar:restart-bold" width={14} />
                </IconButton>
              </Tooltip>
            </>
          )}
          {verse.fetchStatus === 'ambiguous' && (
            <Chip size="small" color="warning" label="Cần làm rõ" />
          )}
          {verse.fetchStatus === 'failed' && (
            <Chip size="small" color="error" label="Tải thất bại" />
          )}
          <Box sx={{ flex: 1 }} />
          {verse.fetchStatus === 'failed' && (
            <Tooltip title="Tải lại từ bible.com">
              <Button
                size="small"
                onClick={onRefresh}
                disabled={refreshing}
                startIcon={<Iconify icon="solar:reply-bold" />}
              >
                Tải lại
              </Button>
            </Tooltip>
          )}
          {verse.fetchStatus === 'ambiguous' && (
            <AmbiguousVerseResolver
              verseId={verse.verseId}
              ambiguousBookName={verse.bookName}
              chapter={verse.chapter}
              startVerse={verse.startVerse}
              endVerse={verse.endVerse}
            />
          )}
        </Stack>

        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
          {verse.text}
        </Typography>

        {verse.fetchStatus === 'ok' && (
          <VerseThemePicker
            verseId={verse.verseId}
            assigned={verse.themes}
            allThemes={allThemes}
          />
        )}
      </Stack>
    </Card>
  );
}
