'use client';

import type { ChallengeCardRow, ThemeRow } from '../types';

import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Tabs from '@mui/material/Tabs';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';

import { paths } from 'src/routes/paths';

import { Iconify } from 'src/components/iconify';

import { ChallengePromptEditDialog } from './challenge-prompt-edit-dialog';

// "Kho vũ khí" arsenal view — render every challenge card grouped by theme
// via tabs. "Tất cả" tab shows the full deck. Each theme with ≥1 linked verse
// gets its own tab with a colored dot + card count. No filter dropdown, no
// flashcard nav — the goal is one-click visual access to your full toolkit.

const ALL_TAB = 'all';

type Props = {
  themes: ThemeRow[];
  deck: ChallengeCardRow[];
};

export function ChallengeGrid({ themes, deck }: Props) {
  const [selectedThemeId, setSelectedThemeId] = useState<string>(ALL_TAB);

  // Optimistic overrides keyed by verseThemeId. Applied immediately after edit
  // so the UI updates without waiting for a server round-trip. Cleared on
  // route refetch (Next refreshes the deck on navigation).
  const [overrides, setOverrides] = useState<Record<string, string | null>>({});
  const [editingCard, setEditingCard] = useState<ChallengeCardRow | null>(null);

  // Count cards per theme client-side and filter to themes that have ≥1 card.
  // Skipping empty themes keeps the tab strip from looking like a junk drawer.
  const themesWithCards = useMemo(() => {
    const counts = new Map<string, number>();
    deck.forEach((c) => counts.set(c.themeId, (counts.get(c.themeId) ?? 0) + 1));
    return themes
      .filter((t) => counts.has(t.id))
      .map((t) => ({ ...t, count: counts.get(t.id) ?? 0 }));
  }, [themes, deck]);

  const filteredDeck = useMemo(
    () =>
      selectedThemeId === ALL_TAB
        ? deck
        : deck.filter((c) => c.themeId === selectedThemeId),
    [deck, selectedThemeId]
  );

  if (deck.length === 0) {
    return (
      <Card sx={{ p: 4, textAlign: 'center' }}>
        <Iconify icon="solar:book-bookmark-bold" width={48} sx={{ color: 'text.disabled' }} />
        <Typography variant="h6" sx={{ mt: 1 }}>
          Chưa có câu kinh nào
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Thêm câu kinh vào chủ đề để bắt đầu xây kho vũ khí.
        </Typography>
        <Button href={paths.dashboard.bible.root} startIcon={<Iconify icon="eva:arrow-ios-back-fill" />}>
          Quay lại Học tập
        </Button>
      </Card>
    );
  }

  return (
    <Stack spacing={2}>
      <Tabs
        value={selectedThemeId}
        onChange={(_, v: string) => setSelectedThemeId(v)}
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
        sx={{ borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab value={ALL_TAB} label={`Tất cả (${deck.length})`} />
        {themesWithCards.map((t) => (
          <Tab
            key={t.id}
            value={t.id}
            label={
              <Stack direction="row" alignItems="center" spacing={1}>
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: t.color,
                    flexShrink: 0,
                  }}
                />
                <span>
                  {t.name} ({t.count})
                </span>
              </Stack>
            }
          />
        ))}
      </Tabs>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
          gap: 2,
        }}
      >
        {filteredDeck.map((card) => (
          <ChallengeCardItem
            key={card.verseThemeId}
            card={card}
            override={overrides[card.verseThemeId]}
            onEdit={() => setEditingCard(card)}
          />
        ))}
      </Box>

      {editingCard && (
        <ChallengePromptEditDialog
          open
          verseId={editingCard.verseId}
          themeId={editingCard.themeId}
          currentPrompt={
            overrides[editingCard.verseThemeId] !== undefined
              ? overrides[editingCard.verseThemeId]
              : editingCard.promptOverride
          }
          onClose={() => setEditingCard(null)}
          onSaved={(val) => {
            setOverrides((prev) => ({ ...prev, [editingCard.verseThemeId]: val }));
            setEditingCard(null);
          }}
        />
      )}
    </Stack>
  );
}

type ItemProps = {
  card: ChallengeCardRow;
  override: string | null | undefined;
  onEdit: () => void;
};

function ChallengeCardItem({ card, override, onEdit }: ItemProps) {
  // override === undefined → not yet edited locally → use server-side promptOverride (or theme name)
  // override === null      → user cleared the prompt → fall back to theme name
  // override === string    → use that string
  const promptText =
    override !== undefined ? override ?? card.themeName : card.promptOverride ?? card.themeName;

  const range =
    card.startVerse === card.endVerse
      ? `${card.startVerse}`
      : `${card.startVerse}-${card.endVerse}`;
  const refLabel = `${card.bookName} ${card.chapter}:${range}`;

  return (
    <Card sx={{ p: 3, display: 'flex', flexDirection: 'column' }}>
      <Stack
        direction="row"
        alignItems="flex-start"
        justifyContent="space-between"
        sx={{ mb: 1.5 }}
      >
        <Chip
          size="small"
          label={card.themeName}
          sx={{
            bgcolor: card.themeColor,
            color: 'common.white',
            fontWeight: 600,
            fontSize: 11,
          }}
        />
        <IconButton size="small" onClick={onEdit} title="Sửa lời nhắc">
          <Iconify icon="solar:pen-bold" width={16} />
        </IconButton>
      </Stack>

      {/* Prompt (the "thử thách" — challenge cue) */}
      <Typography variant="h6" sx={{ mb: 2, lineHeight: 1.3 }}>
        {promptText}
      </Typography>

      {/* Verse — always visible in grid mode (no flip) */}
      <Box>
        <Typography variant="subtitle2" color="primary.main" sx={{ mb: 0.5 }}>
          {refLabel}
        </Typography>
        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
          {card.text}
        </Typography>
      </Box>
    </Card>
  );
}
