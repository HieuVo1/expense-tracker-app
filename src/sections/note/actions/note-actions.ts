'use server';

import type { NoteRow } from '../types';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';

import { paths } from 'src/routes/paths';

import { prisma } from 'src/lib/prisma';
import { requireUser } from 'src/lib/auth-helpers';

import { NOTE_TYPE_VALUES } from '../constants/note-types';

// ----------------------------------------------------------------------

const tagSchema = z
  .string()
  .trim()
  .min(1)
  .max(32)
  .transform((s) => s.toLowerCase());

const noteSchema = z.object({
  type: z.enum(NOTE_TYPE_VALUES as [string, ...string[]]),
  title: z.string().trim().min(1).max(120),
  content: z.string().trim().min(1).max(10000),
  tags: z.array(tagSchema).max(12).default([]),
});

const updateSchema = noteSchema.extend({ id: z.string().min(1) });

// Dedup tags while preserving first-seen order.
function normalizeTags(tags: string[]): string[] {
  return Array.from(new Set(tags));
}

// ----------------------------------------------------------------------

export async function listNotes(): Promise<NoteRow[]> {
  const user = await requireUser();

  const rows = await prisma.note.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: 'desc' },
  });

  return rows.map((r) => ({
    id: r.id,
    type: r.type,
    title: r.title,
    content: r.content,
    tags: r.tags,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));
}

export async function createNote(input: z.infer<typeof noteSchema>): Promise<void> {
  const user = await requireUser();
  const data = noteSchema.parse(input);

  await prisma.note.create({
    data: {
      userId: user.id,
      type: data.type as 'daily' | 'insight' | 'strength' | 'weakness' | 'idea',
      title: data.title,
      content: data.content,
      tags: normalizeTags(data.tags),
    },
  });

  revalidatePath(paths.dashboard.notes);
}

export async function updateNote(input: z.infer<typeof updateSchema>): Promise<void> {
  const user = await requireUser();
  const data = updateSchema.parse(input);

  await prisma.note.update({
    where: { id: data.id, userId: user.id },
    data: {
      type: data.type as 'daily' | 'insight' | 'strength' | 'weakness' | 'idea',
      title: data.title,
      content: data.content,
      tags: normalizeTags(data.tags),
    },
  });

  revalidatePath(paths.dashboard.notes);
}

export async function deleteNote(id: string): Promise<void> {
  const user = await requireUser();

  await prisma.note.delete({
    where: { id, userId: user.id },
  });

  revalidatePath(paths.dashboard.notes);
}
