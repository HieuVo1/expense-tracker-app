import type { LookupResult } from './book-map';

import { lookupBook } from './book-map';

// Parse a single Bible reference line (with leading dash already stripped) into
// a structured ref. Handles:
//   "Ma-thi-ơ 6:33"            → MAT 6:33-33
//   "1 Cô-rinh-tô 10:13"       → 1CO 10:13-13
//   "Hê-bơ-rơ 4:12-13"         → HEB 4:12-13
//   "Mat 6:27-34"              → MAT 6:27-34
//   "Cô-rinh-tô 4:16"          → ambiguous (1CO vs 2CO)
//   "Foo 1:1"                  → unknown
//
// Out-of-spec input (no colon, malformed numbers, etc.) → { ok:false, reason }.

export type ParsedRefOk = {
  ok: true;
  bookCode: string;
  bookName: string;
  chapter: number;
  startVerse: number;
  endVerse: number;
  raw: string;
};

export type ParsedRefAmbiguous = {
  ok: false;
  reason: 'ambiguous';
  raw: string;
  bookName: string;
  candidates: string[];
  chapter: number;
  startVerse: number;
  endVerse: number;
};

export type ParsedRefUnknown = {
  ok: false;
  reason: 'unknown_book';
  raw: string;
  bookName: string;
  chapter: number;
  startVerse: number;
  endVerse: number;
};

export type ParsedRefMalformed = {
  ok: false;
  reason: 'malformed';
  raw: string;
};

export type ParsedRef =
  | ParsedRefOk
  | ParsedRefAmbiguous
  | ParsedRefUnknown
  | ParsedRefMalformed;

// Pattern: <book name (letters, digits, spaces, dashes, dots)> <chapter>:<v[-v]>
// Capture groups: 1 = book, 2 = chapter, 3 = startVerse, 4 = endVerse (optional)
const REF_RE =
  /^([\p{L}\d][\p{L}\d\s\-.]*?)\s+(\d+)\s*:\s*(\d+)(?:\s*[-–—]\s*(\d+))?$/u;

export function parseReference(line: string): ParsedRef {
  const trimmed = line.trim();
  const m = REF_RE.exec(trimmed);
  if (!m) return { ok: false, reason: 'malformed', raw: trimmed };

  const [, bookRaw, chStr, startStr, endStr] = m;
  const chapter = Number(chStr);
  const startVerse = Number(startStr);
  const endVerse = endStr ? Number(endStr) : startVerse;

  if (!Number.isFinite(chapter) || chapter < 1 || !Number.isFinite(startVerse) || startVerse < 1) {
    return { ok: false, reason: 'malformed', raw: trimmed };
  }
  if (endVerse < startVerse) {
    return { ok: false, reason: 'malformed', raw: trimmed };
  }

  const lookup: LookupResult = lookupBook(bookRaw);
  if (lookup.match === 'unknown') {
    return { ok: false, reason: 'unknown_book', raw: trimmed, bookName: bookRaw, chapter, startVerse, endVerse };
  }
  if (lookup.match === 'ambiguous') {
    return {
      ok: false,
      reason: 'ambiguous',
      raw: trimmed,
      bookName: bookRaw,
      candidates: lookup.codes,
      chapter,
      startVerse,
      endVerse,
    };
  }

  return {
    ok: true,
    bookCode: lookup.code,
    bookName: lookup.vn,
    chapter,
    startVerse,
    endVerse,
    raw: trimmed,
  };
}

/**
 * Parse a list of reference lines (one per line) and return all results.
 * Lines starting with `-` or `*` have the bullet stripped; empty lines skipped.
 */
export function parseReferences(lines: string[]): ParsedRef[] {
  const results: ParsedRef[] = [];
  for (const line of lines) {
    const cleaned = line.replace(/^\s*[-*+]\s+/, '').trim();
    if (!cleaned) continue;
    results.push(parseReference(cleaned));
  }
  return results;
}

/**
 * Dedupe successfully parsed refs by (bookCode, chapter, startVerse, endVerse).
 * Useful before kicking off network fetches — the same verse may be listed
 * twice in section 2.
 */
export function dedupeRefs<T extends { ok: boolean }>(refs: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const r of refs) {
    if (!r.ok) {
      out.push(r);
      continue;
    }
    // We know it's the ok shape because of the discriminant
    const k = JSON.stringify(r);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(r);
  }
  return out;
}
