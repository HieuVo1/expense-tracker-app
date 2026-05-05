import type { NoteType } from '@prisma/client';
import type { IconifyName } from 'src/components/iconify';

// ----------------------------------------------------------------------

export const NOTE_TYPE_LABELS: Record<NoteType, string> = {
  daily: 'Nhật ký hàng ngày',
  insight: 'Hiểu biết bản thân',
  strength: 'Điểm mạnh',
  weakness: 'Điểm yếu',
  idea: 'Ý tưởng',
};

export const NOTE_TYPE_COLORS: Record<NoteType, string> = {
  daily: '#5d737e',
  insight: '#3d5a80',
  strength: '#4a7c59',
  weakness: '#a3593e',
  idea: '#8b5a8c',
};

export const NOTE_TYPE_ICONS: Record<NoteType, IconifyName> = {
  daily: 'solar:calendar-date-bold',
  insight: 'solar:lightbulb-bolt-bold',
  strength: 'solar:dumbbell-large-minimalistic-bold',
  weakness: 'solar:danger-bold',
  idea: 'solar:notes-bold-duotone',
};

// Daily-first ordering — matches Obsidian-like daily-notes prominence.
export const NOTE_TYPE_VALUES: NoteType[] = ['daily', 'insight', 'strength', 'weakness', 'idea'];
