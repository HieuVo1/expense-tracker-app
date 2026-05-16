// Zod schemas for about-me metadata — discriminated union per type.
// Validated at server action boundary only; form state may use Partial<>.

import dayjs from 'dayjs';
import { z } from 'zod';

import { ABOUT_ME_TYPE_VALUES } from './constants/about-me-types';

// ----------------------------------------------------------------------
// Shared helpers

// Accepts any dayjs-parseable string (e.g. full ISO from DatePicker) and
// normalizes to `YYYY-MM-DD`. Empty / null / undefined → undefined.
const isoDateOnly = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((v) => {
    if (v == null || v === '') return undefined;
    const d = dayjs(v);
    return d.isValid() ? d.format('YYYY-MM-DD') : v;
  })
  .pipe(
    z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Phải là ngày dạng YYYY-MM-DD')
      .optional()
  );

// ----------------------------------------------------------------------
// Per-type metadata schemas

export const goalMetadataSchema = z.object({
  kind: z.enum(['short', 'long', 'dream']),
  targetDate: isoDateOnly,
  status: z.enum(['active', 'achieved', 'paused', 'abandoned']).default('active'),
  progress: z.number().int().min(0).max(100).optional(),
});

export const thoughtMetadataSchema = z.object({
  mood: z.enum(['positive', 'neutral', 'negative']).optional(),
});

export const lessonMetadataSchema = z.object({
  source: z.enum(['course', 'experience', 'book', 'reflection']),
  takeaway: z.string().trim().max(200).optional(),
});

export const signalMetadataSchema = z.object({
  kind: z.enum(['positive', 'negative']),
  trigger: z.string().trim().min(1, 'Trigger không được trống').max(200),
  emotion: z.string().trim().min(1, 'Cảm xúc không được trống').max(100),
  meaning: z.string().trim().max(500).optional(),
  action: z.string().trim().max(500).optional(),
});

export const principleMetadataSchema = z.object({
  domain: z.enum(['work', 'relationship', 'health', 'finance', 'growth', 'other']).optional(),
  // Link from PRINCIPLE back to the LESSON row it was derived from.
  // Stored as the Note.id (cuid string). Optional — not all principles trace to a lesson.
  derivedFromLessonId: z.string().optional(),
});

export const traitMetadataSchema = z.object({
  kind: z.enum(['strength', 'weakness']),
  context: z.string().trim().max(200).optional(),
});

export const actionMetadataSchema = z.object({
  status: z.enum(['planned', 'doing', 'done', 'skipped']).default('planned'),
  dueDate: isoDateOnly,
});

// ----------------------------------------------------------------------
// Inferred metadata types (runtime-safe via Zod)

export type GoalMetadataParsed = z.infer<typeof goalMetadataSchema>;
export type ThoughtMetadataParsed = z.infer<typeof thoughtMetadataSchema>;
export type LessonMetadataParsed = z.infer<typeof lessonMetadataSchema>;
export type SignalMetadataParsed = z.infer<typeof signalMetadataSchema>;
export type PrincipleMetadataParsed = z.infer<typeof principleMetadataSchema>;
export type TraitMetadataParsed = z.infer<typeof traitMetadataSchema>;
export type ActionMetadataParsed = z.infer<typeof actionMetadataSchema>;

// ----------------------------------------------------------------------
// Common fields shared across all about-me form variants

const baseAboutMeFields = {
  title: z.string().trim().max(120).optional(),
  content: z.string().trim().max(10000).default(''),
  tags: z
    .array(z.string().trim().min(1).max(32).transform((s) => s.toLowerCase()))
    .max(12)
    .default([]),
};

// ----------------------------------------------------------------------
// Discriminated union — validated at submit boundary per type.

export const aboutMeFormSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('GOAL'), ...baseAboutMeFields, metadata: goalMetadataSchema }),
  z.object({ type: z.literal('THOUGHT'), ...baseAboutMeFields, metadata: thoughtMetadataSchema }),
  z.object({ type: z.literal('LESSON'), ...baseAboutMeFields, metadata: lessonMetadataSchema }),
  z.object({ type: z.literal('SIGNAL'), ...baseAboutMeFields, metadata: signalMetadataSchema }),
  z.object({
    type: z.literal('PRINCIPLE'),
    ...baseAboutMeFields,
    metadata: principleMetadataSchema,
  }),
  z.object({ type: z.literal('TRAIT'), ...baseAboutMeFields, metadata: traitMetadataSchema }),
  z.object({ type: z.literal('ACTION'), ...baseAboutMeFields, metadata: actionMetadataSchema }),
]);

export type AboutMeFormValues = z.infer<typeof aboutMeFormSchema>;

// ----------------------------------------------------------------------
// Update schema — extends form with id

export const aboutMeUpdateSchema = aboutMeFormSchema.and(z.object({ id: z.string().min(1) }));
export type AboutMeUpdateValues = z.infer<typeof aboutMeUpdateSchema>;

// ----------------------------------------------------------------------
// Type-values enum for Zod (derived from canonical ordered array)

export const aboutMeTypeEnum = z.enum(
  ABOUT_ME_TYPE_VALUES as unknown as [
    'GOAL',
    'THOUGHT',
    'LESSON',
    'SIGNAL',
    'PRINCIPLE',
    'TRAIT',
    'ACTION',
  ]
);
