'use client';

import { useMemo } from 'react';
import { useWatch, useFieldArray, useFormContext } from 'react-hook-form';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import { alpha } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { Field } from 'src/components/hook-form';
import { Iconify } from 'src/components/iconify';

import {
  GRATITUDE_TARGET,
  GRATITUDE_ACCENT,
  GRATITUDE_MAX_ITEMS,
  GRATITUDE_ITEM_MAX_LEN,
  GRATITUDE_PLACEHOLDERS,
} from '../constants/gratitude';

// ----------------------------------------------------------------------

// Reusable numbered list-of-gratitude-items editor. Drives the RHF field array
// `items` (shape: { value: string }[]). Used by the today form + the edit dialog.
type Props = { label?: string };

export function GratitudeItemsEditor({ label = 'Hôm nay bạn biết ơn điều gì?' }: Props) {
  const {
    control,
    formState: { errors },
  } = useFormContext();

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  const watched = useWatch({ control, name: 'items' });
  const filledCount = useMemo(
    () =>
      (watched ?? []).filter((r: { value?: string }) => (r?.value ?? '').trim().length > 0).length,
    [watched]
  );
  const reached = filledCount >= GRATITUDE_TARGET;

  const itemsError = errors.items as { message?: string; root?: { message?: string } } | undefined;
  const rootError = itemsError?.message ?? itemsError?.root?.message;

  return (
    <Stack spacing={2}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography variant="subtitle2" color="text.secondary">
          {label}
        </Typography>
        <Chip
          size="small"
          label={`${filledCount}/${GRATITUDE_TARGET}`}
          color={reached ? 'success' : 'default'}
          variant={reached ? 'filled' : 'outlined'}
          icon={<Iconify icon={reached ? 'solar:check-circle-bold' : 'solar:pen-bold'} width={16} />}
        />
      </Stack>

      <Stack spacing={{ xs: 1.25, sm: 1.5 }}>
        {fields.map((field, index) => {
          const removable = fields.length > GRATITUDE_TARGET;
          return (
            <Stack
              key={field.id}
              direction="row"
              alignItems="flex-start"
              spacing={{ xs: 1, sm: 1.5 }}
            >
              <Box
                sx={{
                  mt: 1,
                  width: 26,
                  height: 26,
                  flexShrink: 0,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: 13,
                  color: GRATITUDE_ACCENT,
                  bgcolor: alpha(GRATITUDE_ACCENT, 0.16),
                }}
              >
                {index + 1}
              </Box>
              <Field.Text
                name={`items.${index}.value`}
                placeholder={GRATITUDE_PLACEHOLDERS[index] ?? 'Một điều bạn biết ơn...'}
                multiline
                size="small"
                fullWidth
                inputProps={{ maxLength: GRATITUDE_ITEM_MAX_LEN }}
              />
              {/* Only show delete once a row is removable — keeps the base 5 rows
                  uncluttered on narrow screens. */}
              {removable && (
                <IconButton
                  size="small"
                  aria-label="Xoá dòng"
                  sx={{ mt: 0.25, color: 'text.disabled', '&:hover': { color: 'error.main' } }}
                  onClick={() => remove(index)}
                >
                  <Iconify icon="solar:trash-bin-trash-bold" width={18} />
                </IconButton>
              )}
            </Stack>
          );
        })}
      </Stack>

      {rootError && (
        <Typography variant="caption" color="error">
          {rootError}
        </Typography>
      )}

      <Button
        color="inherit"
        startIcon={<Iconify icon="solar:add-circle-bold" />}
        disabled={fields.length >= GRATITUDE_MAX_ITEMS}
        onClick={() => append({ value: '' })}
        sx={{ alignSelf: { xs: 'center', sm: 'flex-start' } }}
      >
        Thêm điều biết ơn
      </Button>
    </Stack>
  );
}
