'use client';

import type { AboutMeFormValues } from '../../schemas';

import { Controller, useFormContext } from 'react-hook-form';

import Chip from '@mui/material/Chip';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';

// Shared tags input — rendered once in AboutMeEditDialog so all 7 type-specific
// forms inherit it without each form re-implementing the field. Uses Autocomplete
// with freeSolo + multiple so users can type and press Enter to add a tag.
// Tags are normalised to lowercase + trimmed (Zod schema also enforces this).

const MAX_TAGS = 12;

export function AboutMeFormTags() {
  const { control } = useFormContext<AboutMeFormValues>();

  return (
    <Controller
      name="tags"
      control={control}
      render={({ field, fieldState }) => (
        <Autocomplete
          multiple
          freeSolo
          options={[]}
          value={field.value ?? []}
          onChange={(_, raw) => {
            const next = Array.from(
              new Set(
                (raw as string[])
                  .map((v) => v.trim().toLowerCase())
                  .filter(Boolean)
              )
            ).slice(0, MAX_TAGS);
            field.onChange(next);
          }}
          renderTags={(values, getTagProps) =>
            values.map((value, index) => {
              const tagProps = getTagProps({ index });
              return (
                <Chip
                  {...tagProps}
                  key={value}
                  label={`#${value}`}
                  size="small"
                  sx={{ height: 22, fontSize: 11 }}
                />
              );
            })
          }
          renderInput={(params) => (
            <TextField
              {...params}
              label="Tags"
              placeholder={
                (field.value?.length ?? 0) === 0
                  ? 'Thêm tag rồi nhấn Enter'
                  : ''
              }
              size="small"
              error={!!fieldState.error}
              helperText={
                fieldState.error?.message ??
                `Tối đa ${MAX_TAGS} tag · mỗi tag ≤32 ký tự`
              }
            />
          )}
          sx={{ mt: 2 }}
        />
      )}
    />
  );
}
