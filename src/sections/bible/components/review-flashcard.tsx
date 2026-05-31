'use client';

import type { ReviewQuality, ReviewCardRow } from '../types';

import { toast } from 'sonner';
import { useState, useTransition } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';

import { Iconify } from 'src/components/iconify';

import { recordReview } from '../actions/bible-review-actions';

type Props = {
  cards: ReviewCardRow[];
  emptyHref: string;
};

const QUALITIES: { value: ReviewQuality; label: string; color: 'error' | 'warning' | 'info' | 'success' }[] = [
  { value: 0, label: 'Quên', color: 'error' },
  { value: 1, label: 'Khó', color: 'warning' },
  { value: 2, label: 'OK', color: 'info' },
  { value: 3, label: 'Dễ', color: 'success' },
];

// Flashcard sequence with reveal toggle + 4 quality buttons. Each answer
// records review state and advances. When deck empty, show summary.

export function ReviewFlashcard({ cards, emptyHref }: Props) {
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(0);

  if (cards.length === 0) {
    return (
      <Card sx={{ p: 4, textAlign: 'center' }}>
        <Iconify icon="solar:check-circle-bold" width={48} sx={{ color: 'success.main' }} />
        <Typography variant="h6" sx={{ mt: 1 }}>
          Hôm nay không có câu nào cần ôn
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Quay lại sau khi import bài học mới hoặc đến hạn ôn lại.
        </Typography>
        <Button href={emptyHref} startIcon={<Iconify icon="eva:arrow-ios-back-fill" />}>
          Quay lại
        </Button>
      </Card>
    );
  }

  const current = cards[index];
  if (!current) {
    return (
      <Card sx={{ p: 4, textAlign: 'center' }}>
        <Iconify icon="solar:cup-star-bold" width={48} sx={{ color: 'success.main' }} />
        <Typography variant="h6" sx={{ mt: 1 }}>
          Xong rồi! Đã ôn {done} câu kinh
        </Typography>
        <Button
          href={emptyHref}
          variant="contained"
          startIcon={<Iconify icon="solar:home-smile-bold" />}
          sx={{ mt: 2 }}
        >
          Về trang Học tập
        </Button>
      </Card>
    );
  }

  const range =
    current.startVerse === current.endVerse
      ? `${current.startVerse}`
      : `${current.startVerse}-${current.endVerse}`;
  const refLabel = `${current.bookName} ${current.chapter}:${range}`;

  const handleAnswer = (quality: ReviewQuality) => {
    startTransition(async () => {
      try {
        const r = await recordReview({ verseId: current.verseId, quality });
        const msg =
          quality === 0
            ? `Đã ghi nhận "Quên" — ôn lại ngày mai`
            : `Đã ghi nhận — tiếp theo sau ${r.interval} ngày`;
        toast.success(msg);
        setDone((d) => d + 1);
        setRevealed(false);
        setIndex((i) => i + 1);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Lỗi ghi kết quả');
      }
    });
  };

  return (
    <Stack spacing={2}>
      <Box>
        <LinearProgress
          variant="determinate"
          value={(done / cards.length) * 100}
          sx={{ height: 6, borderRadius: 1 }}
        />
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
          {done} / {cards.length}
        </Typography>
      </Box>

      <Card sx={{ p: 3, minHeight: 220, display: 'flex', flexDirection: 'column' }}>
        <Typography variant="subtitle1" sx={{ color: 'primary.main', mb: 2 }}>
          {refLabel}
        </Typography>
        {revealed ? (
          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', flex: 1 }}>
            {current.text}
          </Typography>
        ) : (
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Button
              variant="outlined"
              size="large"
              startIcon={<Iconify icon="solar:eye-bold" />}
              onClick={() => setRevealed(true)}
            >
              Hiện nội dung
            </Button>
          </Box>
        )}
      </Card>

      {revealed && (
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {QUALITIES.map((q) => (
            <Button
              key={q.value}
              variant="contained"
              color={q.color}
              onClick={() => handleAnswer(q.value)}
              disabled={pending}
              sx={{ flex: 1, minWidth: 80 }}
            >
              {q.label}
            </Button>
          ))}
        </Stack>
      )}
    </Stack>
  );
}
