// About-me type constants — labels, icons, colors, ordering.
// GOAL is first (hub top-left card = north-star anchor).
// Icon strings use Iconify solar set — consistent with the rest of the app.

import type { AboutMeType } from '../types';
import type { IconifyName } from 'src/components/iconify';

// ----------------------------------------------------------------------

/** Canonical ordered array — GOAL must stay first (hub bento top-left). */
export const ABOUT_ME_TYPE_VALUES: AboutMeType[] = [
  'GOAL',
  'THOUGHT',
  'LESSON',
  'SIGNAL',
  'PRINCIPLE',
  'TRAIT',
  'ACTION',
];

// ----------------------------------------------------------------------

export const ABOUT_ME_TYPE_LABELS: Record<AboutMeType, string> = {
  GOAL: 'Mục tiêu & Ước vọng',
  THOUGHT: 'Suy nghĩ',
  LESSON: 'Bài học',
  SIGNAL: 'Tín hiệu cảm xúc',
  PRINCIPLE: 'Tiêu chuẩn',
  TRAIT: 'Điểm mạnh / yếu',
  ACTION: 'Hành động',
};

// ----------------------------------------------------------------------
// Iconify solar icon names (strings — solar set registered in icon-sets).

// Icon names scoped to the registered set in src/components/iconify/icon-sets.ts.
// If a preferred icon is unavailable, the closest registered alternative is used.
export const ABOUT_ME_TYPE_ICONS: Record<AboutMeType, IconifyName> = {
  GOAL: 'solar:flag-bold',
  THOUGHT: 'solar:chat-round-dots-bold',
  LESSON: 'solar:book-2-bold',
  SIGNAL: 'solar:heart-pulse-bold',
  PRINCIPLE: 'solar:shield-check-bold',
  TRAIT: 'solar:user-id-bold',
  ACTION: 'solar:bolt-bold',
};

// ----------------------------------------------------------------------
// Hub card accent colors — MUI theme token strings or hex.
// Each color is the icon-background tint (light), not the full card background.

export const ABOUT_ME_TYPE_COLORS: Record<AboutMeType, string> = {
  GOAL: '#FFD180',       // warm amber — north-star warmth
  THOUGHT: '#B3E5FC',    // sky blue — open thought
  LESSON: '#C8E6C9',     // sage green — growth
  SIGNAL: '#FFCDD2',     // soft red — emotional signal
  PRINCIPLE: '#E8EAF6',  // indigo tint — conviction
  TRAIT: '#FFF9C4',      // pale yellow — self-awareness
  ACTION: '#F3E5F5',     // lavender — commitment
};

/**
 * GOAL card icon background gradient.
 * Hard-coded as a CSS gradient because MUI theme has no warm-amber gradient token.
 * Used in sx prop on the GOAL hub card icon container only.
 */
export const GOAL_ICON_GRADIENT = 'linear-gradient(135deg, #FFE4B5 0%, #FFD180 100%)';

// ----------------------------------------------------------------------

export const ABOUT_ME_TYPE_SUBTITLES: Record<AboutMeType, string> = {
  GOAL: 'North star định hướng',
  THOUGHT: 'Stream-of-consciousness',
  LESSON: 'Trải nghiệm đã đúc rút',
  SIGNAL: 'Pattern cảm xúc',
  PRINCIPLE: 'Niềm tin & nguyên tắc',
  TRAIT: 'Tự đánh giá bản thân',
  ACTION: 'Cam kết hành động',
};
