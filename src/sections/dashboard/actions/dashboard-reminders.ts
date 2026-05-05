'use server';

import type { PlanScope, TaskPriority } from '@prisma/client';

import dayjs from 'dayjs';

import { prisma } from 'src/lib/prisma';
import { requireUser } from 'src/lib/auth-helpers';

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
  const today = dayjs().format('YYYY-MM-DD');
  const todayDate = new Date(today);

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
    },
    include: { _count: { select: { tasks: { where: { isDone: false } } } } },
    orderBy: { endDate: 'desc' },
    take: 20,
  });

  const expiredPlans: ReminderExpiredPlan[] = expiredCandidates
    .filter((p) => p._count.tasks > 0)
    .map((p) => ({
      id: p.id,
      title: p.title,
      scope: p.scope,
      endDate: p.endDate.toISOString().slice(0, 10),
      incompleteCount: p._count.tasks,
    }));

  return {
    todayTasks,
    overdueTasks,
    expiredPlans,
    totalCount: todayTasks.length + overdueTasks.length + expiredPlans.length,
  };
}
