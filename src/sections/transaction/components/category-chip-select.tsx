'use client';

import type { IconifyName } from 'src/components/iconify';

import { Controller, useFormContext } from 'react-hook-form';

import Box from '@mui/material/Box';
import FormHelperText from '@mui/material/FormHelperText';

import { Iconify } from 'src/components/iconify';

type Category = { id: string; name: string; icon: string; color: string };

type Props = {
  name: string;
  categories: Category[];
};

// Single-select chip group with Iconify glyph + colored background.
// Matches the "quick category chip" design from Add Transaction mockup.
export function CategoryChipSelect({ name, categories }: Props) {
  const {
    control,
    formState: { errors },
  } = useFormContext();

  const error = errors[name]?.message as string | undefined;

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <Box>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {categories.map((c) => {
              const selected = field.value === c.id;
              return (
                <Box
                  key={c.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => field.onChange(c.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      field.onChange(c.id);
                    }
                  }}
                  sx={{
                    px: 1.5,
                    height: 40,
                    gap: 1,
                    display: 'inline-flex',
                    alignItems: 'center',
                    borderRadius: 1,
                    cursor: 'pointer',
                    border: '0.5px solid',
                    borderColor: selected ? c.color : 'divider',
                    color: selected ? c.color : 'text.primary',
                    bgcolor: selected ? `${c.color}1a` : 'transparent',
                    fontWeight: selected ? 500 : 400,
                    fontSize: 14,
                    transition: 'all 120ms ease',
                  }}
                >
                  <Iconify icon={c.icon as IconifyName} width={18} />
                  {c.name}
                </Box>
              );
            })}
          </Box>
          {!!error && (
            <FormHelperText error sx={{ mt: 1 }}>
              {error}
            </FormHelperText>
          )}
        </Box>
      )}
    />
  );
}
