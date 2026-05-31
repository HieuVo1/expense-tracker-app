'use server';

import { prisma } from 'src/lib/prisma';
import { getCurrentUser } from 'src/lib/auth-helpers';

// Deterministic-per-day verse picker for the dashboard hub. Same verse all
// day for one user (so refresh doesn't jitter), rolls over at UTC midnight.
// Same hash trick as about-me daily reflection.

export type DailyVerseRow = {
  id: string;
  bookCode: string;
  bookName: string;
  chapter: number;
  startVerse: number;
  endVerse: number;
  text: string;
  version: string;
};

const MOD32 = 2 ** 32;

function hashStr(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i += 1) {
    h = (h * 33 + s.charCodeAt(i)) % MOD32;
  }
  return h;
}

/**
 * Pick one OK-status verse from the user's lessons deterministically per
 * (user, calendar day). Returns null if the user is logged out or has no
 * eligible verses.
 */
export async function getDailyVerse(): Promise<DailyVerseRow | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const where = {
    userId: user.id,
    fetchStatus: 'ok',
    // Only verses actually linked to at least one lesson — avoids surfacing
    // orphan cache rows from prior imports the user has since deleted.
    lessons: { some: {} },
  } as const;

  const total = await prisma.bibleVerse.count({ where });
  if (total === 0) return null;

  const dateStr = new Date().toISOString().slice(0, 10);
  const offset = hashStr(`${user.id}-${dateStr}`) % total;

  const row = await prisma.bibleVerse.findFirst({
    where,
    skip: offset,
    orderBy: { id: 'asc' },
  });
  if (!row) return null;

  return {
    id: row.id,
    bookCode: row.bookCode,
    bookName: row.bookName,
    chapter: row.chapter,
    startVerse: row.startVerse,
    endVerse: row.endVerse,
    text: row.text,
    version: row.version,
  };
}
