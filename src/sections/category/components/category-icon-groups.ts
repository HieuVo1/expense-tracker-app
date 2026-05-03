import type { IconifyName } from 'src/components/iconify';

// Icons drawn from the registry in src/components/iconify/icon-sets.ts. Grouped
// by domain so the picker reads as a small glossary instead of a wall of glyphs.
// Adding more? First register the icon in icon-sets.ts so the IconifyName union
// stays exhaustive.
export const ICON_GROUPS: Array<{ label: string; icons: IconifyName[] }> = [
  {
    label: 'Ăn uống & Đồ uống',
    icons: [
      'solar:plate-bold',
      'solar:chef-hat-bold',
      'solar:chef-hat-minimalistic-bold',
      'solar:donut-bitten-bold',
      'solar:tea-cup-bold',
      'solar:cup-star-bold',
      'solar:cup-hot-bold',
      'solar:cup-paper-bold',
      'solar:bottle-bold',
    ],
  },
  {
    label: 'Mua sắm & Quà',
    icons: [
      'solar:cart-3-bold',
      'solar:cart-plus-bold',
      'solar:bag-4-bold',
      'solar:t-shirt-bold',
      'solar:hanger-2-outline',
      'solar:tag-horizontal-bold-duotone',
      'solar:gift-bold',
      'solar:star-rings-bold',
    ],
  },
  {
    label: 'Di chuyển & Du lịch',
    icons: [
      'solar:scooter-bold',
      'solar:bus-bold',
      'solar:electric-refueling-bold',
      'solar:suitcase-tag-bold',
      'solar:flag-bold',
    ],
  },
  {
    label: 'Giải trí',
    icons: [
      'solar:gamepad-bold',
      'solar:tv-bold',
      'solar:headphones-round-bold',
      'solar:play-circle-bold',
      'solar:ticket-bold',
      'solar:music-note-bold',
      'solar:microphone-bold',
      'solar:video-frame-play-horizontal-bold',
    ],
  },
  {
    label: 'Hoá đơn & Tiện ích',
    icons: [
      'solar:bill-list-bold-duotone',
      'solar:bolt-bold',
      'solar:waterdrop-bold',
      'solar:wi-fi-router-bold',
      'solar:lightbulb-bolt-bold',
      'solar:file-text-bold',
    ],
  },
  {
    label: 'Sức khoẻ & Thể thao',
    icons: [
      'solar:heart-pulse-bold',
      'solar:medical-kit-bold',
      'solar:pill-bold',
      'solar:dumbbell-large-minimalistic-bold',
      'solar:hand-heart-bold',
      'solar:bed-bold',
    ],
  },
  {
    label: 'Nhà cửa & Gia đình',
    icons: [
      'solar:home-angle-bold-duotone',
      'solar:home-smile-bold',
      'solar:key-minimalistic-bold',
      'solar:armchair-bold',
      'solar:user-rounded-bold',
      'solar:users-group-rounded-bold',
    ],
  },
  {
    label: 'Tài chính & Đầu tư',
    icons: [
      'solar:wad-of-money-bold',
      'solar:money-bag-bold',
      'solar:card-bold',
      'solar:wallet-money-bold',
      'solar:hand-money-bold',
      'solar:dollar-minimalistic-bold',
      'solar:banknote-bold',
      'solar:safe-2-bold',
      'solar:graph-up-bold',
    ],
  },
  {
    label: 'Học tập & Công việc',
    icons: [
      'solar:square-academic-cap-bold',
      'solar:book-2-bold',
      'solar:book-bookmark-bold',
      'solar:pen-new-square-bold',
      'solar:notebook-bold-duotone',
    ],
  },
  {
    label: 'Công nghệ & Khác',
    icons: [
      'solar:smartphone-2-bold',
      'solar:monitor-bold',
      'solar:cpu-bolt-bold',
      'solar:palette-bold',
      'solar:menu-dots-bold-duotone',
    ],
  },
];

// First icon overall — used as the form default when creating a category.
export const DEFAULT_CATEGORY_ICON: IconifyName = ICON_GROUPS[0].icons[0];
