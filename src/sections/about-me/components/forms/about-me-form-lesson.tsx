'use client';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';

import { Field } from 'src/components/hook-form';

import { SOURCE_LABELS } from '../../constants/about-me-copy';

// ----------------------------------------------------------------------

export function AboutMeFormLesson() {
  return (
    <Stack spacing={2.5}>
      <Field.Text
        name="title"
        label="Tiêu đề bài học"
        placeholder="Bài học cốt lõi..."
        inputProps={{ maxLength: 120 }}
        required
      />

      <Field.Select name="metadata.source" label="Nguồn">
        {Object.entries(SOURCE_LABELS).map(([value, label]) => (
          <MenuItem key={value} value={value}>
            {label}
          </MenuItem>
        ))}
      </Field.Select>

      <Box>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Nội dung chi tiết
        </Typography>
        <Field.Editor name="content" placeholder="Mô tả bài học, ngữ cảnh, và cách áp dụng..." />
      </Box>
    </Stack>
  );
}
