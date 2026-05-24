import type { NoteType } from '@prisma/client';

// ----------------------------------------------------------------------

export type NoteRow = {
  id: string;
  type: NoteType;
  title: string;
  content: string;
  tags: string[];
  /** Canonical Storage paths ("<uid>/<uuid>.<ext>") — persisted on the row. */
  images: string[];
  /** Signed display URLs for `images` (same order, generated on read). */
  imageUrls: string[];
  createdAt: string; // ISO string — Date serialized for client
  updatedAt: string; // ISO string — Date serialized for client
};
