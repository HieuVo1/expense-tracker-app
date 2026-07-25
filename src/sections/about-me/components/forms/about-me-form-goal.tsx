'use client';

import { useWatch, useFormContext } from 'react-hook-form';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';

import { Field } from 'src/components/hook-form';

import { GOAL_KIND_LABELS, GOAL_STATUS_LABELS } from '../../constants/about-me-copy';

// ----------------------------------------------------------------------

const KIND_OPTIONS = [
  { label: GOAL_KIND_LABELS.short, value: 'short' },
  { label: GOAL_KIND_LABELS.long, value: 'long' },
  { label: GOAL_KIND_LABELS.dream, value: 'dream' },
];

const PROGRESS_MARKS = [
  { value: 0, label: '0%' },
  { value: 25, label: '25%' },
  { value: 50, label: '50%' },
  { value: 75, label: '75%' },
  { value: 100, label: '100%' },
];

// ----------------------------------------------------------------------

export function AboutMeFormGoal() {
  const { control } = useFormContext();
  const status = useWatch({ control, name: 'metadata.status' });
  const showProgress = status === 'active';

  return (
    <Stack spacing={2.5}>
      <Field.Text
        name="title"
        label="Mục tiêu"
        placeholder="Mục tiêu của bạn..."
        inputProps={{ maxLength: 120 }}
        required
      />

      <Field.RadioGroup name="metadata.kind" label="Loại mục tiêu" options={KIND_OPTIONS} row />

      <Field.DatePicker
        name="metadata.targetDate"
        label="Hạn (tuỳ chọn)"
        slotProps={{ textField: { fullWidth: true, size: 'small' } }}
      />

      <Field.Select name="metadata.status" label="Trạng thái">
        {Object.entries(GOAL_STATUS_LABELS).map(([value, label]) => (
          <MenuItem key={value} value={value}>
            {label}
          </MenuItem>
        ))}
      </Field.Select>

      {showProgress && (
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Tiến độ (%)
          </Typography>
          <Field.Slider
            name="metadata.progress"
            min={0}
            max={100}
            step={5}
            marks={PROGRESS_MARKS}
            valueLabelDisplay="auto"
            valueLabelFormat={(v) => `${v}%`}
          />
        </Box>
      )}
    </Stack>
  );
}
