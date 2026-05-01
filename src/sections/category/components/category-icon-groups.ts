import type { IconifyName } from 'src/components/iconify';

// Icons drawn from the registry in src/components/iconify/icon-sets.ts. Grouped
// by domain so the picker reads as a small glossary instead of a wall of glyphs.
// Adding more? First register the icon in icon-sets.ts so the IconifyName union
// stays exhaustive.
export const ICON_GROUPS: Array<{ label: string; icons: IconifyName[] }> = [
  {
    label: 'Ăn uống & Mua sắm',
    icons: [
      'solar:tea-cup-bold',
      'solar:cup-star-bold',
      'solar:cart-3-bold',
      'solar:cart-plus-bold',
      'solar:hanger-2-outline',
      'solar:tag-horizontal-bold-duotone',
      'solar:gallery-add-bold',
      'solar:box-minimalistic-bold',
    ],
  },
  {
    label: 'Di chuyển & Du lịch',
    icons: [
      'solar:electric-refueling-bold',
      'solar:suitcase-tag-bold',
      'solar:case-minimalistic-bold',
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
      'solar:gallery-wide-bold',
      'solar:videocamera-record-bold',
      'solar:video-frame-play-horizontal-bold',
      'solar:microphone-bold',
    ],
  },
  {
    label: 'Hoá đơn & Tài liệu',
    icons: [
      'solar:bill-list-bold-duotone',
      'solar:notebook-bold-duotone',
      'solar:notes-bold-duotone',
      'solar:file-text-bold',
      'solar:file-check-bold-duotone',
      'solar:letter-bold',
    ],
  },
  {
    label: 'Sức khoẻ & Thể thao',
    icons: [
      'solar:medical-kit-bold',
      'solar:heart-bold',
      'solar:dumbbell-large-minimalistic-bold',
      'solar:bed-bold',
    ],
  },
  {
    label: 'Nhà cửa & Gia đình',
    icons: [
      'solar:home-angle-bold-duotone',
      'solar:home-2-outline',
      'solar:user-rounded-bold',
      'solar:users-group-rounded-bold',
    ],
  },
  {
    label: 'Tài chính',
    icons: [
      'solar:wad-of-money-bold',
      'solar:download-bold',
      'solar:import-bold',
      'solar:export-bold',
      'solar:transfer-horizontal-bold-duotone',
    ],
  },
  {
    label: 'Công nghệ & Khác',
    icons: [
      'solar:smartphone-2-bold',
      'solar:monitor-bold',
      'solar:phone-bold',
      'solar:palette-bold',
      'solar:menu-dots-bold-duotone',
    ],
  },
];

// First icon overall — used as the form default when creating a category.
export const DEFAULT_CATEGORY_ICON: IconifyName = ICON_GROUPS[0].icons[0];
