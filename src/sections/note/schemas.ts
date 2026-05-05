import { z } from 'zod';

import { NOTE_TYPE_VALUES } from './constants/note-types';

// ----------------------------------------------------------------------

export const noteFormSchema = z.object({
  type: z.enum(NOTE_TYPE_VALUES as [string, ...string[]]),
  title: z
    .string()
    .trim()
    .min(1, 'Tiêu đề không được trống')
    .max(120, 'Tiêu đề tối đa 120 ký tự'),
  content: z
    .string()
    .trim()
    .min(1, 'Nội dung không được trống')
    .max(10000, 'Nội dung tối đa 10000 ký tự'),
});

export type NoteFormValues = z.infer<typeof noteFormSchema>;
