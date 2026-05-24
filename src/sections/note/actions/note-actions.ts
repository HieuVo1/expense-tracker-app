'use server';

import type { NoteRow } from '../types';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';

import { paths } from 'src/routes/paths';

import { prisma } from 'src/lib/prisma';
import { requireUser } from 'src/lib/auth-helpers';
import { NOTE_IMAGE_MAX } from 'src/lib/storage/note-images';
import { signNoteImages, deleteNoteImages } from 'src/lib/storage/note-images-server';

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
  images: z.array(z.string().trim().min(1).max(300)).max(NOTE_IMAGE_MAX).default([]),
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
    where: {
      userId: user.id,
      // Scope strictly to old Notes module types — prevents about-me UPPERCASE rows
      // (GOAL/THOUGHT/LESSON/SIGNAL/PRINCIPLE/TRAIT/ACTION) from leaking into Notes UI.
      // NOTE_TYPE_LABELS/COLORS/ICONS are narrowed to OldNoteType only, so UPPERCASE
      // entries would produce undefined lookups and crash MUI icon renders.
      type: { in: NOTE_TYPE_VALUES },
    },
    orderBy: { updatedAt: 'desc' },
  });

  const urlMap = await signNoteImages(rows.flatMap((r) => r.images));

  return rows.map((r) => ({
    id: r.id,
    type: r.type,
    title: r.title,
    content: r.content,
    tags: r.tags,
    images: r.images,
    imageUrls: r.images.map((p) => urlMap.get(p) ?? ''),
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
      type: data.type as 'daily',
      title: data.title,
      content: data.content,
      tags: normalizeTags(data.tags),
      images: data.images,
    },
  });

  revalidatePath(paths.dashboard.notes);
}

export async function updateNote(input: z.infer<typeof updateSchema>): Promise<void> {
  const user = await requireUser();
  const data = updateSchema.parse(input);

  // Fetch old images (scoped to a daily note the user owns) to purge orphans.
  const existing = await prisma.note.findFirst({
    where: { id: data.id, userId: user.id, type: { in: NOTE_TYPE_VALUES } },
    select: { images: true },
  });

  await prisma.note.update({
    where: { id: data.id, userId: user.id },
    data: {
      type: data.type as 'daily',
      title: data.title,
      content: data.content,
      tags: normalizeTags(data.tags),
      images: data.images,
    },
  });

  if (existing) {
    await deleteNoteImages(existing.images.filter((p) => !data.images.includes(p)));
  }

  revalidatePath(paths.dashboard.notes);
}

export async function deleteNote(id: string): Promise<void> {
  const user = await requireUser();

  const existing = await prisma.note.findFirst({
    where: { id, userId: user.id, type: { in: NOTE_TYPE_VALUES } },
    select: { images: true },
  });

  await prisma.note.delete({
    where: { id, userId: user.id },
  });

  if (existing) await deleteNoteImages(existing.images);

  revalidatePath(paths.dashboard.notes);
}
