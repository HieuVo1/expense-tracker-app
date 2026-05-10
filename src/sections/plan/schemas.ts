import { z } from 'zod';
import dayjs from 'dayjs';

// Accepts any dayjs-parseable date (ISO from picker, YYYY-MM-DD seed values).
// Server action narrows to YYYY-MM-DD before persisting.
const dateLike = z
  .string()
  .min(1, 'Vui lòng chọn ngày')
  .refine((v) => dayjs(v).isValid(), 'Ngày không hợp lệ');

function ymd(v: string): string {
  return dayjs(v).format('YYYY-MM-DD');
}

// ----------------------------------------------------------------------

export const planFormSchema = z
  .object({
    scope: z.enum(['weekly', 'monthly']),
    title: z.string().trim().min(1, 'Vui lòng nhập tiêu đề').max(120, 'Tiêu đề tối đa 120 ký tự'),
    description: z.string().max(500, 'Mô tả tối đa 500 ký tự').optional(),
    startDate: dateLike,
    endDate: dateLike,
  })
  .refine((d) => ymd(d.startDate) <= ymd(d.endDate), {
    path: ['endDate'],
    message: 'Ngày kết thúc phải sau ngày bắt đầu',
  });

export type PlanFormValues = z.infer<typeof planFormSchema>;
