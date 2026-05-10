'use server';

import dayjs from 'dayjs';

import { prisma } from 'src/lib/prisma';
import { requireUser } from 'src/lib/auth-helpers';

import { signalMetadataSchema } from '../schemas';

// ----------------------------------------------------------------------

export type SignalPattern = {
  kind: 'positive' | 'negative';
  trigger: string;
  emotion: string;
  freq: number;
  /** ISO string of the most recent signal matching this pattern. */
  lastSeen: string;
  /** Pulled from the latest entry's `meaning` field (may be undefined). */
  meaning?: string;
  /** Pulled from the latest entry's `action` field (may be undefined). */
  suggestedAction?: string;
};

export type SignalPatternsResult = {
  negative: SignalPattern[];
  positive: SignalPattern[];
};

/**
 * Aggregate SIGNAL rows for the current calendar month.
 * Groups by (kind × trigger × emotion), counts frequency, returns top 3
 * per polarity (negative first — red flags surfaced prominently).
 *
 * JS-side grouping is used (not SQL GROUP BY on JSONB) because:
 * - Per-user data volume is small
 * - Avoids raw SQL / Prisma.$queryRaw complexity
 * - Simpler to maintain
 */
export async function getSignalPatterns(): Promise<SignalPatternsResult> {
  const user = await requireUser();

  const startOfMonth = dayjs().startOf('month').toDate();
  const endOfMonth = dayjs().endOf('month').toDate();

  const rows = await prisma.note.findMany({
    where: {
      userId: user.id,
      type: 'SIGNAL',
      createdAt: { gte: startOfMonth, lte: endOfMonth },
    },
    orderBy: { createdAt: 'desc' },
    select: { metadata: true, createdAt: true },
  });

  // Map: `${kind}||${trigger}||${emotion}` → aggregated data
  const map = new Map<
    string,
    {
      kind: 'positive' | 'negative';
      trigger: string;
      emotion: string;
      freq: number;
      lastSeen: Date;
      meaning?: string;
      suggestedAction?: string;
    }
  >();

  for (const row of rows) {
    const parsed = signalMetadataSchema.safeParse(row.metadata);
    if (!parsed.success) continue; // skip malformed rows silently

    const { kind, trigger, emotion, meaning, action } = parsed.data;
    const key = `${kind}||${trigger}||${emotion}`;

    const existing = map.get(key);
    if (existing) {
      existing.freq += 1;
      // Rows ordered desc — first hit per key is already the most recent
    } else {
      map.set(key, {
        kind,
        trigger,
        emotion,
        freq: 1,
        lastSeen: row.createdAt,
        meaning: meaning ?? undefined,
        suggestedAction: action ?? undefined,
      });
    }
  }

  const allPatterns = Array.from(map.values())
    .sort((a, b) => b.freq - a.freq)
    .map(
      (p): SignalPattern => ({
        kind: p.kind,
        trigger: p.trigger,
        emotion: p.emotion,
        freq: p.freq,
        lastSeen: p.lastSeen.toISOString(),
        meaning: p.meaning,
        suggestedAction: p.suggestedAction,
      })
    );

  return {
    negative: allPatterns.filter((p) => p.kind === 'negative').slice(0, 3),
    positive: allPatterns.filter((p) => p.kind === 'positive').slice(0, 3),
  };
}
