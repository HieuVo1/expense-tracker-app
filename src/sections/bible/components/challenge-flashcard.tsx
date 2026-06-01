'use client';

import type { ThemeRow, ChallengeCardRow } from '../types';

import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import LinearProgress from '@mui/material/LinearProgress';

import { paths } from 'src/routes/paths';

import { Iconify } from 'src/components/iconify';

import { ChallengePromptEditDialog } from './challenge-prompt-edit-dialog';

type Props = {
  themes: ThemeRow[];
  deck: ChallengeCardRow[];
  selectedThemeId: string | null;
};

// Fisher-Yates shuffle — returns a new array, does not mutate.
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function ChallengeFlashcard({ themes, deck, selectedThemeId }: Props) {
  const router = useRouter();
  const sp = useSearchParams();

  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [shuffled, setShuffled] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  // Per-card local overrides: keyed by verseThemeId.
  const [overrides, setOverrides] = useState<Record<string, string | null>>({});

  const activeDeck = useMemo(
    () => (shuffled ? shuffle(deck) : deck),
     
    [deck, shuffled]
  );

  const safeIndex = Math.min(index, Math.max(activeDeck.length - 1, 0));
  const current = activeDeck[safeIndex];

  // ── theme picker ──────────────────────────────────────────────────────────
  const handleThemeChange = (value: string) => {
    const next = new URLSearchParams(sp.toString());
    next.set('mode', 'challenge');
    if (value === '') {
      next.delete('themeId');
    } else {
      next.set('themeId', value);
    }
    setIndex(0);
    setRevealed(false);
    router.replace(`?${next.toString()}`);
  };

  // ── navigation ────────────────────────────────────────────────────────────
  const goNext = () => {
    setRevealed(false);
    setIndex((i) => Math.min(i + 1, activeDeck.length - 1));
  };

  const goPrev = () => {
    setRevealed(false);
    setIndex((i) => Math.max(i - 1, 0));
  };

  // ── empty state ───────────────────────────────────────────────────────────
  if (deck.length === 0) {
    return (
      <Card sx={{ p: 4, textAlign: 'center' }}>
        <Iconify icon="solar:book-bookmark-bold" width={48} sx={{ color: 'text.disabled' }} />
        <Typography variant="h6" sx={{ mt: 1 }}>
          Chưa có câu kinh nào
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Thêm câu kinh vào chủ đề để bắt đầu luyện tập.
        </Typography>
        <Button href={paths.dashboard.bible.root} startIcon={<Iconify icon="eva:arrow-ios-back-fill" />}>
          Quay lại Học tập
        </Button>
      </Card>
    );
  }

  if (!current) return null;

  const localOverride = overrides[current.verseThemeId];
  const promptText = localOverride !== undefined
    ? localOverride
    : (current.promptOverride ?? current.themeName);

  const range =
    current.startVerse === current.endVerse
      ? `${current.startVerse}`
      : `${current.startVerse}-${current.endVerse}`;
  const refLabel = `${current.bookName} ${current.chapter}:${range}`;

  return (
    <Stack spacing={2}>
      {/* Theme picker */}
      <FormControl size="small" fullWidth>
        <InputLabel>Chủ đề</InputLabel>
        <Select
          label="Chủ đề"
          value={selectedThemeId ?? ''}
          onChange={(e) => handleThemeChange(e.target.value)}
        >
          <MenuItem value="">Tất cả chủ đề</MenuItem>
          {themes.map((t) => (
            <MenuItem key={t.id} value={t.id}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Box
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    bgcolor: t.color,
                    flexShrink: 0,
                  }}
                />
                <span>{t.name}</span>
              </Stack>
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Progress + shuffle */}
      <Stack direction="row" alignItems="center" spacing={1}>
        <Box sx={{ flex: 1 }}>
          <LinearProgress
            variant="determinate"
            value={((safeIndex + 1) / activeDeck.length) * 100}
            sx={{ height: 6, borderRadius: 1 }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
            {safeIndex + 1} / {activeDeck.length}
          </Typography>
        </Box>
        <Button
          size="small"
          variant={shuffled ? 'contained' : 'outlined'}
          color="inherit"
          startIcon={<Iconify icon="solar:transfer-horizontal-bold-duotone" width={16} />}
          onClick={() => { setShuffled((s) => !s); setIndex(0); setRevealed(false); }}
        >
          Xáo trộn
        </Button>
      </Stack>

      {/* Flashcard */}
      <Card sx={{ p: 3, minHeight: 220, display: 'flex', flexDirection: 'column' }}>
        {/* Theme chip + edit button row */}
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
          <Chip
            size="small"
            label={current.themeName}
            sx={{
              bgcolor: current.themeColor,
              color: 'common.white',
              fontWeight: 600,
              fontSize: 11,
            }}
          />
          <IconButton size="small" onClick={() => setEditOpen(true)} title="Sửa lời nhắc">
            <Iconify icon="solar:pen-bold" width={16} />
          </IconButton>
        </Stack>

        {/* Front: prompt */}
        <Typography variant="h6" sx={{ flex: 1, mb: 2 }}>
          {promptText}
        </Typography>

        {/* Back: verse revealed */}
        {revealed ? (
          <Box>
            <Typography variant="subtitle2" color="primary.main" sx={{ mb: 0.5 }}>
              {refLabel}
            </Typography>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
              {current.text}
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Button
              variant="outlined"
              size="large"
              startIcon={<Iconify icon="solar:eye-bold" />}
              onClick={() => setRevealed(true)}
            >
              Hiện câu kinh
            </Button>
          </Box>
        )}
      </Card>

      {/* Navigation */}
      <Stack direction="row" spacing={1} justifyContent="space-between">
        <Button
          variant="outlined"
          disabled={safeIndex === 0}
          startIcon={<Iconify icon="eva:arrow-ios-back-fill" />}
          onClick={goPrev}
        >
          Quay lại
        </Button>
        <Button
          variant="contained"
          disabled={safeIndex === activeDeck.length - 1}
          endIcon={<Iconify icon="eva:arrow-forward-fill" />}
          onClick={goNext}
        >
          Tiếp
        </Button>
      </Stack>

      {/* Edit prompt dialog */}
      <ChallengePromptEditDialog
        open={editOpen}
        verseId={current.verseId}
        themeId={current.themeId}
        currentPrompt={localOverride !== undefined ? localOverride : current.promptOverride}
        onClose={() => setEditOpen(false)}
        onSaved={(val) =>
          setOverrides((prev) => ({ ...prev, [current.verseThemeId]: val }))
        }
      />
    </Stack>
  );
}
