import type { VerseRef, VerseFetchResult, BibleSourceProvider } from './types';

import { normalizeRef, VIE2010_BIBLE_ID } from './types';

// bible.com YouVersion chapter scrape — proven via spike on MAT 6 (see plan
// research). Page ships __NEXT_DATA__ JSON with chapterInfo.content (HTML
// listing all verses), which is more stable than DOM class names.

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/120.0 Safari/537.36';

const FETCH_TIMEOUT_MS = 8_000;

// Per-process LRU on chapter content — same chapter requested multiple times
// in one import (e.g. MAT 6:1-4 + MAT 6:9-13) hits cache. Keyed by
// `{version}/{bookCode}.{chapter}`; cap 32 entries to bound memory.
const chapterCache = new Map<string, string>();
const CACHE_CAP = 32;

function chapterUrl(bookCode: string, chapter: number, version: string): string {
  // Path used by the spike. `vi` locale ensures Vietnamese metadata.
  return `https://www.bible.com/vi/bible/${VIE2010_BIBLE_ID}/${bookCode}.${chapter}.${version}`;
}

async function fetchChapterHtml(url: string): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT, Accept: 'text/html' },
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`bible.com HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

// Extract the __NEXT_DATA__ JSON blob and return chapterInfo.content (HTML
// string with each verse wrapped in <span class="verse v{N}" data-usfm="...">).
function extractChapterContent(html: string): string {
  const m = html.match(
    /<script id="__NEXT_DATA__" type="application\/json">([^<]+)<\/script>/
  );
  if (!m) throw new Error('bible.com: __NEXT_DATA__ not found');
  const data = JSON.parse(m[1]) as {
    props?: { pageProps?: { chapterInfo?: { content?: string } } };
  };
  const content = data.props?.pageProps?.chapterInfo?.content;
  if (!content) throw new Error('bible.com: chapterInfo.content missing');
  return content;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCharCode(Number(n)))
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ');
}

// Walk each `<span class="verse v{N}" ...>...</span>` block and keep ONLY the
// inner `<span class="content">...</span>` text. Footnotes / labels / cross-
// refs use other classes and are dropped, giving a clean Bible text string.
//
// Poetic verses (e.g. Ê-sai 5:20, the Psalms) get split into MULTIPLE
// `<span class="verse vN" data-usfm="...">` fragments — one per poem line,
// each in its own <div class="q1">. They all share the same verse number, so
// we concatenate fragments in document order rather than overwrite. RegExp.exec
// is sequential so document order is preserved.
function parseVerses(chapterHtml: string): Map<number, string> {
  const verses = new Map<number, string>();
  const verseRe =
    /<span class="verse v(\d+)"[^>]*data-usfm="[^"]+"[^>]*>([\s\S]*?)(?=<span class="verse v\d+"|<\/div>)/g;
  const contentRe = /<span class="content">([\s\S]*?)<\/span>/g;

  let vm: RegExpExecArray | null;
  while ((vm = verseRe.exec(chapterHtml)) !== null) {
    const num = Number(vm[1]);
    const inner = vm[2];
    const parts: string[] = [];
    contentRe.lastIndex = 0;
    let cm: RegExpExecArray | null;
    while ((cm = contentRe.exec(inner)) !== null) {
      const raw = cm[1].replace(/<[^>]+>/g, '');
      parts.push(decodeEntities(raw));
    }
    const joined = parts.join('').replace(/\s+/g, ' ').trim();
    if (!joined) continue;
    const existing = verses.get(num);
    verses.set(num, existing ? `${existing} ${joined}` : joined);
  }
  return verses;
}

async function getChapterVerses(
  bookCode: string,
  chapter: number,
  version: string
): Promise<Map<number, string>> {
  const key = `${version}/${bookCode}.${chapter}`;
  const cached = chapterCache.get(key);
  if (cached) return parseVerses(cached);

  const html = await fetchChapterHtml(chapterUrl(bookCode, chapter, version));
  const content = extractChapterContent(html);

  // Bound LRU: drop oldest entry when at cap.
  if (chapterCache.size >= CACHE_CAP) {
    const firstKey = chapterCache.keys().next().value;
    if (firstKey !== undefined) chapterCache.delete(firstKey);
  }
  chapterCache.set(key, content);

  return parseVerses(content);
}

export const bibleComProvider: BibleSourceProvider = {
  name: 'bible-com',

  async fetchVerse(ref: VerseRef): Promise<VerseFetchResult> {
    const { bookCode, chapter, startVerse, endVerse, version } = normalizeRef(ref);
    try {
      const verses = await getChapterVerses(bookCode, chapter, version);
      const collected: string[] = [];
      for (let n = startVerse; n <= endVerse; n += 1) {
        const v = verses.get(n);
        if (v) collected.push(v);
      }
      if (collected.length === 0) {
        return {
          ok: false,
          error: `bible.com: verses ${startVerse}-${endVerse} not found in ${bookCode}.${chapter}`,
          source: 'bible-com',
        };
      }
      return { ok: true, text: collected.join(' '), source: 'bible-com' };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { ok: false, error: msg, source: 'bible-com' };
    }
  },
};
