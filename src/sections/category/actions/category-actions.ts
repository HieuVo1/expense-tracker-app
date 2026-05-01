'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';

import { prisma } from 'src/lib/prisma';
import { paths } from 'src/routes/paths';
import { requireUser } from 'src/lib/auth-helpers';

const renameSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, 'Tên không được trống').max(50, 'Tên tối đa 50 ký tự'),
});

export async function listCategories() {
  const user = await requireUser();
  return prisma.category.findMany({
    where: { userId: user.id },
    orderBy: { order: 'asc' },
  });
}

export async function renameCategory(input: { id: string; name: string }) {
  const user = await requireUser();
  const parsed = renameSchema.parse(input);

  // RLS on Postgres also enforces ownership; the where clause here is defense in depth.
  await prisma.category.update({
    where: { id: parsed.id, userId: user.id },
    data: { name: parsed.name.trim() },
  });

  revalidatePath(paths.dashboard.categories);
}
