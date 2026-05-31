// USFM book codes ↔ Vietnamese display names + aliases used by the reference
// parser. Full 66-book Protestant canon. Aliases are normalized (lowercase,
// strip dashes/spaces/dots/diacritics) so the parser compares apples to apples.
//
// Source of truth: USFM 3.0 spec + VIE2010 book names from bible.com.

export type BookEntry = {
  code: string;        // USFM, e.g. 'MAT', '1CO'
  vn: string;          // Canonical Vietnamese display name
  aliases: string[];   // ADDITIONAL normalized aliases (canonical VN is auto-added)
};

export const BOOKS: BookEntry[] = [
  // --- Old Testament ---
  { code: 'GEN', vn: 'Sáng thế ký', aliases: ['sang the', 'sang the ky', 'sang'] },
  { code: 'EXO', vn: 'Xuất Ai Cập', aliases: ['xuat', 'xuat ai cap', 'xuat hanh'] },
  { code: 'LEV', vn: 'Lê-vi ký', aliases: ['levi', 'le vi', 'le vi ky'] },
  { code: 'NUM', vn: 'Dân số ký', aliases: ['dan so', 'dan so ky'] },
  { code: 'DEU', vn: 'Phục truyền luật lệ ký', aliases: ['phuc truyen', 'phuc truyen luat le ky'] },
  { code: 'JOS', vn: 'Giô-suê', aliases: ['giosue', 'gio sue'] },
  { code: 'JDG', vn: 'Các quan xét', aliases: ['cac quan xet', 'quan xet'] },
  { code: 'RUT', vn: 'Ru-tơ', aliases: ['ruto', 'ru to'] },
  { code: '1SA', vn: '1 Sa-mu-ên', aliases: ['1 samuen', '1samuen', '1 sa mu en', 'i sa mu en', 'isamuen'] },
  { code: '2SA', vn: '2 Sa-mu-ên', aliases: ['2 samuen', '2samuen', '2 sa mu en', 'ii sa mu en'] },
  { code: '1KI', vn: '1 Các Vua', aliases: ['1 cac vua', '1cacvua', '1 vua', 'i cac vua'] },
  { code: '2KI', vn: '2 Các Vua', aliases: ['2 cac vua', '2cacvua', '2 vua', 'ii cac vua'] },
  { code: '1CH', vn: '1 Sử ký', aliases: ['1 su ky', '1suky', 'i su ky'] },
  { code: '2CH', vn: '2 Sử ký', aliases: ['2 su ky', '2suky', 'ii su ky'] },
  { code: 'EZR', vn: 'E-xơ-ra', aliases: ['exora', 'e xo ra'] },
  { code: 'NEH', vn: 'Nê-hê-mi', aliases: ['nehemi', 'ne he mi'] },
  { code: 'EST', vn: 'Ê-xơ-tê', aliases: ['exote', 'e xo te'] },
  { code: 'JOB', vn: 'Gióp', aliases: ['giop'] },
  { code: 'PSA', vn: 'Thi thiên', aliases: ['thi thien', 'thi-thien'] },
  { code: 'PRO', vn: 'Châm ngôn', aliases: ['cham ngon'] },
  { code: 'ECC', vn: 'Truyền đạo', aliases: ['truyen dao'] },
  { code: 'SNG', vn: 'Nhã ca', aliases: ['nha ca'] },
  { code: 'ISA', vn: 'Ê-sai', aliases: ['esai', 'e sai', 'isaia'] },
  { code: 'JER', vn: 'Giê-rê-mi', aliases: ['gieremi', 'gie re mi'] },
  { code: 'LAM', vn: 'Ca thương', aliases: ['ca thuong'] },
  { code: 'EZK', vn: 'Ê-xê-chi-ên', aliases: ['exechien', 'e xe chi en'] },
  { code: 'DAN', vn: 'Đa-ni-ên', aliases: ['danien', 'da ni en'] },
  { code: 'HOS', vn: 'Ô-sê', aliases: ['ose', 'o se'] },
  { code: 'JOL', vn: 'Giô-ên', aliases: ['gioen', 'gio en'] },
  { code: 'AMO', vn: 'A-mốt', aliases: ['amot', 'a mot'] },
  { code: 'OBA', vn: 'Áp-đia', aliases: ['apdia', 'ap dia'] },
  { code: 'JON', vn: 'Giô-na', aliases: ['giona', 'gio na'] },
  { code: 'MIC', vn: 'Mi-chê', aliases: ['miche', 'mi che'] },
  { code: 'NAM', vn: 'Na-hum', aliases: ['nahum', 'na hum'] },
  { code: 'HAB', vn: 'Ha-ba-cúc', aliases: ['habacuc', 'ha ba cuc'] },
  { code: 'ZEP', vn: 'Sô-phô-ni', aliases: ['sophoni', 'so pho ni'] },
  { code: 'HAG', vn: 'A-ghê', aliases: ['aghe', 'a ghe'] },
  { code: 'ZEC', vn: 'Xa-cha-ri', aliases: ['xachari', 'xa cha ri'] },
  { code: 'MAL', vn: 'Ma-la-chi', aliases: ['malachi', 'ma la chi'] },
  // --- New Testament ---
  { code: 'MAT', vn: 'Ma-thi-ơ', aliases: ['mathio', 'ma thi o', 'mathiow', 'mat'] },
  { code: 'MRK', vn: 'Mác', aliases: ['mac'] },
  { code: 'LUK', vn: 'Lu-ca', aliases: ['luca', 'lu ca'] },
  { code: 'JHN', vn: 'Giăng', aliases: ['giang'] },
  { code: 'ACT', vn: 'Công vụ', aliases: ['cong vu', 'cong vu cac su do'] },
  { code: 'ROM', vn: 'Rô-ma', aliases: ['roma', 'ro ma'] },
  { code: '1CO', vn: '1 Cô-rinh-tô', aliases: ['1 corinhto', '1corinhto', '1 co rinh to', 'i co rinh to', '1cor'] },
  { code: '2CO', vn: '2 Cô-rinh-tô', aliases: ['2 corinhto', '2corinhto', '2 co rinh to', 'ii co rinh to', '2cor'] },
  { code: 'GAL', vn: 'Ga-la-ti', aliases: ['galati', 'ga la ti'] },
  { code: 'EPH', vn: 'Ê-phê-sô', aliases: ['epheso', 'e phe so'] },
  { code: 'PHP', vn: 'Phi-líp', aliases: ['philip', 'phi lip'] },
  { code: 'COL', vn: 'Cô-lô-se', aliases: ['colose', 'co lo se'] },
  { code: '1TH', vn: '1 Tê-sa-lô-ni-ca', aliases: ['1 tesalonica', '1tesalonica', '1 te sa lo ni ca'] },
  { code: '2TH', vn: '2 Tê-sa-lô-ni-ca', aliases: ['2 tesalonica', '2tesalonica', '2 te sa lo ni ca'] },
  { code: '1TI', vn: '1 Ti-mô-thê', aliases: ['1 timothe', '1timothe', '1 ti mo the'] },
  { code: '2TI', vn: '2 Ti-mô-thê', aliases: ['2 timothe', '2timothe', '2 ti mo the'] },
  { code: 'TIT', vn: 'Tít', aliases: ['tit'] },
  { code: 'PHM', vn: 'Phi-lê-môn', aliases: ['philemon', 'phi le mon'] },
  { code: 'HEB', vn: 'Hê-bơ-rơ', aliases: ['heboro', 'he bo ro'] },
  { code: 'JAS', vn: 'Gia-cơ', aliases: ['giaco', 'gia co'] },
  { code: '1PE', vn: '1 Phi-e-rơ', aliases: ['1 phiero', '1phiero', '1 phi e ro', '1 phi'] },
  { code: '2PE', vn: '2 Phi-e-rơ', aliases: ['2 phiero', '2phiero', '2 phi e ro', '2 phi'] },
  { code: '1JN', vn: '1 Giăng', aliases: ['1 giang', '1giang'] },
  { code: '2JN', vn: '2 Giăng', aliases: ['2 giang', '2giang'] },
  { code: '3JN', vn: '3 Giăng', aliases: ['3 giang', '3giang'] },
  { code: 'JUD', vn: 'Giu-đe', aliases: ['giude', 'giu de'] },
  { code: 'REV', vn: 'Khải huyền', aliases: ['khai huyen'] },
];

// Normalize: lowercase, strip diacritics, replace dashes/dots with space,
// collapse whitespace. So "Ma-thi-ơ" and "MATHIO" and "ma thi o" all become
// "ma thi o" — same key.
export function normalizeBookName(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip combining diacritics
    .replace(/đ/g, 'd')
    .replace(/[-.]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Pre-built lookup: normalized alias → list of USFM codes (multiple = ambiguous).
const ALIAS_MAP: Map<string, string[]> = (() => {
  const map = new Map<string, string[]>();
  const add = (key: string, code: string) => {
    const k = normalizeBookName(key);
    if (!k) return;
    const existing = map.get(k);
    if (existing) {
      if (!existing.includes(code)) existing.push(code);
    } else {
      map.set(k, [code]);
    }
  };
  for (const b of BOOKS) {
    add(b.vn, b.code);
    add(b.code, b.code);
    for (const a of b.aliases) add(a, b.code);
  }
  return map;
})();

export type LookupResult =
  | { match: 'unique'; code: string; vn: string }
  | { match: 'ambiguous'; codes: string[] }
  | { match: 'unknown' };

/**
 * Look up a Vietnamese book name. Returns one of three outcomes; ambiguous
 * means the importer creates a stub row the user must resolve.
 */
export function lookupBook(name: string): LookupResult {
  const codes = ALIAS_MAP.get(normalizeBookName(name));
  if (!codes || codes.length === 0) return { match: 'unknown' };
  if (codes.length === 1) {
    const code = codes[0];
    const vn = BOOKS.find((b) => b.code === code)?.vn ?? code;
    return { match: 'unique', code, vn };
  }
  return { match: 'ambiguous', codes };
}

export function vnNameOf(code: string): string {
  return BOOKS.find((b) => b.code === code)?.vn ?? code;
}
