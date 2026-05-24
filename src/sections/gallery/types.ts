import type { NoteType } from '@prisma/client';

// ----------------------------------------------------------------------

export type GalleryGroup = 'daily' | 'aboutme';

// One attached image, flattened from its source note for the gallery grid.
export type GalleryImage = {
  /** Storage path — stable unique key. */
  path: string;
  /** Signed display URL (time-limited). */
  url: string;
  noteId: string;
  noteType: NoteType;
  noteTitle: string;
  group: GalleryGroup;
  updatedAt: string; // ISO string
};
