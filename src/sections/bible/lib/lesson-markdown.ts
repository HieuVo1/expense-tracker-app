import type { ParsedRef } from './reference-parser';

import { dedupeRefs, parseReferences } from './reference-parser';

// Parse a "bible-lesson-v1" Obsidian markdown file. The template is:
//   ---
//   template: "bible-lesson-v1"
//   title: "..."
//   date: "YYYY-MM-DD"
//   source: "..."
//   bible_version: "VIE2010"
//   tags: [...]
//   ---
//   # DD-MM-YYYY - Tên bài học
//   ## 1. Ghi chú bài học
//   ## 2. Câu kinh trong bài
//   - Ê-sai 14:12-15
//   ## 3. Bài học rút ra
//   ## 4. Bài tập
//   ## 5. Câu hỏi muốn hỏi giáo viên
//
// Only section 2 is scanned for verse refs (per user decision — avoid false
// positives from prose). Sections are stored in parsedSections for the UI.

export type LessonFrontmatter = {
  template?: string;
  title?: string;
  date?: string;          // YYYY-MM-DD
  source?: string;
  bibleVersion?: string;
  tags?: string[];
};

export type ParsedSections = {
  notes: string;       // section 1 body
  versesRaw: string[]; // raw lines (with bullets) from section 2
  lessons: string;     // section 3
  exercises: string;   // section 4
  questions: string;   // section 5
};

export type ParsedLesson = {
  frontmatter: LessonFrontmatter;
  /** H1 line text (without the leading #). */
  title: string;
  sections: ParsedSections;
  /** Parsed (and deduped) refs extracted from section 2. */
  refs: ParsedRef[];
};

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

// Tiny YAML subset — handles the 6 keys our template uses. Keys with no nested
// structure (string/list), nothing else. Robust enough; no extra dep needed.
function parseFrontmatter(raw: string): LessonFrontmatter {
  const fm: LessonFrontmatter = {};
  let currentList: string[] | null = null;
  let currentListKey: keyof LessonFrontmatter | null = null;

  for (const lineRaw of raw.split(/\r?\n/)) {
    const line = lineRaw.replace(/\s+$/, '');
    if (!line.trim()) {
      currentList = null;
      currentListKey = null;
      continue;
    }
    // Indented list item under previous key
    if (/^\s+-\s+/.test(line) && currentList) {
      const val = line.replace(/^\s+-\s+/, '').replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1');
      currentList.push(val);
      continue;
    }
    // key: value or key:
    const kv = /^([a-zA-Z_]+):\s*(.*)$/.exec(line);
    if (!kv) continue;
    const [, key, rest] = kv;
    const value = rest.replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1');
    switch (key) {
      case 'template':
        fm.template = value;
        break;
      case 'title':
        fm.title = value;
        break;
      case 'date':
        fm.date = value;
        break;
      case 'source':
        fm.source = value;
        break;
      case 'bible_version':
        fm.bibleVersion = value;
        break;
      case 'tags':
        if (value) {
          // Inline list: tags: [a, b]
          if (value.startsWith('[') && value.endsWith(']')) {
            fm.tags = value
              .slice(1, -1)
              .split(',')
              .map((s) => s.trim().replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1'))
              .filter(Boolean);
          } else {
            fm.tags = [value];
          }
        } else {
          fm.tags = [];
          currentList = fm.tags;
          currentListKey = 'tags';
        }
        break;
      default:
        break;
    }
    if (key !== 'tags') {
      currentList = null;
      currentListKey = null;
    }
  }
  // Drop unused var lint
  void currentListKey;
  return fm;
}

// Split body into sections keyed by their H2 header text. Header format is
// `## N. Heading` (per template); we strip the `N. ` prefix when keying so
// callers don't depend on numbering.
function splitSections(body: string): Map<string, string> {
  const sections = new Map<string, string>();
  const lines = body.split(/\r?\n/);
  let currentKey: string | null = null;
  let buf: string[] = [];

  const flush = () => {
    if (currentKey !== null) {
      sections.set(currentKey, buf.join('\n').trim());
    }
  };

  for (const line of lines) {
    const h2 = /^##\s+(?:\d+\.\s*)?(.+)$/.exec(line);
    if (h2) {
      flush();
      currentKey = h2[1].trim().toLowerCase();
      buf = [];
    } else {
      buf.push(line);
    }
  }
  flush();
  return sections;
}

function extractTitle(body: string): string {
  const m = /^#\s+(.+)$/m.exec(body);
  return m ? m[1].trim() : '';
}

const VERSES_HEADING_KEYS = ['câu kinh trong bài', 'cau kinh trong bai'];

export function parseLessonMarkdown(input: string): ParsedLesson {
  const fmMatch = FRONTMATTER_RE.exec(input);
  const frontmatter = fmMatch ? parseFrontmatter(fmMatch[1]) : {};
  const body = fmMatch ? input.slice(fmMatch[0].length) : input;

  const title = extractTitle(body) || frontmatter.title || '';
  const sections = splitSections(body);

  // Pull each section by normalized header key (case + diacritic insensitive).
  const get = (...keys: string[]): string => {
    for (const k of keys) {
      const v = sections.get(k);
      if (v) return v;
    }
    return '';
  };

  const notes = get('ghi chú bài học', 'ghi chu bai hoc');
  const lessons = get('bài học rút ra', 'bai hoc rut ra');
  const exercises = get('bài tập', 'bai tap');
  const questions = get('câu hỏi muốn hỏi giáo viên', 'cau hoi muon hoi giao vien');
  const versesSection = get(...VERSES_HEADING_KEYS);

  // ONLY parse refs from section 2 — user-confirmed scope.
  const versesRaw = versesSection
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  const refs = dedupeRefs(parseReferences(versesRaw));

  return {
    frontmatter,
    title,
    sections: { notes, versesRaw, lessons, exercises, questions },
    refs,
  };
}
