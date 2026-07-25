'use client';

import { Controller, useFormContext } from 'react-hook-form';

import Box from '@mui/material/Box';

import {
  TRANSACTION_TYPES,
  TRANSACTION_TYPE_SIGN,
  TRANSACTION_TYPE_LABEL,
} from '../lib/transaction-type';

type Props = {
  name: string;
};

const OPTIONS = TRANSACTION_TYPES.map((value) => ({
  value,
  label: TRANSACTION_TYPE_LABEL[value],
  sign: TRANSACTION_TYPE_SIGN[value],
}));

// Toggle for transaction type. Rendered as adjacent chips so it reads as a
// small fixed set (Chi / Thu / Đầu tư) rather than a generic select. Wraps on
// narrow screens so the third chip never overflows the dialog.
export function TypeToggle({ name }: Props) {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {OPTIONS.map((opt) => {
            const selected = field.value === opt.value;
            return (
              <Box
                key={opt.value}
                role="button"
                tabIndex={0}
                onClick={() => field.onChange(opt.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    field.onChange(opt.value);
                  }
                }}
                sx={{
                  px: 2,
                  height: 40,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.75,
                  borderRadius: 1,
                  cursor: 'pointer',
                  border: '0.5px solid',
                  borderColor: selected ? 'primary.main' : 'divider',
                  bgcolor: selected ? 'primary.main' : 'transparent',
                  color: selected ? 'primary.contrastText' : 'text.primary',
                  fontWeight: 500,
                  fontSize: 14,
                  transition: 'all 120ms ease',
                }}
              >
                <span aria-hidden>{opt.sign}</span>
                {opt.label}
              </Box>
            );
          })}
        </Box>
      )}
    />
  );
}
