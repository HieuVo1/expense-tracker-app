'use server';

import type { LifeArea, TimeSlot, TaskPriority } from '@prisma/client';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';

import { paths } from 'src/routes/paths';

import { prisma } from 'src/lib/prisma';
import { requireUser } from 'src/lib/auth-helpers';

// ----------------------------------------------------------------------

const LIFE_AREA_ENUM = z.enum([
  'HEALTH',
  'CAREER',
  'FINANCE',
  'GROWTH',
  'FAMILY',
  'SOCIAL',
  'RECREATION',
  'SPIRITUALITY',
]);

const addTaskSchema = z.object({
  title: z.string().trim().min(1, 'Vui lòng nhập tên việc').max(200),
  priority: z.enum(['do_first', 'schedule', 'delegate', 'eliminate']),
  lifeArea: LIFE_AREA_ENUM.nullable().optional(),
});

const updateTaskSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  priority: z.enum(['do_first', 'schedule', 'delegate', 'eliminate']).optional(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  // undefined = no change, null = clear tag, value = set tag
  lifeArea: LIFE_AREA_ENUM.nullable().optional(),
});

// ----------------------------------------------------------------------

async function getMaxOrderInGroup(planId: string, priority: TaskPriority): Promise<number> {
  const result = await prisma.planTask.aggregate({
    where: { planId, priority },
    _max: { order: true },
  });
  return result._max.order ?? 0;
}

// ----------------------------------------------------------------------

export async function addTask(
  planId: string,
  input: { title: string; priority: TaskPriority; lifeArea?: LifeArea | null }
): Promise<void> {
  const user = await requireUser();

  const plan = await prisma.plan.findFirst({ where: { id: planId, userId: user.id } });
  if (!plan) throw new Error('NOT_FOUND');

  const data = addTaskSchema.parse(input);
  const maxOrder = await getMaxOrderInGroup(planId, data.priority);

  await prisma.planTask.create({
    data: {
      planId,
      title: data.title,
      priority: data.priority,
      lifeArea: data.lifeArea ?? null,
      order: maxOrder + 1,
    },
  });

  revalidatePath(paths.dashboard.planDetail(planId));
}

// ----------------------------------------------------------------------

export async function toggleTask(id: string, isDone: boolean): Promise<void> {
  const user = await requireUser();

  const task = await prisma.planTask.findFirst({
    where: { id, plan: { userId: user.id } },
  });
  if (!task) throw new Error('NOT_FOUND');

  await prisma.planTask.update({ where: { id }, data: { isDone } });

  revalidatePath(paths.dashboard.planDetail(task.planId));
}

// ----------------------------------------------------------------------

export async function updateTask(
  id: string,
  patch: {
    title?: string;
    priority?: TaskPriority;
    dueDate?: string | null;
    lifeArea?: LifeArea | null;
  }
): Promise<void> {
  const user = await requireUser();

  const task = await prisma.planTask.findFirst({
    where: { id, plan: { userId: user.id } },
  });
  if (!task) throw new Error('NOT_FOUND');

  const data = updateTaskSchema.parse(patch);

  let newOrder: number | undefined;
  if (data.priority && data.priority !== task.priority) {
    const maxOrder = await getMaxOrderInGroup(task.planId, data.priority);
    newOrder = maxOrder + 1;
  }

  await prisma.planTask.update({
    where: { id },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.priority !== undefined && { priority: data.priority }),
      ...(newOrder !== undefined && { order: newOrder }),
      ...(data.dueDate !== undefined && {
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
      }),
      ...(data.lifeArea !== undefined && { lifeArea: data.lifeArea }),
    },
  });

  revalidatePath(paths.dashboard.planDetail(task.planId));
}

// ----------------------------------------------------------------------

export async function deleteTask(id: string): Promise<void> {
  const user = await requireUser();

  const task = await prisma.planTask.findFirst({
    where: { id, plan: { userId: user.id } },
  });
  if (!task) throw new Error('NOT_FOUND');

  await prisma.planTask.delete({ where: { id } });

  revalidatePath(paths.dashboard.planDetail(task.planId));
}

// ----------------------------------------------------------------------

/**
 * Schedule a task to a specific day + slot on the weekly calendar.
 * Pass `null` for date OR slot to unschedule that field. To fully unschedule,
 * call with both nulls (use `unscheduleTask` for clarity).
 */
export async function scheduleTask(
  taskId: string,
  scheduledDate: string | null,
  scheduledSlot: TimeSlot | null
): Promise<void> {
  const user = await requireUser();

  const task = await prisma.planTask.findFirst({
    where: { id: taskId, plan: { userId: user.id } },
  });
  if (!task) throw new Error('NOT_FOUND');

  await prisma.planTask.update({
    where: { id: taskId },
    data: {
      scheduledDate: scheduledDate ? new Date(`${scheduledDate}T00:00:00.000Z`) : null,
      scheduledSlot,
    },
  });

  revalidatePath(paths.dashboard.planDetail(task.planId));
  revalidatePath(paths.dashboard.plans);
}

// ----------------------------------------------------------------------

export async function unscheduleTask(taskId: string): Promise<void> {
  return scheduleTask(taskId, null, null);
}

// ----------------------------------------------------------------------

/**
 * Re-assigns a task to a different plan owned by the same user.
 * Places the task at the bottom of its priority group in the target plan.
 */
export async function moveTaskToPlan(taskId: string, targetPlanId: string): Promise<void> {
  const user = await requireUser();

  const [task, target] = await Promise.all([
    prisma.planTask.findFirst({ where: { id: taskId, plan: { userId: user.id } } }),
    prisma.plan.findFirst({ where: { id: targetPlanId, userId: user.id } }),
  ]);
  if (!task || !target) throw new Error('NOT_FOUND');
  if (task.planId === targetPlanId) return; // no-op

  const maxOrder = await getMaxOrderInGroup(targetPlanId, task.priority);

  await prisma.planTask.update({
    where: { id: taskId },
    data: { planId: targetPlanId, order: maxOrder + 1 },
  });

  revalidatePath(paths.dashboard.planDetail(task.planId));
  revalidatePath(paths.dashboard.planDetail(targetPlanId));
}
