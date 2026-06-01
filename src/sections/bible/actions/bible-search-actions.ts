'use server';

import type { VerseHit, LessonHit, SearchResult } from '../types';

import { prisma } from 'src/lib/prisma';
import { requireUser } from 'src/lib/auth-helpers';

import { searchQuerySchema } from '../schemas';

const CAP = 50;

// ---------------------------------------------------------------------------
// searchBible — return grouped ILIKE hits across BibleLesson + BibleVerse.
// Both queries run in parallel; each is hard-capped at 50 results per group.
// ---------------------------------------------------------------------------

export async function searchBible(input: { q: string }): Promise<SearchResult> {
  const user = await requireUser();

  const parsed = searchQuerySchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Từ khoá không hợp lệ');
  }
  const { q } = parsed.data;

  const [lessonRows, verseRows] = await Promise.all([
    prisma.bibleLesson.findMany({
      where: {
        userId: user.id,
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { rawMarkdown: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: { id: true, title: true, date: true, rawMarkdown: true },
      orderBy: { date: 'desc' },
      take: CAP + 1, // +1 to detect truncation
    }),
    prisma.bibleVerse.findMany({
      where: {
        userId: user.id,
        fetchStatus: 'ok',
        OR: [
          { text: { contains: q, mode: 'insensitive' } },
          { bookName: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        bookCode: true,
        bookName: true,
        chapter: true,
        startVerse: true,
        endVerse: true,
        text: true,
      },
      take: CAP + 1,
    }),
  ]);

  const lessons: LessonHit[] = lessonRows.slice(0, CAP).map((l) => {
    const inTitle = l.title.toLowerCase().includes(q.toLowerCase());
    return {
      id: l.id,
      title: l.title,
      date: l.date.toISOString().slice(0, 10),
      snippet: inTitle ? makeSnippet(l.title, q) : makeSnippet(l.rawMarkdown, q),
      matchField: inTitle ? 'title' : 'content',
    };
  });

  const verses: VerseHit[] = verseRows.slice(0, CAP).map((v) => {
    const range =
      v.startVerse === v.endVerse ? `${v.startVerse}` : `${v.startVerse}-${v.endVerse}`;
    const refLabel = `${v.bookName} ${v.chapter}:${range}`;
    const inBook = v.bookName.toLowerCase().includes(q.toLowerCase());
    return {
      verseId: v.id,
      bookCode: v.bookCode,
      bookName: v.bookName,
      chapter: v.chapter,
      startVerse: v.startVerse,
      endVerse: v.endVerse,
      refLabel,
      snippet: makeSnippet(v.text, q),
      matchField: inBook ? 'ref' : 'text',
    };
  });

  return {
    q,
    lessons,
    verses,
    truncated: {
      lessons: lessonRows.length > CAP,
      verses: verseRows.length > CAP,
    },
  };
}

// ---------------------------------------------------------------------------
// makeSnippet — extract ≤80-char window centered around first occurrence of q.
// Collapses whitespace runs to single space; adds ellipsis markers when sliced.
// ---------------------------------------------------------------------------

function makeSnippet(body: string, q: string, max = 80): string {
  const lower = body.toLowerCase();
  const idx = lower.indexOf(q.toLowerCase());
  const start = idx >= 0 ? Math.max(0, idx - 20) : 0;
  const end = Math.min(body.length, start + max);
  const prefix = start > 0 ? '…' : '';
  const suffix = end < body.length ? '…' : '';
  return prefix + body.slice(start, end).replace(/\s+/g, ' ').trim() + suffix;
}
