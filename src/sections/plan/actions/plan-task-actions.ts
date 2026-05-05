'use server';

import type { TaskPriority } from '@prisma/client';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';

import { paths } from 'src/routes/paths';

import { prisma } from 'src/lib/prisma';
import { requireUser } from 'src/lib/auth-helpers';

// ----------------------------------------------------------------------

const addTaskSchema = z.object({
  title: z.string().trim().min(1, 'Vui lòng nhập tên việc').max(200),
  priority: z.enum(['do_first', 'schedule', 'delegate', 'eliminate']),
});

const updateTaskSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  priority: z.enum(['do_first', 'schedule', 'delegate', 'eliminate']).optional(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
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
  input: { title: string; priority: TaskPriority }
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
  patch: { title?: string; priority?: TaskPriority; dueDate?: string | null }
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
