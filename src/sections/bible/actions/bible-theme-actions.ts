'use server';

import type { ThemeRow, ThemeVerseRow } from '../types';

import { revalidatePath } from 'next/cache';

import { paths } from 'src/routes/paths';

import { prisma } from 'src/lib/prisma';
import { requireUser } from 'src/lib/auth-helpers';

import {
  themeIdSchema,
  themeCreateSchema,
  themeUpdateSchema,
  verseThemeLinkSchema,
} from '../schemas';

// Theme CRUD + verse↔theme linking. AI suggest is in bible-theme-suggest.ts
// (calls Gemini) — kept separate so the data-only actions in this file have
// no external dependencies and stay fast/cheap.

export async function listThemes(): Promise<ThemeRow[]> {
  const user = await requireUser();
  const rows = await prisma.bibleTheme.findMany({
    where: { userId: user.id },
    orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    include: { _count: { select: { verses: true } } },
  });
  return rows.map((t) => ({
    id: t.id,
    name: t.name,
    color: t.color,
    description: t.description,
    order: t.order,
    verseCount: t._count.verses,
  }));
}

export async function getThemeVerses(themeId: string): Promise<{
  theme: ThemeRow;
  verses: ThemeVerseRow[];
} | null> {
  const user = await requireUser();
  const theme = await prisma.bibleTheme.findFirst({
    where: { id: themeId, userId: user.id },
    include: {
      _count: { select: { verses: true } },
      verses: {
        orderBy: { addedAt: 'desc' },
        include: { verse: true },
      },
    },
  });
  if (!theme) return null;
  return {
    theme: {
      id: theme.id,
      name: theme.name,
      color: theme.color,
      description: theme.description,
      order: theme.order,
      verseCount: theme._count.verses,
    },
    verses: theme.verses.map((vt) => ({
      verseId: vt.verse.id,
      bookCode: vt.verse.bookCode,
      bookName: vt.verse.bookName,
      chapter: vt.verse.chapter,
      startVerse: vt.verse.startVerse,
      endVerse: vt.verse.endVerse,
      text: vt.verse.text,
      addedAt: vt.addedAt.toISOString(),
    })),
  };
}

export async function createTheme(input: {
  name: string;
  color?: string;
  description?: string | null;
}): Promise<{ id: string }> {
  const user = await requireUser();
  const data = themeCreateSchema.parse(input);
  const maxOrder = await prisma.bibleTheme.aggregate({
    where: { userId: user.id },
    _max: { order: true },
  });
  const created = await prisma.bibleTheme.create({
    data: {
      userId: user.id,
      name: data.name,
      color: data.color,
      description: data.description ?? null,
      order: (maxOrder._max.order ?? -1) + 1,
    },
    select: { id: true },
  });
  revalidatePath(paths.dashboard.bible.themes);
  return created;
}

export async function updateTheme(input: {
  id: string;
  name: string;
  color?: string;
  description?: string | null;
}): Promise<void> {
  const user = await requireUser();
  const data = themeUpdateSchema.parse(input);
  await prisma.bibleTheme.update({
    where: { id: data.id, userId: user.id },
    data: { name: data.name, color: data.color, description: data.description ?? null },
  });
  revalidatePath(paths.dashboard.bible.themes);
  revalidatePath(paths.dashboard.bible.themeDetail(data.id));
}

export async function deleteTheme(input: { id: string }): Promise<void> {
  const user = await requireUser();
  const { id } = themeIdSchema.parse(input);
  await prisma.bibleTheme.delete({ where: { id, userId: user.id } });
  revalidatePath(paths.dashboard.bible.themes);
}

export async function assignVerseTheme(input: {
  verseId: string;
  themeId: string;
}): Promise<void> {
  const user = await requireUser();
  const { verseId, themeId } = verseThemeLinkSchema.parse(input);

  // Defense-in-depth: verify both rows belong to user before linking.
  const [verse, theme] = await Promise.all([
    prisma.bibleVerse.findFirst({ where: { id: verseId, userId: user.id }, select: { id: true } }),
    prisma.bibleTheme.findFirst({ where: { id: themeId, userId: user.id }, select: { id: true } }),
  ]);
  if (!verse || !theme) throw new Error('Câu kinh hoặc chủ đề không tồn tại');

  // upsert on the composite PK so re-assignment is idempotent.
  await prisma.bibleVerseTheme.upsert({
    where: { verseId_themeId: { verseId, themeId } },
    create: { verseId, themeId },
    update: {},
  });
  revalidatePath(paths.dashboard.bible.themeDetail(themeId));
}

export async function removeVerseTheme(input: {
  verseId: string;
  themeId: string;
}): Promise<void> {
  const user = await requireUser();
  const { verseId, themeId } = verseThemeLinkSchema.parse(input);
  // Theme ownership check via composite PK delete + filter on theme.userId.
  const link = await prisma.bibleVerseTheme.findUnique({
    where: { verseId_themeId: { verseId, themeId } },
    include: { theme: { select: { userId: true } } },
  });
  if (!link || link.theme.userId !== user.id) return;
  await prisma.bibleVerseTheme.delete({
    where: { verseId_themeId: { verseId, themeId } },
  });
  revalidatePath(paths.dashboard.bible.themeDetail(themeId));
}
