import { z } from 'zod';

// Zod schemas for Bible-study server actions. Kept thin — most validation lives
// in the markdown parser (which is non-throwing); these gate user input at the
// action boundary (file size, IDs, theme fields, review quality).

const MAX_FILE_BYTES = 1_000_000; // 1 MB

export const importLessonSchema = z.object({
  file: z
    .instanceof(File, { message: 'Tệp không hợp lệ' })
    .refine((f) => f.size <= MAX_FILE_BYTES, 'Tệp vượt quá 1MB')
    .refine((f) => f.name.toLowerCase().endsWith('.md'), 'Chỉ chấp nhận tệp .md'),
});

export const lessonUpdateSchema = z.object({
  id: z.string().min(1),
  title: z.string().trim().min(1, 'Tiêu đề không được trống').max(200, 'Tiêu đề tối đa 200 ký tự'),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày phải dạng YYYY-MM-DD'),
});

export const lessonSectionUpdateSchema = z.object({
  id: z.string().min(1),
  section: z.enum(['notes', 'lessons', 'exercises', 'questions']),
  content: z.string().max(20_000, 'Nội dung quá dài'),
});

export const themeCreateSchema = z.object({
  name: z.string().trim().min(1, 'Tên không được trống').max(60, 'Tên tối đa 60 ký tự'),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Màu phải dạng hex #RRGGBB')
    .default('#00A76F'),
  description: z.string().trim().max(500).optional().nullable(),
});

export const themeUpdateSchema = themeCreateSchema.extend({
  id: z.string().min(1),
});

export const themeIdSchema = z.object({
  id: z.string().min(1),
});

export const verseThemeLinkSchema = z.object({
  verseId: z.string().min(1),
  themeId: z.string().min(1),
});

export const resolveAmbiguousSchema = z.object({
  verseId: z.string().min(1),
  bookCode: z
    .string()
    .min(2)
    .max(3)
    .regex(/^[A-Z0-9]+$/, 'Mã sách không hợp lệ'),
});

export const reviewRecordSchema = z.object({
  verseId: z.string().min(1),
  quality: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]),
});

export const suggestThemesSchema = z.object({
  verseId: z.string().min(1),
});

export const searchQuerySchema = z.object({
  q: z.string().trim().min(2, 'Tối thiểu 2 ký tự').max(100, 'Tối đa 100 ký tự'),
});

// Challenge flashcard mode schemas.
export const challengeDeckQuerySchema = z.object({
  themeId: z.string().min(1).nullable(),
});

export const updateChallengePromptSchema = z.object({
  verseId: z.string().min(1),
  themeId: z.string().min(1),
  // nullable() allows explicit null; empty string → treated as null in the action.
  prompt: z.string().trim().max(200, 'Lời nhắc tối đa 200 ký tự').nullable(),
});
