import { z } from 'zod';
import dayjs from 'dayjs';

// Form-level: accepts anything dayjs can parse (ISO from picker, YYYY-MM-DD seed
// values, dayjs objects). Server action narrows to YYYY-MM-DD before persisting.
const dateLike = z
  .string()
  .min(1, 'Vui lòng chọn ngày')
  .refine((v) => dayjs(v).isValid(), 'Ngày không hợp lệ');

export const subscriptionFormSchema = z.object({
  name: z.string().trim().min(1, 'Vui lòng nhập tên').max(100, 'Tên tối đa 100 ký tự'),
  amount: z
    .string()
    .min(1, 'Vui lòng nhập số tiền')
    .refine((v) => /^\d+$/.test(v) && Number(v) > 0, 'Số tiền phải là số nguyên > 0'),
  cycle: z.enum(['monthly', 'quarterly', 'yearly']),
  categoryId: z.string().min(1, 'Vui lòng chọn danh mục'),
  nextDueDate: dateLike,
  notes: z.string().max(500, 'Ghi chú tối đa 500 ký tự').optional(),
});

export type SubscriptionFormValues = z.infer<typeof subscriptionFormSchema>;
