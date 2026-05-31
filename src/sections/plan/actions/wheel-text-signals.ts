import type { LifeArea } from '@prisma/client';

// ----------------------------------------------------------------------
// Vietnamese keyword library for inferring life-area focus from free-form
// text (note content, gratitude items, transaction descriptions, category
// names). Used to fill gaps when the user hasn't tagged tasks with
// `lifeArea` — gives AI enough signal to differentiate HEALTH/FAMILY/SOCIAL
// /RECREATION instead of defaulting to 5/10 for everything.
//
// Trade-off: keyword matching is fuzzy. We deliberately bias keywords
// toward high-precision phrases to avoid false positives (e.g. "ăn"
// alone is too generic — "ăn uống lành mạnh" is better signal but rare,
// so we keep the lighter "ăn uống" and let AI weigh it with task data).
// ----------------------------------------------------------------------

// Phrases are lowercase. Order doesn't matter. Whole-word matching is too
// strict for Vietnamese (no clear word boundaries) — substring match keeps
// it simple and good enough.
const KEYWORDS: Record<LifeArea, string[]> = {
  HEALTH: [
    'sức khỏe', 'tập gym', 'gym', 'chạy bộ', 'đi bộ', 'yoga', 'thiền',
    'giấc ngủ', 'dinh dưỡng', 'bác sĩ', 'thuốc', 'thể dục', 'mệt mỏi',
    'bệnh', 'tập luyện', 'cân nặng', 'ăn uống', 'thực phẩm', 'rau',
  ],
  CAREER: [
    'công việc', 'dự án', 'họp', 'sếp', 'khách hàng', 'deadline',
    'báo cáo', 'task ', 'đồng nghiệp', 'sự nghiệp', 'kpi', 'okr',
    'thăng chức', 'phỏng vấn',
  ],
  FINANCE: [
    'tiền', 'lương', 'tiết kiệm', 'đầu tư', 'chi tiêu', 'ngân sách',
    'nợ', 'tài chính', 'cổ phiếu', 'crypto', 'lãi suất',
  ],
  GROWTH: [
    'học ', 'kỹ năng', 'phát triển', 'mục tiêu', 'sách', 'đọc sách',
    'khóa học', 'mentor', 'thói quen', 'kỷ luật', 'tự học',
  ],
  FAMILY: [
    'gia đình', 'mẹ', 'bố ', 'ba ', 'cha', 'vợ', 'chồng', 'con ',
    'con cái', 'ông bà', 'anh trai', 'chị gái', 'em trai', 'em gái',
    'cháu', 'tổ ấm', 'sum họp',
  ],
  SOCIAL: [
    'bạn bè', 'bạn thân', 'gặp bạn', 'hẹn', 'cà phê', 'đi chơi',
    'tiệc', 'nhóm', 'cộng đồng', 'tình nguyện', 'kết nối', 'giao lưu',
  ],
  RECREATION: [
    'phim', 'xem phim', 'game', 'chơi game', 'du lịch', 'nghỉ ngơi',
    'thư giãn', 'âm nhạc', 'nhạc', 'vẽ', 'sở thích', 'giải trí',
    'cuối tuần', 'đi dạo', 'leo núi', 'cắm trại',
  ],
  SPIRITUALITY: [
    'cầu nguyện', 'kinh thánh', 'biết ơn', 'lòng biết ơn', 'chúa',
    'phật', 'tâm linh', 'thánh', 'đức tin', 'lễ nhà thờ', 'suy ngẫm',
  ],
};

const AREA_KEYS: LifeArea[] = [
  'HEALTH', 'CAREER', 'FINANCE', 'GROWTH',
  'FAMILY', 'SOCIAL', 'RECREATION', 'SPIRITUALITY',
];

function emptyCounts(): Record<LifeArea, number> {
  return AREA_KEYS.reduce(
    (acc, k) => ({ ...acc, [k]: 0 }),
    {} as Record<LifeArea, number>
  );
}

// ----------------------------------------------------------------------

/**
 * Count keyword hits across the joined text. Each occurrence counts (i.e.
 * mentioning "gia đình" twice in one note returns 2). Counts capped at
 * 50 per area to prevent a single rant from skewing the chart.
 */
export function countLifeAreaKeywords(texts: string[]): Record<LifeArea, number> {
  if (texts.length === 0) return emptyCounts();

  const joined = texts.join(' \n ').toLowerCase();
  const counts = emptyCounts();

  for (const area of AREA_KEYS) {
    for (const kw of KEYWORDS[area]) {
      // Plain substring count — escaped just in case a keyword ever contains regex chars.
      const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const matches = joined.match(new RegExp(escaped, 'g'));
      if (matches) counts[area] += matches.length;
    }
    counts[area] = Math.min(50, counts[area]);
  }

  return counts;
}

// ----------------------------------------------------------------------

/**
 * Maps Vietnamese category names to a likely LifeArea. Only obvious 1:1
 * matches; everything else stays unmapped (don't force-fit).
 * Returns null when the category doesn't clearly map.
 */
export function categoryNameToLifeArea(name: string): LifeArea | null {
  const n = name.toLowerCase().trim();
  // Seeded categories: Ăn uống, Mua sắm, Di chuyển, Giải trí, Hoá đơn, Khác
  // + income: Lương, Thưởng, Lãi tiền gửi, Thu nhập khác
  if (n.includes('giải trí') || n.includes('giai tri')) return 'RECREATION';
  if (n.includes('ăn uống') || n.includes('an uong')) return 'HEALTH'; // food → health proxy
  if (n.includes('sức khỏe') || n.includes('y tế') || n.includes('thuốc')) return 'HEALTH';
  if (n.includes('học') || n.includes('khóa học') || n.includes('sách')) return 'GROWTH';
  if (n.includes('gia đình') || n.includes('quà') || n.includes('biếu')) return 'FAMILY';
  return null;
}
