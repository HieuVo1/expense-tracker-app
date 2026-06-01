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

// Search result types — used by searchBible action + search UI (phase 04/05).

export type LessonHit = {
  id: string;
  title: string;
  date: string;          // YYYY-MM-DD
  snippet: string;       // ≤80 chars of surrounding context, plain text
  matchField: 'title' | 'content';
};

export type VerseHit = {
  verseId: string;
  bookCode: string;
  bookName: string;
  chapter: number;
  startVerse: number;
  endVerse: number;
  refLabel: string;      // synthesized, e.g. "Ê-sai 14:12-15"
  snippet: string;       // ≤80 chars from text
  matchField: 'text' | 'ref';
};

export type SearchResult = {
  q: string;
  lessons: LessonHit[];
  verses: VerseHit[];
  truncated: { lessons: boolean; verses: boolean };
};

// Challenge flashcard mode — one row per BibleVerseTheme link.
// verseThemeId is the composite key serialised as "${verseId}:${themeId}" for
// client convenience (split on first ":" to recover individual IDs).
export type ChallengeCardRow = {
  verseThemeId: string;         // `${verseId}:${themeId}`
  verseId: string;
  themeId: string;
  themeName: string;
  themeColor: string;
  promptOverride: string | null; // null → UI falls back to themeName
  bookCode: string;
  bookName: string;
  chapter: number;
  startVerse: number;
  endVerse: number;
  text: string;
  addedAt: string;               // ISO date-time
};
