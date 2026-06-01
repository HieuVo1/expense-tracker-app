'use server';

import type { ChallengeCardRow } from '../types';

import { revalidatePath } from 'next/cache';

import { paths } from 'src/routes/paths';

import { prisma } from 'src/lib/prisma';
import { requireUser } from 'src/lib/auth-helpers';

import { challengeDeckQuerySchema, updateChallengePromptSchema } from '../schemas';

// Challenge flashcard actions — read deck + edit per-link prompt override.
// listThemes() lives in bible-theme-actions.ts (reuse from there).

const DECK_CAP = 200;

/**
 * Return the flashcard deck for a given theme (or all themes if themeId is null).
 * Only includes verses with fetchStatus === 'ok'.
 * Ownership is enforced via nested Prisma where on theme.userId + verse.userId.
 */
export async function getChallengeDeck(input: {
  themeId: string | null;
}): Promise<ChallengeCardRow[]> {
  const user = await requireUser();
  const { themeId } = challengeDeckQuerySchema.parse(input);

  const rows = await prisma.bibleVerseTheme.findMany({
    where: {
      theme: { userId: user.id, ...(themeId ? { id: themeId } : {}) },
      verse: { userId: user.id, fetchStatus: 'ok' },
    },
    include: {
      verse: true,
      theme: { select: { id: true, name: true, color: true } },
    },
    orderBy: { addedAt: 'desc' },
    take: DECK_CAP,
  });

  return rows.map((r) => ({
    verseThemeId: `${r.verseId}:${r.themeId}`,
    verseId: r.verseId,
    themeId: r.themeId,
    themeName: r.theme.name,
    themeColor: r.theme.color,
    promptOverride: r.challengePrompt,
    bookCode: r.verse.bookCode,
    bookName: r.verse.bookName,
    chapter: r.verse.chapter,
    startVerse: r.verse.startVerse,
    endVerse: r.verse.endVerse,
    text: r.verse.text,
    addedAt: r.addedAt.toISOString(),
  }));
}

/**
 * Upsert the per-link challenge prompt override on a BibleVerseTheme row.
 * Empty / whitespace prompt is stored as NULL (resets to theme.name fallback).
 * Ownership is double-checked: both verse.userId and theme.userId must match.
 */
export async function updateChallengePrompt(input: {
  verseId: string;
  themeId: string;
  prompt: string | null;
}): Promise<void> {
  const user = await requireUser();
  const { verseId, themeId, prompt } = updateChallengePromptSchema.parse(input);

  // Ownership defense: verify the link exists and belongs to this user.
  const link = await prisma.bibleVerseTheme.findUnique({
    where: { verseId_themeId: { verseId, themeId } },
    include: {
      verse: { select: { userId: true } },
      theme: { select: { userId: true } },
    },
  });
  if (!link || link.verse.userId !== user.id || link.theme.userId !== user.id) {
    throw new Error('Liên kết câu kinh - chủ đề không tồn tại');
  }

  // Coerce empty / whitespace to NULL so theme.name fallback is used.
  const stored = prompt && prompt.trim() ? prompt.trim() : null;

  await prisma.bibleVerseTheme.update({
    where: { verseId_themeId: { verseId, themeId } },
    data: { challengePrompt: stored },
  });

  revalidatePath(paths.dashboard.bible.review);
}
