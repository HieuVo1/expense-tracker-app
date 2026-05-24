'use server';

import type { GalleryImage } from '../types';

import { prisma } from 'src/lib/prisma';
import { requireUser } from 'src/lib/auth-helpers';
import { signNoteImages } from 'src/lib/storage/note-images-server';

// ----------------------------------------------------------------------

// All images the user attached to any note (About-me + daily journal),
// flattened newest-note-first into a single list for the gallery grid.
export async function listGalleryImages(): Promise<GalleryImage[]> {
  const user = await requireUser();

  const rows = await prisma.note.findMany({
    where: { userId: user.id, images: { isEmpty: false } },
    orderBy: { updatedAt: 'desc' },
    select: { id: true, type: true, title: true, images: true, updatedAt: true },
  });

  const urlMap = await signNoteImages(rows.flatMap((r) => r.images));

  const items: GalleryImage[] = [];
  for (const r of rows) {
    for (const path of r.images) {
      const url = urlMap.get(path);
      if (!url) continue; // skip if signing failed / file missing
      items.push({
        path,
        url,
        noteId: r.id,
        noteType: r.type,
        noteTitle: r.title,
        group: r.type === 'daily' ? 'daily' : 'aboutme',
        updatedAt: r.updatedAt.toISOString(),
      });
    }
  }

  return items;
}
