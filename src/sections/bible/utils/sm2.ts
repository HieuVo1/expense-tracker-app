import type { ReviewQuality } from '../types';

// SM-2 lite (4 quality levels instead of classic SM-2's 6). Inputs and outputs
// are PURE — no DB, no clock. Caller supplies "today" and the current row's
// (easiness, interval, repetitions); we return the new values plus the new
// nextReviewDate. Keeps the algorithm trivially testable.

const EF_MIN = 1.3;

export type SM2State = {
  easiness: number;     // 1.3..2.5+ — higher = remembered better
  interval: number;     // days until next review
  repetitions: number;  // consecutive successes (resets to 0 on Quên)
};

export type SM2Result = SM2State & {
  nextReviewDate: string; // YYYY-MM-DD
};

const clamp = (n: number, min: number) => (n < min ? min : n);

export function applyReview(
  prev: SM2State,
  quality: ReviewQuality,
  todayStr: string
): SM2Result {
  let { easiness, interval, repetitions } = prev;

  if (quality === 0) {
    // Quên — full reset, easiness drops a notch
    repetitions = 0;
    interval = 1;
    easiness = clamp(easiness - 0.2, EF_MIN);
  } else if (quality === 1) {
    // Khó — small bump, easiness dips
    interval = Math.max(1, Math.floor(interval * 1.2));
    easiness = clamp(easiness - 0.15, EF_MIN);
    repetitions += 1;
  } else if (quality === 2) {
    // OK — classic SM-2 progression
    repetitions += 1;
    if (repetitions === 1) interval = 1;
    else if (repetitions === 2) interval = 6;
    else interval = Math.ceil(interval * easiness);
    // easiness unchanged
  } else {
    // Dễ — accelerate intervals + bump easiness
    repetitions += 1;
    if (repetitions === 1) interval = 2;
    else if (repetitions === 2) interval = 8;
    else interval = Math.ceil(interval * easiness * 1.3);
    easiness += 0.1;
  }

  return {
    easiness,
    interval,
    repetitions,
    nextReviewDate: addDays(todayStr, interval),
  };
}

// Date math without dayjs: parse YYYY-MM-DD as UTC, add days, format back.
// Caller is responsible for passing a VN-anchored "today" (fTodayVN).
function addDays(yyyyMmDd: string, days: number): string {
  const d = new Date(`${yyyyMmDd}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * Initial state when a verse is reviewed for the first time. Defaults match
 * Prisma schema defaults so the upsert-create path is consistent with
 * upsert-update.
 */
export const SM2_INITIAL: SM2State = {
  easiness: 2.5,
  interval: 0,
  repetitions: 0,
};
