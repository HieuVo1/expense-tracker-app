import type { BibleSourceName, BibleSourceProvider } from './types';

import { bibleComProvider } from './bible-com';
import { geminiBibleProvider } from './gemini';

// BIBLE_SOURCE env switch:
//   - "auto"       → bible-com primary, gemini fallback (default)
//   - "bible-com"  → bible-com only (no fallback)
//   - "gemini"     → gemini only
//
// Order matters — providers are tried left-to-right until one returns ok.
export function getBibleProviders(): BibleSourceProvider[] {
  const choice = (process.env.BIBLE_SOURCE ?? 'auto') as BibleSourceName | 'auto';
  switch (choice) {
    case 'bible-com':
      return [bibleComProvider];
    case 'gemini':
      return [geminiBibleProvider];
    case 'auto':
    default:
      return [bibleComProvider, geminiBibleProvider];
  }
}

export { getOrFetchVerse, createAmbiguousVerse } from './cache';
export { normalizeRef, youVersionUrl, DEFAULT_VERSION, VIE2010_BIBLE_ID } from './types';
export type {
  VerseRef,
  VerseFetchOk,
  VerseFetchFail,
  BibleSourceName,
  VerseFetchResult,
  BibleSourceProvider,
} from './types';
