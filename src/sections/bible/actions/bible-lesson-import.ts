'use server';

import type { BibleVerse } from '@prisma/client';
import type { ParsedRef, ImportResult } from '../types';

import { revalidatePath } from 'next/cache';

import { paths } from 'src/routes/paths';

import { prisma } from 'src/lib/prisma';
import { requireUser } from 'src/lib/auth-helpers';
import { DEFAULT_VERSION, getOrFetchVerse, createAmbiguousVerse } from 'src/lib/bible';

import { importLessonSchema } from '../schemas';
import { parseLessonMarkdown } from '../lib/lesson-markdown';

// Single-file upload importer. Parses the Obsidian markdown, fetches verse
// text via the cache/provider chain (bible-com → gemini → stub), then writes
// the lesson + verse links in one transaction.
//
// Network fetches happen BEFORE the transaction so we never hold a DB lock
// across an 8s HTTP roundtrip.

const FETCH_CONCURRENCY = 3;

export async function importLessonFile(formData: FormData): Promise<ImportResult> {
  let user;
  try {
    user = await requireUser();
  } catch {
    return { ok: false, error: 'Phiên đăng nhập đã hết hạn' };
  }

  // --- 1. Validate file ---
  const file = formData.get('file');
  const parsed = importLessonSchema.safeParse({ file });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Tệp không hợp lệ' };
  }
  const rawMarkdown = await parsed.data.file.text();

  // --- 2. Parse markdown ---
  const lesson = parseLessonMarkdown(rawMarkdown);
  if (lesson.frontmatter.template !== 'bible-lesson-v1') {
    return {
      ok: false,
      error: 'Frontmatter "template" phải là "bible-lesson-v1"',
    };
  }
  if (!lesson.frontmatter.date) {
    return { ok: false, error: 'Frontmatter thiếu trường "date" (YYYY-MM-DD)' };
  }
  const dateObj = new Date(lesson.frontmatter.date);
  if (Number.isNaN(dateObj.getTime())) {
    return { ok: false, error: 'Trường "date" không phải định dạng YYYY-MM-DD' };
  }
  const version = lesson.frontmatter.bibleVersion || DEFAULT_VERSION;
  const title = (lesson.frontmatter.title?.trim() || lesson.title || 'Bài học').slice(0, 200);

  // --- 2.5 Reject duplicate ---
  // Heuristic: same user + same date + same title means the user is re-importing
  // a file they've already pushed. Cheaper than waiting for them to discover
  // duplicates in the lesson list later.
  const duplicate = await prisma.bibleLesson.findFirst({
    where: { userId: user.id, title, date: dateObj },
    select: { id: true, sourceFilename: true },
  });
  if (duplicate) {
    return {
      ok: false,
      error: `Bài học "${title}" ngày ${lesson.frontmatter.date} đã tồn tại${
        duplicate.sourceFilename ? ` (từ ${duplicate.sourceFilename})` : ''
      }. Xoá bản cũ trước nếu muốn import lại.`,
    };
  }

  // --- 3. Fetch verses (chunked) ---
  // refs already deduped by the parser. Successful refs go through the provider
  // chain; ambiguous + unknown_book + malformed get stub rows so the lesson
  // can still link them (user resolves later via UI).
  const okRefs = lesson.refs.filter((r): r is Extract<ParsedRef, { ok: true }> => r.ok);
  const ambiguousRefs = lesson.refs.filter(
    (r) => !r.ok && r.reason === 'ambiguous'
  ) as Extract<ParsedRef, { ok: false; reason: 'ambiguous' }>[];
  const unknownRefs = lesson.refs.filter(
    (r) => !r.ok && r.reason === 'unknown_book'
  ) as Extract<ParsedRef, { ok: false; reason: 'unknown_book' }>[];
  const malformedRefs = lesson.refs.filter((r) => !r.ok && r.reason === 'malformed');

  // Run okRefs in chunks of FETCH_CONCURRENCY to bound concurrent bible.com
  // requests. Each fetch is idempotent (cache-first), so failures don't
  // poison shared state.
  const fetchedOk: BibleVerse[] = [];
  for (let i = 0; i < okRefs.length; i += FETCH_CONCURRENCY) {
    const chunk = okRefs.slice(i, i + FETCH_CONCURRENCY);
    const results = await Promise.all(
      chunk.map((r) =>
        getOrFetchVerse(user.id, {
          bookCode: r.bookCode,
          bookName: r.bookName,
          chapter: r.chapter,
          startVerse: r.startVerse,
          endVerse: r.endVerse,
          version,
        })
      )
    );
    fetchedOk.push(...results);
  }

  // Ambiguous + unknown_book → stub rows. We can't fetch (no resolved book);
  // user will resolve via the UI. Same row shape so the lesson-verse link
  // works uniformly.
  const ambiguousVerses: BibleVerse[] = [];
  for (const r of [...ambiguousRefs, ...unknownRefs]) {
    const row = await createAmbiguousVerse(
      user.id,
      r.bookName,
      r.chapter,
      r.startVerse,
      r.endVerse,
      version
    );
    ambiguousVerses.push(row);
  }

  // Preserve user's ordering (the order refs appear in section 2).
  const orderedVerses: { verseId: string; order: number }[] = [];
  let ord = 0;
  for (const r of lesson.refs) {
    if (r.ok) {
      const match = fetchedOk.find(
        (v) =>
          v.bookCode === r.bookCode &&
          v.chapter === r.chapter &&
          v.startVerse === r.startVerse &&
          v.endVerse === r.endVerse
      );
      if (match) orderedVerses.push({ verseId: match.id, order: ord++ });
    } else if (r.reason === 'ambiguous' || r.reason === 'unknown_book') {
      const match = ambiguousVerses.shift();
      if (match) orderedVerses.push({ verseId: match.id, order: ord++ });
    }
    // malformed: skip silently (would create a junk row otherwise)
  }

  // --- 4. Persist lesson + links ---
  const created = await prisma.bibleLesson.create({
    data: {
      userId: user.id,
      title,
      date: dateObj,
      sourceFilename: parsed.data.file.name,
      bibleVersion: version,
      rawMarkdown,
      parsedSections: JSON.parse(JSON.stringify(lesson.sections)),
      verses: {
        create: orderedVerses,
      },
    },
    select: { id: true },
  });

  revalidatePath(paths.dashboard.bible.root);

  return {
    ok: true,
    lessonId: created.id,
    verseCount: orderedVerses.length,
    ambiguousCount: ambiguousRefs.length + unknownRefs.length,
    unknownCount: unknownRefs.length,
    malformedCount: malformedRefs.length,
  };
}
