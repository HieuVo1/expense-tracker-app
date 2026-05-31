import type { LifeArea } from '@prisma/client';
import type { IconifyName } from 'src/components/iconify';

// ----------------------------------------------------------------------
// Wheel of Life: 8 fixed life dimensions. Order drives chart axis order +
// picker menu order. Don't reorder without coordinating with phase-06 chart.

export const LIFE_AREA_ORDER: LifeArea[] = [
  'HEALTH',
  'CAREER',
  'FINANCE',
  'GROWTH',
  'FAMILY',
  'SOCIAL',
  'RECREATION',
  'SPIRITUALITY',
];

export const LIFE_AREA_LABEL: Record<LifeArea, string> = {
  HEALTH: 'Sức khỏe',
  CAREER: 'Sự nghiệp',
  FINANCE: 'Tài chính',
  GROWTH: 'Phát triển bản thân',
  FAMILY: 'Gia đình',
  SOCIAL: 'Bạn bè & Xã hội',
  RECREATION: 'Giải trí',
  SPIRITUALITY: 'Tâm linh',
};

// Registered Solar icons — verified against icon-sets.ts. The chosen icons
// favor visual variety so the wheel + chips read clearly at a glance.
export const LIFE_AREA_ICON: Record<LifeArea, IconifyName> = {
  HEALTH: 'solar:heart-pulse-bold',
  CAREER: 'solar:case-minimalistic-bold',
  FINANCE: 'solar:wallet-money-bold',
  GROWTH: 'solar:book-bookmark-bold',
  FAMILY: 'solar:home-smile-bold',
  SOCIAL: 'solar:users-group-rounded-bold',
  RECREATION: 'solar:gamepad-bold',
  SPIRITUALITY: 'solar:star-rings-bold',
};

// MUI palette keys — kept inside the theme so dark/light mode flips work.
export const LIFE_AREA_COLOR: Record<
  LifeArea,
  'error' | 'info' | 'success' | 'primary' | 'warning' | 'secondary'
> = {
  HEALTH: 'error', // red — vitality
  CAREER: 'info', // blue
  FINANCE: 'success', // green — money
  GROWTH: 'primary', // brand green
  FAMILY: 'warning', // amber — warmth
  SOCIAL: 'secondary', // purple
  RECREATION: 'info',
  SPIRITUALITY: 'warning',
};
