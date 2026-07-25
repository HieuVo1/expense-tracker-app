// About-me UI copy — empty states, source labels, status labels, GOAL kind/status.
// All strings Vietnamese. Exceptions documented inline.

import type {
  AboutMeType,
  GoalMetadata,
  TraitMetadata,
  LessonMetadata,
  ActionMetadata,
} from '../types';

// ----------------------------------------------------------------------
// Empty-state strings shown when a type has zero entries

export const ABOUT_ME_EMPTY_STATES: Record<AboutMeType, string> = {
  GOAL: 'Chưa có mục tiêu nào — đặt north star đầu tiên của bạn',
  THOUGHT: 'Chưa có suy nghĩ nào — ghi lại điều đang trong đầu bạn',
  LESSON: 'Chưa có bài học nào — đúc rút từ trải nghiệm của bạn',
  SIGNAL: 'Chưa có tín hiệu nào — ghi lại cảm xúc để nhận diện pattern',
  PRINCIPLE: 'Chưa có tiêu chuẩn nào — ghi lại niềm tin định hướng bạn',
  TRAIT: 'Chưa có đặc điểm nào — tự đánh giá điểm mạnh và yếu',
  ACTION: 'Chưa có hành động nào — cam kết một bước nhỏ hôm nay',
};

// ----------------------------------------------------------------------
// LESSON source labels

export const SOURCE_LABELS: Record<LessonMetadata['source'], string> = {
  course: 'Khoá học',
  experience: 'Trải nghiệm',
  book: 'Sách',
  reflection: 'Tự ngẫm',
};

// ----------------------------------------------------------------------
// ACTION status labels

export const ACTION_STATUS_LABELS: Record<ActionMetadata['status'], string> = {
  planned: 'Chưa bắt đầu',
  doing: 'Đang thực hiện',
  done: 'Hoàn thành',
  skipped: 'Bỏ qua',
};

// ----------------------------------------------------------------------
// GOAL kind labels

export const GOAL_KIND_LABELS: Record<GoalMetadata['kind'], string> = {
  short: 'Ngắn hạn',
  long: 'Dài hạn',
  dream: 'Ước vọng',
};

// ----------------------------------------------------------------------
// GOAL status labels

export const GOAL_STATUS_LABELS: Record<GoalMetadata['status'], string> = {
  active: 'Đang theo đuổi',
  achieved: 'Đã đạt',
  paused: 'Tạm dừng',
  abandoned: 'Đã bỏ',
};

// ----------------------------------------------------------------------
// GOAL kind chip palette — used in GoalKindChip component.
// NOTE: 'dream' uses purple (#6A1B9A / #F3E5F5) which is hard-coded because
// the MUI theme has no purple token. Review when theme is extended.

export const GOAL_KIND_CHIP: Record<GoalMetadata['kind'], { bg: string; fg: string }> = {
  short: { bg: 'info.lighter', fg: '#006C9C' },
  long: { bg: 'primary.lighter', fg: 'primary.dark' },
  // Exception: purple hard-coded — no theme token available (see note above).
  dream: { bg: '#F3E5F5', fg: '#6A1B9A' },
};

// ----------------------------------------------------------------------
// TRAIT kind labels

export const TRAIT_KIND_LABELS: Record<TraitMetadata['kind'], string> = {
  strength: 'Điểm mạnh',
  weakness: 'Điểm yếu',
};

// ----------------------------------------------------------------------
// SIGNAL kind labels

export const SIGNAL_KIND_LABELS: Record<'positive' | 'negative', string> = {
  positive: 'Tín hiệu tích cực',
  negative: 'Tín hiệu tiêu cực',
};
