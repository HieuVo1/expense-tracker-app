import type { NoteType } from '@prisma/client';

// ----------------------------------------------------------------------

export type NoteRow = {
  id: string;
  type: NoteType;
  title: string;
  content: string;
  tags: string[];
  createdAt: string; // ISO string — Date serialized for client
  updatedAt: string; // ISO string — Date serialized for client
};
