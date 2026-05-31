'use server';

import type { ReviewCardRow } from '../types';

import { revalidatePath } from 'next/cache';

import { paths } from 'src/routes/paths';

import { fTodayVN, fTodayVNDate } from 'src/utils/format-time';

import { prisma } from 'src/lib/prisma';
import { requireUser } from 'src/lib/auth-helpers';

import { reviewRecordSchema } from '../schemas';
import { applyReview, SM2_INITIAL } from '../utils/sm2';

// Spaced-repetition review actions. Day boundary is VN-anchored via fTodayVN
// (UTC server vs VN user is the bug we fixed last session — same pattern).

/**
 * Return all verses due for review today (or overdue).
 * - Verses with no BibleReviewState row → eligible the moment they're added.
 * - Verses with state → due when nextReviewDate <= today.
 * Capped at 50 / call to keep flashcard sessions sane; user can come back.
 */
export async function listDueVerses(): Promise<ReviewCardRow[]> {
  const user = await requireUser();
  const todayDate = fTodayVNDate();

  // 1) Verses with review state due today
  const due = await prisma.bibleVerse.findMany({
    where: {
      userId: user.id,
      fetchStatus: 'ok',
      review: { nextReviewDate: { lte: todayDate } },
    },
    include: { review: true },
    orderBy: { review: { nextReviewDate: 'asc' } },
    take: 50,
  });

  // 2) Top-up with verses that have NO review row yet (brand-new entries).
  const remaining = 50 - due.length;
  const fresh = remaining > 0
    ? await prisma.bibleVerse.findMany({
        where: {
          userId: user.id,
          fetchStatus: 'ok',
          review: null,
        },
        orderBy: { fetchedAt: 'desc' },
        take: remaining,
      })
    : [];

  return [
    ...due.map((v) => ({
      verseId: v.id,
      bookCode: v.bookCode,
      bookName: v.bookName,
      chapter: v.chapter,
      startVerse: v.startVerse,
      endVerse: v.endVerse,
      text: v.text,
      nextReviewDate: v.review!.nextReviewDate.toISOString().slice(0, 10),
      easiness: v.review!.easiness,
      interval: v.review!.interval,
      repetitions: v.review!.repetitions,
    })),
    ...fresh.map((v) => ({
      verseId: v.id,
      bookCode: v.bookCode,
      bookName: v.bookName,
      chapter: v.chapter,
      startVerse: v.startVerse,
      endVerse: v.endVerse,
      text: v.text,
      nextReviewDate: fTodayVN(),
      easiness: SM2_INITIAL.easiness,
      interval: SM2_INITIAL.interval,
      repetitions: SM2_INITIAL.repetitions,
    })),
  ];
}

export async function getDueCount(): Promise<number> {
  const user = await requireUser();
  const todayDate = fTodayVNDate();
  const [due, fresh] = await Promise.all([
    prisma.bibleVerse.count({
      where: {
        userId: user.id,
        fetchStatus: 'ok',
        review: { nextReviewDate: { lte: todayDate } },
      },
    }),
    prisma.bibleVerse.count({
      where: { userId: user.id, fetchStatus: 'ok', review: null },
    }),
  ]);
  return due + fresh;
}

/**
 * Record a review result. Upserts the BibleReviewState row — creates with
 * initial easiness on first review, updates SM-2 state on subsequent ones.
 */
export async function recordReview(input: {
  verseId: string;
  quality: 0 | 1 | 2 | 3;
}): Promise<{ nextReviewDate: string; interval: number }> {
  const user = await requireUser();
  const { verseId, quality } = reviewRecordSchema.parse(input);

  const verse = await prisma.bibleVerse.findFirst({
    where: { id: verseId, userId: user.id },
    select: { id: true, review: true },
  });
  if (!verse) throw new Error('Câu kinh không tồn tại');

  const today = fTodayVN();
  const prevState = verse.review
    ? {
        easiness: verse.review.easiness,
        interval: verse.review.interval,
        repetitions: verse.review.repetitions,
      }
    : SM2_INITIAL;

  const next = applyReview(prevState, quality, today);
  const nextDateObj = new Date(`${next.nextReviewDate}T00:00:00Z`);

  await prisma.bibleReviewState.upsert({
    where: { verseId },
    create: {
      userId: user.id,
      verseId,
      easiness: next.easiness,
      interval: next.interval,
      repetitions: next.repetitions,
      nextReviewDate: nextDateObj,
      lastReviewedAt: new Date(),
    },
    update: {
      easiness: next.easiness,
      interval: next.interval,
      repetitions: next.repetitions,
      nextReviewDate: nextDateObj,
      lastReviewedAt: new Date(),
    },
  });

  revalidatePath(paths.dashboard.bible.root);
  revalidatePath(paths.dashboard.bible.review);
  return { nextReviewDate: next.nextReviewDate, interval: next.interval };
}
