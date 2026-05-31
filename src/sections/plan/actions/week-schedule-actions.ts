'use server';

import type {
  SchedulableTask,
  AlreadyScheduled,
  ScheduleAssignment,
} from 'src/lib/ai/week-schedule';

import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import { revalidatePath } from 'next/cache';

import { paths } from 'src/routes/paths';

import { prisma } from 'src/lib/prisma';
import { requireUser } from 'src/lib/auth-helpers';
import { requestWeekSchedule } from 'src/lib/ai/week-schedule';

dayjs.extend(isoWeek);

// ----------------------------------------------------------------------

function dateOnlyUtc(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00.000Z`);
}

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function buildCurrentIsoWeek(): { weekStart: string; weekEnd: string; weekDays: string[] } {
  const start = dayjs().startOf('isoWeek');
  const end = dayjs().endOf('isoWeek');
  const weekDays: string[] = [];
  for (let i = 0; i < 7; i += 1) {
    weekDays.push(start.add(i, 'day').format('YYYY-MM-DD'));
  }
  return {
    weekStart: start.format('YYYY-MM-DD'),
    weekEnd: end.format('YYYY-MM-DD'),
    weekDays,
  };
}

// ----------------------------------------------------------------------

/**
 * 1-click AI weekly scheduler — scans ALL active plans (weekly + monthly +
 * yearly + backlog) for undone tasks and asks Gemini to assign them into the
 * current ISO week (Mon-Sun). Tasks already scheduled inside this week are
 * kept as-is; tasks scheduled outside the week are treated as unscheduled.
 *
 * Returns count + assignments so the client can merge without a re-fetch.
 */
export async function aiScheduleWeek(): Promise<{
  scheduledCount: number;
  assignments: ScheduleAssignment[];
}> {
  const user = await requireUser();
  const { weekStart, weekEnd, weekDays } = buildCurrentIsoWeek();

  const tasks = await prisma.planTask.findMany({
    where: {
      plan: { userId: user.id, status: 'active' },
      isDone: false,
    },
    select: {
      id: true,
      title: true,
      priority: true,
      lifeArea: true,
      dueDate: true,
      isDone: true,
      scheduledDate: true,
      scheduledSlot: true,
      planId: true,
    },
  });

  // Split tasks: already in current week (don't re-schedule) vs needs-slot.
  const inWeekRange = (d: Date | null): boolean => {
    if (!d) return false;
    const s = ymd(d);
    return s >= weekStart && s <= weekEnd;
  };

  const alreadyScheduled: AlreadyScheduled[] = [];
  const unscheduled: SchedulableTask[] = [];

  for (const t of tasks) {
    if (t.scheduledDate && t.scheduledSlot && inWeekRange(t.scheduledDate)) {
      alreadyScheduled.push({
        id: t.id,
        title: t.title,
        date: ymd(t.scheduledDate),
        slot: t.scheduledSlot,
      });
    } else {
      unscheduled.push({
        id: t.id,
        title: t.title,
        priority: t.priority,
        lifeArea: t.lifeArea,
        dueDate: t.dueDate ? ymd(t.dueDate) : null,
        isDone: t.isDone,
      });
    }
  }

  if (unscheduled.length === 0) return { scheduledCount: 0, assignments: [] };

  const assignments = await requestWeekSchedule({
    weekStart,
    weekEnd,
    weekDays,
    unscheduled,
    alreadyScheduled,
  });

  if (assignments.length > 0) {
    await prisma.$transaction(
      assignments.map((a) =>
        prisma.planTask.update({
          where: { id: a.taskId },
          data: {
            scheduledDate: dateOnlyUtc(a.date),
            scheduledSlot: a.slot,
          },
        })
      )
    );
  }

  revalidatePath(paths.dashboard.plans);

  return { scheduledCount: assignments.length, assignments };
}

// ----------------------------------------------------------------------

/**
 * Clear schedule assignments for all undone tasks across the user's active
 * plans whose scheduledDate falls within the current ISO week.
 */
export async function clearWeekSchedule(): Promise<{ clearedCount: number }> {
  const user = await requireUser();
  const { weekStart, weekEnd } = buildCurrentIsoWeek();

  const result = await prisma.planTask.updateMany({
    where: {
      plan: { userId: user.id, status: 'active' },
      isDone: false,
      scheduledDate: {
        gte: dateOnlyUtc(weekStart),
        lte: dateOnlyUtc(weekEnd),
      },
    },
    data: { scheduledDate: null, scheduledSlot: null },
  });

  revalidatePath(paths.dashboard.plans);
  return { clearedCount: result.count };
}
