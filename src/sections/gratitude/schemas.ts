import { z } from 'zod';

import {
  GRATITUDE_MIN_ITEMS,
  GRATITUDE_MAX_ITEMS,
  GRATITUDE_ITEM_MAX_LEN,
} from './constants/gratitude';

// ----------------------------------------------------------------------

// Form holds raw rows (may include blanks the user hasn't filled yet).
// Trimming + blank-stripping + the >= 5 check happen at submit/parse time.
export const gratitudeFormSchema = z.object({
  items: z
    .array(
      z.object({
        value: z.string().max(GRATITUDE_ITEM_MAX_LEN, `Tối đa ${GRATITUDE_ITEM_MAX_LEN} ký tự`),
      })
    )
    .superRefine((rows, ctx) => {
      const filled = rows.filter((r) => r.value.trim().length > 0);
      if (filled.length < GRATITUDE_MIN_ITEMS) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Cần ít nhất ${GRATITUDE_MIN_ITEMS} điều biết ơn (đang có ${filled.length})`,
        });
      }
    }),
});

export type GratitudeFormValues = z.infer<typeof gratitudeFormSchema>;

// ----------------------------------------------------------------------

// Server action payload — already-flattened string list. Re-validated server-side
// so the hard >= 5 rule holds even if the client is bypassed.
export const gratitudeUpsertSchema = z.object({
  items: z
    // Accept raw rows incl. blanks (the form sends empty trailing rows). Trim,
    // then drop blanks BEFORE enforcing per-item + count rules — otherwise an
    // empty row would fail `.min(1)` before the filter can remove it.
    .array(z.string().max(GRATITUDE_ITEM_MAX_LEN))
    .transform((arr) => arr.map((s) => s.trim()).filter((s) => s.length > 0))
    .pipe(
      z
        .array(z.string().min(1).max(GRATITUDE_ITEM_MAX_LEN))
        .min(GRATITUDE_MIN_ITEMS, `Cần ít nhất ${GRATITUDE_MIN_ITEMS} điều biết ơn`)
        .max(GRATITUDE_MAX_ITEMS, `Tối đa ${GRATITUDE_MAX_ITEMS} điều`)
    ),
});

export type GratitudeUpsertInput = z.input<typeof gratitudeUpsertSchema>;
