'use client';

import Stack from '@mui/material/Stack';
import MenuItem from '@mui/material/MenuItem';

import { Field } from 'src/components/hook-form';

import { ACTION_STATUS_LABELS } from '../../constants/about-me-copy';

// ----------------------------------------------------------------------

export function AboutMeFormAction() {
  return (
    <Stack spacing={2.5}>
      <Field.Text
        name="title"
        label="Hành động cam kết"
        placeholder="Bạn cam kết làm gì?"
        inputProps={{ maxLength: 120 }}
        required
      />

      <Field.Select name="metadata.status" label="Trạng thái">
        {Object.entries(ACTION_STATUS_LABELS).map(([value, label]) => (
          <MenuItem key={value} value={value}>
            {label}
          </MenuItem>
        ))}
      </Field.Select>

      <Field.DatePicker
        name="metadata.dueDate"
        label="Hạn thực hiện (tuỳ chọn)"
        slotProps={{ textField: { fullWidth: true, size: 'small' } }}
      />
    </Stack>
  );
}
