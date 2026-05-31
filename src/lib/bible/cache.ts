import type { BibleVerse } from '@prisma/client';
import type { VerseRef, BibleSourceProvider } from './types';

import { prisma } from 'src/lib/prisma';

import { getBibleProviders } from './index';
import { normalizeRef, DEFAULT_VERSION } from './types';

// Cache lookup + provider chain — the only function callers (importer,
// refresh action) need. DB row at `BibleVerse` per
// `(userId, bookCode, chapter, startVerse, endVerse, version)` is the source
// of truth; once fetched a range is never re-fetched unless `force=true`.

export type GetOrFetchOptions = {
  /** Bypass DB cache; always re-run providers. */
  force?: boolean;
};

export async function getOrFetchVerse(
  userId: string,
  ref: VerseRef,
  options: GetOrFetchOptions = {}
): Promise<BibleVerse> {
  const normalized = normalizeRef(ref);
  const version = normalized.version ?? DEFAULT_VERSION;
  const where = {
    userId_bookCode_chapter_startVerse_endVerse_version: {
      userId,
      bookCode: normalized.bookCode,
      chapter: normalized.chapter,
      startVerse: normalized.startVerse,
      endVerse: normalized.endVerse,
      version,
    },
  };

  if (!options.force) {
    const existing = await prisma.bibleVerse.findUnique({ where });
    if (existing && existing.fetchStatus === 'ok') return existing;
  }

  // Try each provider until one succeeds. The order comes from env-driven
  // chain (default: bible-com → gemini).
  const providers = getBibleProviders();
  const attempts: string[] = [];
  let text = '';
  for (const p of providers) {
    const result = await tryProvider(p, normalized);
    if (result.ok) {
      text = result.text;
      break;
    }
    attempts.push(`${result.source}: ${result.error}`);
  }

  const fetchStatus = text ? 'ok' : 'failed';
  const finalText =
    text || `[Không lấy được nội dung. Đã thử: ${attempts.join(' | ')}]`;

  // Upsert is race-safe across the unique index — if a concurrent import for
  // the same range raced ahead, we just update with our fresher value.
  return prisma.bibleVerse.upsert({
    where,
    create: {
      userId,
      bookCode: normalized.bookCode,
      bookName: normalized.bookName,
      chapter: normalized.chapter,
      startVerse: normalized.startVerse,
      endVerse: normalized.endVerse,
      version,
      text: finalText,
      fetchStatus,
    },
    update: {
      text: finalText,
      fetchStatus,
      fetchedAt: new Date(),
      // bookName may change if user re-imports with a different VN spelling
      // (e.g. "Mat" → "Ma-thi-ơ"); keep the latest seen.
      bookName: normalized.bookName,
    },
  });
}

async function tryProvider(provider: BibleSourceProvider, ref: VerseRef) {
  try {
    return await provider.fetchVerse(ref);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false as const, error: `unhandled: ${msg}`, source: provider.name };
  }
}

/**
 * Create a stub BibleVerse row for an ambiguous reference (book name matches
 * multiple USFM codes, e.g. "Cô-rinh-tô" → 1CO/2CO). Lesson detail UI surfaces
 * a chip with a book picker to resolve.
 */
export async function createAmbiguousVerse(
  userId: string,
  bookName: string,
  chapter: number,
  startVerse: number,
  endVerse: number,
  version = DEFAULT_VERSION
): Promise<BibleVerse> {
  return prisma.bibleVerse.create({
    data: {
      userId,
      bookCode: '???',
      bookName,
      chapter,
      startVerse,
      endVerse,
      version,
      text: `[Cần làm rõ sách: "${bookName}"]`,
      fetchStatus: 'ambiguous',
    },
  });
}
