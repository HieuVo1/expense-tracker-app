'use server';

import type { Prisma } from '@prisma/client';
import type { AboutMeRow, AboutMeType } from '../types';

import dayjs from 'dayjs';
import { revalidatePath } from 'next/cache';

import { paths } from 'src/routes/paths';

import { prisma } from 'src/lib/prisma';
import { requireUser } from 'src/lib/auth-helpers';
import { signNoteImages, deleteNoteImages } from 'src/lib/storage/note-images-server';

import { ABOUT_ME_TYPE_VALUES } from '../constants/about-me-types';
import { aboutMeFormSchema, aboutMeUpdateSchema } from '../schemas';

// ----------------------------------------------------------------------

// NoteType now only has 'daily' plus the 7 UPPERCASE About-me types.
// The 4 old lowercase variants (insight/strength/weakness/idea) were
// migrated to their UPPERCASE equivalents in migration 20260510084453.
type NoteTypeUnion = 'GOAL' | 'THOUGHT' | 'LESSON' | 'SIGNAL' | 'PRINCIPLE' | 'TRAIT' | 'ACTION' | 'daily';

function mapRow(
  r: {
    id: string;
    type: NoteTypeUnion;
    title: string;
    content: string;
    tags: string[];
    images: string[];
    metadata: unknown;
    createdAt: Date;
    updatedAt: Date;
  },
  urlMap: Map<string, string>
): AboutMeRow {
  return {
    id: r.id,
    type: r.type as AboutMeType,
    title: r.title,
    content: r.content,
    tags: r.tags,
    images: r.images,
    imageUrls: r.images.map((p) => urlMap.get(p) ?? ''),
    metadata:
      r.metadata !== null && typeof r.metadata === 'object'
        ? (r.metadata as Record<string, unknown>)
        : null,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

function revalidateAboutMe(type?: AboutMeType): void {
  revalidatePath(paths.dashboard.aboutMe);
  if (type) revalidatePath(paths.dashboard.aboutMeType(type));
}

// Auto-generate title for free-text types when caller omits it.
function resolveTitle(type: AboutMeType, title?: string): string {
  if (title && title.trim().length > 0) return title.trim();
  const prefix = dayjs().format('DD/MM/YYYY');
  const labelMap: Record<AboutMeType, string> = {
    GOAL: 'Mục tiêu',
    THOUGHT: 'Suy nghĩ',
    LESSON: 'Bài học',
    SIGNAL: 'Tín hiệu',
    PRINCIPLE: 'Tiêu chuẩn',
    TRAIT: 'Đặc điểm',
    ACTION: 'Hành động',
  };
  return `${labelMap[type]} — ${prefix}`;
}

// Dedup tags while preserving first-seen order.
function normalizeTags(tags: string[]): string[] {
  return Array.from(new Set(tags));
}

// ----------------------------------------------------------------------

export async function listAboutMe(type?: AboutMeType): Promise<AboutMeRow[]> {
  const user = await requireUser();

  const rows = await prisma.note.findMany({
    where: {
      userId: user.id,
      // Scope strictly to about-me UPPERCASE types — prevents Notes module rows
      // (lowercase types) from leaking into about-me views.
      type: type
        ? { equals: type }
        : { in: ABOUT_ME_TYPE_VALUES as NoteTypeUnion[] },
    },
    orderBy: { updatedAt: 'desc' },
  });

  const urlMap = await signNoteImages(rows.flatMap((r) => r.images));
  return rows.map((r) => mapRow(r, urlMap));
}

export async function getAboutMe(id: string): Promise<AboutMeRow | null> {
  const user = await requireUser();

  const row = await prisma.note.findFirst({
    where: {
      id,
      userId: user.id,
      type: { in: ABOUT_ME_TYPE_VALUES as NoteTypeUnion[] },
    },
  });

  if (!row) return null;
  const urlMap = await signNoteImages(row.images);
  return mapRow(row, urlMap);
}

export async function createAboutMe(
  input: Parameters<typeof aboutMeFormSchema.parse>[0]
): Promise<AboutMeRow> {
  const user = await requireUser();
  const data = aboutMeFormSchema.parse(input);

  const row = await prisma.note.create({
    data: {
      userId: user.id,
      type: data.type,
      title: resolveTitle(data.type, data.title),
      content: data.content ?? '',
      tags: normalizeTags(data.tags ?? []),
      images: data.images ?? [],
      metadata: data.metadata as Prisma.InputJsonValue,
    },
  });

  revalidateAboutMe(data.type);
  const urlMap = await signNoteImages(row.images);
  return mapRow(row, urlMap);
}

export async function updateAboutMe(
  input: Parameters<typeof aboutMeUpdateSchema.parse>[0]
): Promise<AboutMeRow> {
  const user = await requireUser();
  const data = aboutMeUpdateSchema.parse(input);

  // Verify ownership AND that the target row is an about-me type before updating.
  // Without this guard, a caller passing a Notes-module row id (lowercase types)
  // could rewrite that row's type/content via the about-me API → cross-module corruption.
  const existing = await prisma.note.findFirst({
    where: {
      id: data.id,
      userId: user.id,
      type: { in: ABOUT_ME_TYPE_VALUES as NoteTypeUnion[] },
    },
    select: { id: true, images: true },
  });

  if (!existing) {
    throw new Error(`About-me row ${data.id} not found, not owned, or not an about-me type`);
  }

  const nextImages = data.images ?? [];
  const row = await prisma.note.update({
    where: {
      id: data.id,
      userId: user.id,
    },
    data: {
      type: data.type,
      title: resolveTitle(data.type, data.title),
      content: data.content ?? '',
      tags: normalizeTags(data.tags ?? []),
      images: nextImages,
      metadata: data.metadata as Prisma.InputJsonValue,
    },
  });

  // Purge images the user removed in this edit (orphan cleanup).
  await deleteNoteImages(existing.images.filter((p) => !nextImages.includes(p)));

  revalidateAboutMe(data.type);
  const urlMap = await signNoteImages(row.images);
  return mapRow(row, urlMap);
}

export async function deleteAboutMe(id: string): Promise<void> {
  const user = await requireUser();

  const row = await prisma.note.findFirst({
    where: {
      id,
      userId: user.id,
      type: { in: ABOUT_ME_TYPE_VALUES as NoteTypeUnion[] },
    },
    select: { type: true, images: true },
  });

  if (!row) return; // already deleted or not owned

  await prisma.note.delete({ where: { id, userId: user.id } });

  // Remove the row's images from Storage so nothing is left orphaned.
  await deleteNoteImages(row.images);

  revalidateAboutMe(row.type as AboutMeType);
}
