import type { NoteType } from '@prisma/client';
import type { IconifyName } from 'src/components/iconify';

// ----------------------------------------------------------------------

// Notes module now only uses the 'daily' type.
// Other Note types (GOAL, THOUGHT, LESSON, SIGNAL, PRINCIPLE, TRAIT, ACTION)
// belong exclusively to the About-me module.
type DailyNoteType = Extract<NoteType, 'daily'>;

export const NOTE_TYPE_LABELS: Record<DailyNoteType, string> = {
  daily: 'Nhật ký',
};

export const NOTE_TYPE_COLORS: Record<DailyNoteType, string> = {
  daily: '#5d737e',
};

export const NOTE_TYPE_ICONS: Record<DailyNoteType, IconifyName> = {
  daily: 'solar:calendar-date-bold',
};

export const NOTE_TYPE_VALUES: [DailyNoteType] = ['daily'];
