'use server';

import type { AboutMeRow, AboutMeType } from '../types';

import { prisma } from 'src/lib/prisma';
import { getCurrentUser } from 'src/lib/auth-helpers';

// Types eligible as "reflection of the day". Skip ACTION/SIGNAL/TRAIT — those
// are tasks/mood/labels, not self-reminders worth surfacing on app open.
const REFLECTION_TYPES: AboutMeType[] = ['THOUGHT', 'LESSON', 'PRINCIPLE', 'GOAL'];

// djb2-style hash via Math — eslint disallows bitwise ops, so use multiplication
// and modulo by 2^32 for the same deterministic distribution. Non-crypto, plenty
// of entropy for a daily reflection seed.
const MOD32 = 2 ** 32;
function hashStr(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i += 1) {
    h = (h * 33 + s.charCodeAt(i)) % MOD32;
  }
  return h;
}

/**
 * Pick one about-me row deterministically per (user, calendar day).
 * Same row returned all day, different from yesterday — refresh-stable.
 * Returns `null` if the user has no eligible entries or is not signed in.
 */
export async function getDailyReflection(): Promise<AboutMeRow | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const where = {
    userId: user.id,
    type: { in: REFLECTION_TYPES },
  } as const;

  const total = await prisma.note.count({ where });
  if (total === 0) return null;

  // Seed: userId scopes the picker per user; UTC date string ticks once per day.
  // Server runs UTC on Vercel — VN users see the row roll over around 07:00 ICT.
  // Acceptable for a daily reflection; using local timezone would add complexity
  // without meaningful UX gain.
  const dateStr = new Date().toISOString().slice(0, 10);
  const seed = hashStr(`${user.id}-${dateStr}`);
  const offset = seed % total;

  const row = await prisma.note.findFirst({
    where,
    skip: offset,
    orderBy: { id: 'asc' },
  });
  if (!row) return null;

  return {
    id: row.id,
    type: row.type as AboutMeType,
    title: row.title,
    content: row.content,
    tags: row.tags,
    metadata:
      row.metadata !== null && typeof row.metadata === 'object'
        ? (row.metadata as Record<string, unknown>)
        : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
