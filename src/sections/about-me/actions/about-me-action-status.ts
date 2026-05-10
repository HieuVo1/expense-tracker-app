'use server';

import { revalidatePath } from 'next/cache';

import { paths } from 'src/routes/paths';

import { prisma } from 'src/lib/prisma';
import { requireUser } from 'src/lib/auth-helpers';

// ----------------------------------------------------------------------

type ActionStatus = 'planned' | 'doing' | 'done' | 'skipped';
type GoalStatus = 'active' | 'achieved' | 'paused' | 'abandoned';

const ACTION_STATUSES: ActionStatus[] = ['planned', 'doing', 'done', 'skipped'];
const GOAL_STATUSES: GoalStatus[] = ['active', 'achieved', 'paused', 'abandoned'];

/**
 * Toggle status for ACTION or GOAL rows.
 *
 * - ACTION: cycles through planned → doing → done → skipped
 * - GOAL: accepts any of active | achieved | paused | abandoned
 *
 * The `progress` field is NOT reset when GOAL moves to paused/abandoned —
 * it remains as a frozen snapshot of last known progress (confirmed default).
 *
 * Named `toggleActionStatus` (not renamed) per YAGNI — it's a thin
 * metadata-merge regardless of whether the row is ACTION or GOAL.
 */
export async function toggleActionStatus(
  id: string,
  newStatus: ActionStatus | GoalStatus
): Promise<void> {
  const user = await requireUser();

  const row = await prisma.note.findFirst({
    where: {
      id,
      userId: user.id,
      type: { in: ['ACTION', 'GOAL'] },
    },
    select: { type: true, metadata: true },
  });

  if (!row) {
    throw new Error(`About-me row ${id} not found or not owned`);
  }

  const isAction = row.type === 'ACTION';
  const isGoal = row.type === 'GOAL';

  // Validate the incoming status against the per-type allowed set.
  if (isAction && !ACTION_STATUSES.includes(newStatus as ActionStatus)) {
    throw new Error(`Invalid ACTION status: "${newStatus}"`);
  }
  if (isGoal && !GOAL_STATUSES.includes(newStatus as GoalStatus)) {
    throw new Error(`Invalid GOAL status: "${newStatus}"`);
  }

  const currentMeta =
    row.metadata !== null && typeof row.metadata === 'object'
      ? (row.metadata as Record<string, unknown>)
      : {};

  await prisma.note.update({
    where: { id, userId: user.id },
    data: {
      metadata: { ...currentMeta, status: newStatus },
    },
  });

  revalidatePath(paths.dashboard.aboutMe);
  revalidatePath(paths.dashboard.aboutMeType(row.type.toLowerCase()));
}
