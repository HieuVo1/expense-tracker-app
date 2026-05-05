'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';

import { paths } from 'src/routes/paths';

import { prisma } from 'src/lib/prisma';
import { requireUser } from 'src/lib/auth-helpers';

const nameSchema = z.string().min(1, 'Tên không được trống').max(50, 'Tên tối đa 50 ký tự');
const iconSchema = z.string().min(1, 'Chưa chọn icon').max(80);
const colorSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Mã màu không hợp lệ');

const createSchema = z.object({
  name: nameSchema,
  icon: iconSchema,
  color: colorSchema,
  type: z.enum(['expense', 'income']),
});

const updateSchema = z.object({
  id: z.string().min(1),
  name: nameSchema,
  icon: iconSchema,
  color: colorSchema,
});

export async function listCategories() {
  const user = await requireUser();
  return prisma.category.findMany({
    where: { userId: user.id },
    orderBy: [{ type: 'asc' }, { order: 'asc' }],
  });
}

export async function createCategory(input: z.infer<typeof createSchema>) {
  const user = await requireUser();
  const data = createSchema.parse(input);

  // Append to the end of the relevant type's order range so user-created
  // categories sit after the seeded defaults.
  const last = await prisma.category.findFirst({
    where: { userId: user.id, type: data.type },
    orderBy: { order: 'desc' },
    select: { order: true },
  });

  await prisma.category.create({
    data: {
      userId: user.id,
      name: data.name.trim(),
      icon: data.icon,
      color: data.color,
      type: data.type,
      order: (last?.order ?? -1) + 1,
    },
  });

  revalidatePath(paths.dashboard.categories);
}

export async function updateCategory(input: z.infer<typeof updateSchema>) {
  const user = await requireUser();
  const data = updateSchema.parse(input);

  // RLS on Postgres also enforces ownership; the where clause here is defense in depth.
  await prisma.category.update({
    where: { id: data.id, userId: user.id },
    data: {
      name: data.name.trim(),
      icon: data.icon,
      color: data.color,
    },
  });

  revalidatePath(paths.dashboard.categories);
}

export async function reorderCategories(orderedIds: string[]) {
  const user = await requireUser();

  // Verify every id belongs to the user before issuing writes — guards against
  // a malicious client passing ids from another account.
  const owned = await prisma.category.findMany({
    where: { id: { in: orderedIds }, userId: user.id },
    select: { id: true },
  });
  if (owned.length !== orderedIds.length) {
    throw new Error('Danh mục không hợp lệ');
  }

  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.category.update({
        where: { id, userId: user.id },
        data: { order: index },
      })
    )
  );

  revalidatePath(paths.dashboard.categories);
}

export async function deleteCategory(id: string) {
  const user = await requireUser();

  // Block deletion when transactions or budgets reference the category.
  // Prevents orphaned rows and keeps reporting honest — user must reassign
  // first via the edit dialog on each transaction (or rename if they want
  // to repurpose the bucket).
  const [txCount, budgetCount] = await Promise.all([
    prisma.transaction.count({ where: { userId: user.id, categoryId: id } }),
    prisma.budget.count({ where: { userId: user.id, categoryId: id } }),
  ]);

  if (txCount > 0) {
    throw new Error(
      `Đang có ${txCount} giao dịch dùng danh mục này. Hãy đổi danh mục cho các giao dịch trước khi xoá.`
    );
  }
  if (budgetCount > 0) {
    throw new Error('Đang có ngân sách gắn với danh mục này. Hãy xoá ngân sách trước.');
  }

  await prisma.category.delete({ where: { id, userId: user.id } });

  revalidatePath(paths.dashboard.categories);
}
