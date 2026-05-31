import type { ParsedRef } from './lib/reference-parser';
import type { ParsedLesson } from './lib/lesson-markdown';

// Public types used across actions + views. The internal-only parser types
// (ParsedRef, ParsedLesson) are re-exported so view code doesn't have to dig
// into ./lib paths.

export type { ParsedRef, ParsedLesson };

export type ImportResult =
  | {
      ok: true;
      lessonId: string;
      verseCount: number;
      ambiguousCount: number;
      unknownCount: number;
      malformedCount: number;
    }
  | { ok: false; error: string };

export type LessonListItem = {
  id: string;
  title: string;
  date: string;          // YYYY-MM-DD
  verseCount: number;
  ambiguousCount: number;
  createdAt: string;
};

export type LessonVerseRow = {
  verseId: string;
  bookCode: string;
  bookName: string;
  chapter: number;
  startVerse: number;
  endVerse: number;
  text: string;
  fetchStatus: 'ok' | 'failed' | 'ambiguous';
  order: number;
  themes: { id: string; name: string; color: string }[];
};

export type LessonSectionKey = 'notes' | 'lessons' | 'exercises' | 'questions';

export type LessonDetail = {
  id: string;
  title: string;
  date: string;          // YYYY-MM-DD
  sourceFilename: string | null;
  bibleVersion: string;
  rawMarkdown: string;
  /** Parsed section bodies — source of truth for the detail page (rawMarkdown
   *  is the original import snapshot and may diverge if the user edits). */
  sections: Record<LessonSectionKey, string>;
  verses: LessonVerseRow[];
  createdAt: string;
  updatedAt: string;
};

export type ThemeRow = {
  id: string;
  name: string;
  color: string;
  description: string | null;
  order: number;
  verseCount: number;
};

export type ThemeVerseRow = {
  verseId: string;
  bookCode: string;
  bookName: string;
  chapter: number;
  startVerse: number;
  endVerse: number;
  text: string;
  addedAt: string;
};

export type ReviewQuality = 0 | 1 | 2 | 3; // 0=Quên, 1=Khó, 2=OK, 3=Dễ

export type ReviewCardRow = {
  verseId: string;
  bookCode: string;
  bookName: string;
  chapter: number;
  startVerse: number;
  endVerse: number;
  text: string;
  nextReviewDate: string; // YYYY-MM-DD
  easiness: number;
  interval: number;
  repetitions: number;
};
