// Bible source provider abstraction — lets us swap bible.com / Gemini / future
// static-JSON dataset behind a single interface. v1 ships bible.com primary +
// Gemini fallback; adding a static JSON later is a new file + switch arm.

export type BibleSourceName = 'bible-com' | 'gemini';

export const DEFAULT_VERSION = 'VIE2010';

// VIE2010 = "Kinh Thánh Tiếng Việt — Bản Hiệu Đính 2010" on YouVersion (Bible ID 151)
export const VIE2010_BIBLE_ID = 151;

export type VerseRef = {
  /** USFM code: GEN, EXO, MAT, 1CO, 2PE, REV, etc. (66 books) */
  bookCode: string;
  /** Vietnamese display name, e.g. "Ma-thi-ơ", "1 Cô-rinh-tô" */
  bookName: string;
  chapter: number;
  startVerse: number;
  /** Defaults to startVerse for single-verse refs. */
  endVerse?: number;
  /** Defaults to DEFAULT_VERSION. */
  version?: string;
};

export type VerseFetchOk = {
  ok: true;
  /** Plain Vietnamese text, verses joined by single space, footnotes stripped. */
  text: string;
  source: BibleSourceName;
};

export type VerseFetchFail = {
  ok: false;
  error: string;
  source: BibleSourceName;
};

export type VerseFetchResult = VerseFetchOk | VerseFetchFail;

export interface BibleSourceProvider {
  readonly name: BibleSourceName;
  /**
   * Fetch verse text for a single range. Implementation may cache chapter-level
   * fetches internally; cross-call caching is the caller's job (see cache.ts).
   */
  fetchVerse(ref: VerseRef): Promise<VerseFetchResult>;
}

/**
 * Normalize a ref so endVerse always equals or exceeds startVerse and version
 * is set. Returned object is the same shape callers pass in.
 */
export function normalizeRef(ref: VerseRef): Required<VerseRef> {
  const endVerse = Math.max(ref.endVerse ?? ref.startVerse, ref.startVerse);
  return {
    bookCode: ref.bookCode,
    bookName: ref.bookName,
    chapter: ref.chapter,
    startVerse: ref.startVerse,
    endVerse,
    version: ref.version ?? DEFAULT_VERSION,
  };
}

/**
 * Build a YouVersion (bible.com) URL that opens directly on the given verse
 * range, in the Vietnamese 2010 translation. Pattern matches what the chapter
 * fetcher uses but with a verse anchor: `{BOOK}.{CH}.{START}[-{END}].{VERSION}`.
 */
export function youVersionUrl(args: {
  bookCode: string;
  chapter: number;
  startVerse: number;
  endVerse?: number;
  version?: string;
}): string {
  const version = args.version ?? DEFAULT_VERSION;
  const range =
    args.endVerse && args.endVerse !== args.startVerse
      ? `${args.startVerse}-${args.endVerse}`
      : `${args.startVerse}`;
  return `https://www.bible.com/vi/bible/${VIE2010_BIBLE_ID}/${args.bookCode}.${args.chapter}.${range}.${version}`;
}
