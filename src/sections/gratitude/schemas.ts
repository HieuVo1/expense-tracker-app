import { z } from 'zod';
import dayjs from 'dayjs';

import { GRATITUDE_MAX_ITEMS, GRATITUDE_ITEM_MAX_LEN } from './constants/gratitude';

// ----------------------------------------------------------------------
// Form-side: rows may include blanks the user hasn't filled yet. Trimming +
// blank-stripping + the >= 1 check happen at submit/parse time.

const formItemsSchema = z
  .array(
    z.object({
      value: z.string().max(GRATITUDE_ITEM_MAX_LEN, `Tối đa ${GRATITUDE_ITEM_MAX_LEN} ký tự`),
    })
  )
  .superRefine((rows, ctx) => {
    const filled = rows.filter((r) => r.value.trim().length > 0);
    if (filled.length < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Hãy ghi ít nhất 1 điều biết ơn',
      });
    }
  });

export const gratitudeFormSchema = z.object({ items: formItemsSchema });
export type GratitudeFormValues = z.infer<typeof gratitudeFormSchema>;

// Edit form (past days) — adds a date field. DatePicker stores an ISO string.
export const gratitudeEditFormSchema = z.object({
  date: z.string().min(1, 'Chọn ngày'),
  items: formItemsSchema,
});
export type GratitudeEditFormValues = z.infer<typeof gratitudeEditFormSchema>;

// ----------------------------------------------------------------------
// Server-side: re-validated so the hard >= 5 rule holds even if a client is
// bypassed. Accept raw rows incl. blanks, trim, drop blanks, THEN enforce
// per-item + count rules.

const serverItemsSchema = z
  .array(z.string().max(GRATITUDE_ITEM_MAX_LEN))
  .transform((arr) => arr.map((s) => s.trim()).filter((s) => s.length > 0))
  .pipe(
    z
      .array(z.string().min(1).max(GRATITUDE_ITEM_MAX_LEN))
      .min(1, 'Hãy ghi ít nhất 1 điều biết ơn')
      .max(GRATITUDE_MAX_ITEMS, `Tối đa ${GRATITUDE_MAX_ITEMS} điều`)
  );

// Normalizes a DatePicker value to `YYYY-MM-DD`. Takes the wall-clock date
// prefix from an ISO string (no timezone conversion) so the user-picked day is
// preserved regardless of server TZ — matches the app's "naive UTC" convention.
const isoDateRequired = z
  .union([z.string(), z.date()])
  .transform((v) => {
    if (typeof v === 'string') {
      const m = v.match(/^(\d{4}-\d{2}-\d{2})/);
      if (m) return m[1];
    }
    const d = dayjs(v);
    return d.isValid() ? d.format('YYYY-MM-DD') : '';
  })
  .pipe(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày không hợp lệ'));

export const gratitudeUpsertSchema = z.object({ items: serverItemsSchema });

export const gratitudeUpdateSchema = z.object({
  id: z.string().min(1),
  date: isoDateRequired,
  items: serverItemsSchema,
});

export type GratitudeUpsertInput = z.input<typeof gratitudeUpsertSchema>;
