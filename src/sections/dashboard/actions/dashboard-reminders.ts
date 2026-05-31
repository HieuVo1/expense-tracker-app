'use server';

import type { PlanScope, TaskPriority } from '@prisma/client';

import { fTodayVN, fTodayVNDate } from 'src/utils/format-time';

import { prisma } from 'src/lib/prisma';
import { requireUser } from 'src/lib/auth-helpers';

import { GRATITUDE_TARGET } from 'src/sections/gratitude/constants/gratitude';


// ----------------------------------------------------------------------

export type ReminderTask = {
  id: string;
  title: string;
  priority: TaskPriority;
  dueDate: string; // YYYY-MM-DD
  planId: string;
  planTitle: string;
};

export type ReminderExpiredPlan = {
  id: string;
  title: string;
  scope: PlanScope;
  endDate: string; // YYYY-MM-DD
  incompleteCount: number;
};

export type DashboardReminders = {
  todayTasks: ReminderTask[];
  overdueTasks: ReminderTask[];
  expiredPlans: ReminderExpiredPlan[];
  // True when today has fewer than GRATITUDE_TARGET gratitude items (soft goal).
  gratitudePending: boolean;
  totalCount: number;
};

// ----------------------------------------------------------------------

/**
 * Returns reminders to surface when the user opens the app:
 *  - Tasks due today (not done)
 *  - Tasks overdue (dueDate < today, not done)
 *  - Active plans whose endDate has passed but still have incomplete tasks
 *    (suggesting rollover)
 *
 * Empty arrays when nothing pending — the dashboard hides the card entirely.
 */
export async function getDashboardReminders(): Promise<DashboardReminders> {
  const user = await requireUser();
  const today = fTodayVN();
  const todayDate = fTodayVNDate();

  // Fetch tasks with a dueDate that is <= today and not done.
  // Server-side filter keeps payload small even with many tasks.
  const tasks = await prisma.planTask.findMany({
    where: {
      plan: { userId: user.id },
      isDone: false,
      dueDate: { not: null, lte: todayDate },
    },
    include: { plan: { select: { id: true, title: true } } },
    orderBy: [{ dueDate: 'asc' }, { priority: 'asc' }, { order: 'asc' }],
    take: 50, // cap noise — extreme cases truncated; user can drill in to see more
  });

  const overdueTasks: ReminderTask[] = [];
  const todayTasks: ReminderTask[] = [];

  for (const t of tasks) {
    if (!t.dueDate) continue;
    const dueDateStr = t.dueDate.toISOString().slice(0, 10);
    const item: ReminderTask = {
      id: t.id,
      title: t.title,
      priority: t.priority,
      dueDate: dueDateStr,
      planId: t.planId,
      planTitle: t.plan.title,
    };
    if (dueDateStr < today) overdueTasks.push(item);
    else if (dueDateStr === today) todayTasks.push(item);
  }

  // Expired active plans with at least one incomplete task.
  const expiredCandidates = await prisma.plan.findMany({
    where: {
      userId: user.id,
      status: 'active',
      endDate: { lt: todayDate },
      // Exclude backlog plans (no endDate) — `lt` filter already does this in
      // Postgres but adding the explicit guard narrows the TS type.
      NOT: { endDate: null },
    },
    include: { _count: { select: { tasks: { where: { isDone: false } } } } },
    orderBy: { endDate: 'desc' },
    take: 20,
  });

  const expiredPlans: ReminderExpiredPlan[] = expiredCandidates
    .filter((p) => p._count.tasks > 0 && p.endDate !== null)
    .map((p) => ({
      id: p.id,
      title: p.title,
      scope: p.scope,
      endDate: p.endDate!.toISOString().slice(0, 10),
      incompleteCount: p._count.tasks,
    }));

  // Daily gratitude nudge — pending until today reaches the soft goal (not
  // enforced on save, just used to keep reminding).
  const gratitudeToday = await prisma.gratitudeEntry.findUnique({
    where: { userId_date: { userId: user.id, date: todayDate } },
    select: { items: true },
  });
  const gratitudePending = (gratitudeToday?.items.length ?? 0) < GRATITUDE_TARGET;

  return {
    todayTasks,
    overdueTasks,
    expiredPlans,
    gratitudePending,
    totalCount:
      todayTasks.length +
      overdueTasks.length +
      expiredPlans.length +
      (gratitudePending ? 1 : 0),
  };
}
