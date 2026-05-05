import { z } from 'zod';

// YYYY-MM-DD string (no time component)
const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày không hợp lệ (YYYY-MM-DD)');

// ----------------------------------------------------------------------

export const planFormSchema = z
  .object({
    scope: z.enum(['weekly', 'monthly']),
    title: z.string().trim().min(1, 'Vui lòng nhập tiêu đề').max(120, 'Tiêu đề tối đa 120 ký tự'),
    description: z.string().max(500, 'Mô tả tối đa 500 ký tự').optional(),
    startDate: dateString,
    endDate: dateString,
  })
  .refine((d) => d.startDate <= d.endDate, {
    path: ['endDate'],
    message: 'Ngày kết thúc phải sau ngày bắt đầu',
  });

export type PlanFormValues = z.infer<typeof planFormSchema>;
