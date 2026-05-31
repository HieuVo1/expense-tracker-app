import { z } from 'zod';
import dayjs from 'dayjs';

// Accepts any dayjs-parseable date (ISO from picker, YYYY-MM-DD seed values).
// Server action narrows to YYYY-MM-DD before persisting.
function ymd(v: string): string {
  return dayjs(v).format('YYYY-MM-DD');
}

// ----------------------------------------------------------------------

// Dates required for weekly/monthly/yearly, optional for backlog.
export const planFormSchema = z
  .object({
    scope: z.enum(['weekly', 'monthly', 'yearly', 'backlog']),
    title: z.string().trim().min(1, 'Vui lòng nhập tiêu đề').max(120, 'Tiêu đề tối đa 120 ký tự'),
    description: z.string().max(500, 'Mô tả tối đa 500 ký tự').optional(),
    startDate: z.string().optional().nullable(),
    endDate: z.string().optional().nullable(),
  })
  .superRefine((d, ctx) => {
    if (d.scope === 'backlog') return; // dates ignored for backlog
    if (!d.startDate || !dayjs(d.startDate).isValid()) {
      ctx.addIssue({
        code: 'custom',
        path: ['startDate'],
        message: 'Vui lòng chọn ngày bắt đầu',
      });
    }
    if (!d.endDate || !dayjs(d.endDate).isValid()) {
      ctx.addIssue({
        code: 'custom',
        path: ['endDate'],
        message: 'Vui lòng chọn ngày kết thúc',
      });
    }
    if (d.startDate && d.endDate && ymd(d.startDate) > ymd(d.endDate)) {
      ctx.addIssue({
        code: 'custom',
        path: ['endDate'],
        message: 'Ngày kết thúc phải sau ngày bắt đầu',
      });
    }
  });

export type PlanFormValues = z.infer<typeof planFormSchema>;
