'use client';

import { useFormContext, Controller } from 'react-hook-form';

import Box from '@mui/material/Box';

type Props = {
  name: string;
};

const OPTIONS: { value: 'expense' | 'income'; label: string; sign: string }[] = [
  { value: 'expense', label: 'Chi', sign: '−' },
  { value: 'income', label: 'Thu', sign: '+' },
];

// Two-state toggle for transaction type. Rendered as two adjacent chips so it
// reads as a binary choice (Chi / Thu) rather than a generic select.
export function TypeToggle({ name }: Props) {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <Box sx={{ display: 'inline-flex', gap: 1 }}>
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
