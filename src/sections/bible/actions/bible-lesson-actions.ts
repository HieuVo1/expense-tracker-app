'use server';

import type { Prisma } from '@prisma/client';
import type { LessonDetail, LessonListItem, LessonVerseRow, LessonSectionKey } from '../types';

import { revalidatePath } from 'next/cache';

import { paths } from 'src/routes/paths';

import { prisma } from 'src/lib/prisma';
import { getOrFetchVerse } from 'src/lib/bible';
import { requireUser } from 'src/lib/auth-helpers';

import { vnNameOf } from '../lib/book-map';
import {
  themeIdSchema,
  lessonUpdateSchema,
  resolveAmbiguousSchema,
  lessonSectionUpdateSchema,
} from '../schemas';

// Lesson/verse read + maintenance actions. Import is in bible-lesson-import.ts.

export async function listLessons(): Promise<LessonListItem[]> {
  const user = await requireUser();
  const rows = await prisma.bibleLesson.findMany({
    where: { userId: user.id },
    // Primary: lesson date desc (most recent study day first).
    // Secondary: createdAt desc — stable order for same-date lessons, newest
    // imports float to the top.
    orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    include: {
      verses: {
        select: { verse: { select: { fetchStatus: true } } },
      },
    },
  });

  return rows.map((r) => {
    const ambiguousCount = r.verses.filter((v) => v.verse.fetchStatus === 'ambiguous').length;
    return {
      id: r.id,
      title: r.title,
      date: r.date.toISOString().slice(0, 10),
      verseCount: r.verses.length,
      ambiguousCount,
      createdAt: r.createdAt.toISOString(),
    };
  });
}

export async function getLesson(id: string): Promise<LessonDetail | null> {
  const user = await requireUser();
  const row = await prisma.bibleLesson.findFirst({
    where: { id, userId: user.id },
    include: {
      verses: {
        orderBy: { order: 'asc' },
        include: {
          verse: {
            include: {
              themes: {
                include: { theme: { select: { id: true, name: true, color: true } } },
              },
            },
          },
        },
      },
    },
  });
  if (!row) return null;

  const verses: LessonVerseRow[] = row.verses.map((lv) => ({
    verseId: lv.verse.id,
    bookCode: lv.verse.bookCode,
    bookName: lv.verse.bookName,
    chapter: lv.verse.chapter,
    startVerse: lv.verse.startVerse,
    endVerse: lv.verse.endVerse,
    text: lv.verse.text,
    fetchStatus: lv.verse.fetchStatus as LessonVerseRow['fetchStatus'],
    order: lv.order,
    themes: lv.verse.themes.map((vt) => vt.theme),
  }));

  return {
    id: row.id,
    title: row.title,
    date: row.date.toISOString().slice(0, 10),
    sourceFilename: row.sourceFilename,
    bibleVersion: row.bibleVersion,
    rawMarkdown: row.rawMarkdown,
    sections: pickSections(row.parsedSections),
    verses,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

// parsedSections in DB is `Prisma.JsonValue` — narrow it to the 4 prose
// fields we display. versesRaw lives in the same blob but isn't shown here
// (verses are rendered above from the relation).
function pickSections(raw: Prisma.JsonValue): Record<LessonSectionKey, string> {
  const empty: Record<LessonSectionKey, string> = {
    notes: '',
    lessons: '',
    exercises: '',
    questions: '',
  };
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return empty;
  const obj = raw as Record<string, unknown>;
  const pick = (k: string) => (typeof obj[k] === 'string' ? (obj[k] as string) : '');
  return {
    notes: pick('notes'),
    lessons: pick('lessons'),
    exercises: pick('exercises'),
    questions: pick('questions'),
  };
}

export async function deleteLesson(input: { id: string }): Promise<void> {
  const user = await requireUser();
  const { id } = themeIdSchema.parse(input);
  await prisma.bibleLesson.delete({ where: { id, userId: user.id } });
  revalidatePath(paths.dashboard.bible.root);
}

/**
 * Update lesson metadata (title + date). Verses + rawMarkdown are immutable
 * post-import — re-importing the file is the path for content changes.
 */
export async function updateLesson(input: {
  id: string;
  title: string;
  date: string;
}): Promise<void> {
  const user = await requireUser();
  const { id, title, date } = lessonUpdateSchema.parse(input);
  const existing = await prisma.bibleLesson.findFirst({
    where: { id, userId: user.id },
    select: { id: true },
  });
  if (!existing) throw new Error('Bài học không tồn tại');
  await prisma.bibleLesson.update({
    where: { id },
    data: { title, date: new Date(date) },
  });
  revalidatePath(paths.dashboard.bible.root);
  revalidatePath(`${paths.dashboard.bible.root}/${id}`);
}

/**
 * Patch one section's body in parsedSections. Other section keys + versesRaw
 * are preserved. rawMarkdown is intentionally untouched — it's the import-time
 * snapshot, not a live source of truth post-edit.
 */
export async function updateLessonSection(input: {
  id: string;
  section: LessonSectionKey;
  content: string;
}): Promise<void> {
  const user = await requireUser();
  const { id, section, content } = lessonSectionUpdateSchema.parse(input);
  const existing = await prisma.bibleLesson.findFirst({
    where: { id, userId: user.id },
    select: { parsedSections: true },
  });
  if (!existing) throw new Error('Bài học không tồn tại');
  const current = (existing.parsedSections ?? {}) as Record<string, unknown>;
  const next = { ...current, [section]: content };
  await prisma.bibleLesson.update({
    where: { id },
    data: { parsedSections: next as Prisma.InputJsonValue },
  });
  revalidatePath(`${paths.dashboard.bible.root}/${id}`);
}

/**
 * Force-refetch a verse's text via the provider chain. Used when a verse row
 * has fetchStatus="failed" or the user wants to retry after a markup change.
 */
export async function refreshVerse(input: { id: string }): Promise<void> {
  const user = await requireUser();
  const { id } = themeIdSchema.parse(input);
  const existing = await prisma.bibleVerse.findFirst({
    where: { id, userId: user.id },
  });
  if (!existing) throw new Error('Câu kinh không tồn tại');
  if (existing.fetchStatus === 'ambiguous') {
    throw new Error('Câu kinh đang chờ làm rõ sách — dùng "Làm rõ" thay vì "Tải lại"');
  }
  await getOrFetchVerse(
    user.id,
    {
      bookCode: existing.bookCode,
      bookName: existing.bookName,
      chapter: existing.chapter,
      startVerse: existing.startVerse,
      endVerse: existing.endVerse,
      version: existing.version,
    },
    { force: true }
  );
  revalidatePath(paths.dashboard.bible.root);
}

/**
 * Resolve an ambiguous reference. Re-fetches verse text with the user-selected
 * USFM bookCode, then replaces the stub row (and re-points all lesson links).
 *
 * Uses a transaction to keep link rows consistent if the new row insertion
 * collides with an existing cache entry for the same (book, chapter, range).
 */
export async function resolveAmbiguousVerse(input: {
  verseId: string;
  bookCode: string;
}): Promise<void> {
  const user = await requireUser();
  const { verseId, bookCode } = resolveAmbiguousSchema.parse(input);

  const stub = await prisma.bibleVerse.findFirst({
    where: { id: verseId, userId: user.id, fetchStatus: 'ambiguous' },
  });
  if (!stub) throw new Error('Câu kinh không cần làm rõ');

  // Fetch the resolved verse — may hit existing cache for this (book, range).
  const fresh = await getOrFetchVerse(user.id, {
    bookCode,
    bookName: vnNameOf(bookCode),
    chapter: stub.chapter,
    startVerse: stub.startVerse,
    endVerse: stub.endVerse,
    version: stub.version,
  });

  if (fresh.id === stub.id) return; // Shouldn't happen (different bookCode), but defensive

  // Re-point all lesson links from stub → fresh, then delete the stub.
  await prisma.$transaction([
    prisma.bibleLessonVerse.updateMany({
      where: { verseId: stub.id },
      data: { verseId: fresh.id },
    }),
    prisma.bibleVerse.delete({ where: { id: stub.id } }),
  ]);

  revalidatePath(paths.dashboard.bible.root);
}
