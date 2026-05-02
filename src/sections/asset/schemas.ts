import * as z from 'zod';

import { ASSET_TYPE_VALUES } from './constants/asset-types';

// Form-level schema: amounts are strings (for plain TextField), not numbers.
// Server action coerces to number after validation.
export const assetFormSchema = z.object({
  name: z.string().trim().min(1, 'Vui lòng nhập tên').max(100),
  type: z.enum(ASSET_TYPE_VALUES as [string, ...string[]]),
  capital: z
    .string()
    .min(1, 'Vui lòng nhập vốn')
    .refine((v) => /^\d+$/.test(v) && Number(v) >= 0, 'Vốn phải là số nguyên ≥ 0'),
  currentValue: z
    .string()
    .min(1, 'Vui lòng nhập giá trị hiện tại')
    .refine(
      (v) => /^\d+$/.test(v) && Number(v) >= 0,
      'Giá trị hiện tại phải là số nguyên ≥ 0',
    ),
  // Optional, only meaningful for SAVINGS. Empty string → null on server side.
  interestRate: z
    .union([
      z.literal(''),
      z.string().regex(/^\d+(\.\d+)?$/, 'Lãi suất không hợp lệ'),
    ])
    .optional(),
  maturityDate: z.union([z.literal(''), z.iso.date()]).optional(),
  notes: z.string().max(500).optional(),
});

export type AssetFormValues = z.infer<typeof assetFormSchema>;
