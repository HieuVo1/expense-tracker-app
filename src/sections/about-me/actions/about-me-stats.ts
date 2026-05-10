'use server';

import dayjs from 'dayjs';

import { prisma } from 'src/lib/prisma';
import { requireUser } from 'src/lib/auth-helpers';

// ----------------------------------------------------------------------

export type AboutMeStats = {
  /** Total entries across all 7 about-me types. */
  totalEntries: number;
  /** LESSON entries created in the current ISO week (Mon–Sun). */
  lessonCount: number;
  /**
   * SIGNAL entries with metadata.kind = 'negative' in the current calendar month.
   * Defined as "red flag tháng" per spec.
   */
  monthlyRedFlag: number;
  /** ACTION entries with metadata.status IN ('planned', 'doing'). */
  runningActions: number;
  /** All about-me entries created in the current ISO week. */
  weeklyNew: number;
};

/**
 * Returns activity stats for the about-me stats strip.
 * 4 targeted Prisma count queries + 1 findMany for JSON-filtered counts.
 * No GOAL stat — surfaced via card header badge in phase 04 instead.
 */
export async function getAboutMeStats(): Promise<AboutMeStats> {
  const user = await requireUser();

  const startOfWeek = dayjs().startOf('week').toDate();
  const startOfMonth = dayjs().startOf('month').toDate();
  const endOfMonth = dayjs().endOf('month').toDate();

  const ABOUT_ME_TYPES = [
    'GOAL',
    'THOUGHT',
    'LESSON',
    'SIGNAL',
    'PRINCIPLE',
    'TRAIT',
    'ACTION',
  ] as const;

  // Run independent counts in parallel.
  const [totalEntries, lessonCount, weeklyNew, signalRows, actionRows] = await Promise.all([
    // 1. Total across all 7 types
    prisma.note.count({
      where: { userId: user.id, type: { in: [...ABOUT_ME_TYPES] } },
    }),

    // 2. LESSON this week
    prisma.note.count({
      where: {
        userId: user.id,
        type: 'LESSON',
        createdAt: { gte: startOfWeek },
      },
    }),

    // 3. All about-me entries this week
    prisma.note.count({
      where: {
        userId: user.id,
        type: { in: [...ABOUT_ME_TYPES] },
        createdAt: { gte: startOfWeek },
      },
    }),

    // 4. SIGNAL rows this month — filter kind='negative' in JS (JSONB path filter
    //    requires raw SQL; JS-side is simpler and volume is small per user).
    prisma.note.findMany({
      where: {
        userId: user.id,
        type: 'SIGNAL',
        createdAt: { gte: startOfMonth, lte: endOfMonth },
      },
      select: { metadata: true },
    }),

    // 5. ACTION rows — filter running statuses in JS (same JSONB reason).
    prisma.note.findMany({
      where: { userId: user.id, type: 'ACTION' },
      select: { metadata: true },
    }),
  ]);

  const monthlyRedFlag = signalRows.filter((r) => {
    const meta = r.metadata as Record<string, unknown> | null;
    return meta?.kind === 'negative';
  }).length;

  const runningActions = actionRows.filter((r) => {
    const meta = r.metadata as Record<string, unknown> | null;
    return meta?.status === 'planned' || meta?.status === 'doing';
  }).length;

  return { totalEntries, lessonCount, monthlyRedFlag, runningActions, weeklyNew };
}
