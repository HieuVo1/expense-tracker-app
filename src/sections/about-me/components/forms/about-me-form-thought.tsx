'use client';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { Field } from 'src/components/hook-form';

// ----------------------------------------------------------------------

export function AboutMeFormThought() {
  return (
    <Stack spacing={2.5}>
      <Field.Text
        name="title"
        label="Tiêu đề (tuỳ chọn)"
        placeholder="Tự động: Suy nghĩ DD/MM/YYYY nếu để trống"
        inputProps={{ maxLength: 120 }}
      />

      <Box>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Nội dung
        </Typography>
        <Field.Editor name="content" placeholder="Ghi lại điều đang trong đầu bạn..." />
      </Box>
    </Stack>
  );
}
