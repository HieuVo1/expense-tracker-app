import { z } from 'zod';

import { NOTE_TYPE_VALUES } from './constants/note-types';

// ----------------------------------------------------------------------

// Tag rules: trimmed, 1-32 chars, lower-cased; max 12 tags per note.
const tagSchema = z
  .string()
  .trim()
  .min(1, 'Thẻ không được trống')
  .max(32, 'Thẻ tối đa 32 ký tự')
  .transform((s) => s.toLowerCase());

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
  tags: z.array(tagSchema).max(12, 'Tối đa 12 thẻ'),
});

export type NoteFormValues = z.infer<typeof noteFormSchema>;
