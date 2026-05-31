import type { TimeSlot } from '@prisma/client';
import type { IconifyName } from 'src/components/iconify';

// ----------------------------------------------------------------------

export const TIME_SLOT_ORDER: TimeSlot[] = ['morning', 'afternoon', 'evening'];

export const TIME_SLOT_LABEL: Record<TimeSlot, string> = {
  morning: 'Sáng',
  afternoon: 'Chiều',
  evening: 'Tối',
};

export const TIME_SLOT_ICON: Record<TimeSlot, IconifyName> = {
  morning: 'solar:cup-hot-bold',
  afternoon: 'solar:bolt-bold',
  evening: 'solar:bed-bold',
};

// ----------------------------------------------------------------------
// Vietnamese day-of-week labels (Mon..Sun) — derived by index from dayjs.day()
// after adjusting Sun=0 to come last.
export const DAY_LABEL_VN = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];
