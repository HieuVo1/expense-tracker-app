'use client';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { Field } from 'src/components/hook-form';

import { TRAIT_KIND_LABELS } from '../../constants/about-me-copy';

// ----------------------------------------------------------------------

const KIND_OPTIONS = [
  { label: TRAIT_KIND_LABELS.strength, value: 'strength' },
  { label: TRAIT_KIND_LABELS.weakness, value: 'weakness' },
];

export function AboutMeFormTrait() {
  return (
    <Stack spacing={2.5}>
      <Field.RadioGroup
        name="metadata.kind"
        label="Loại"
        options={KIND_OPTIONS}
        row
      />

      <Field.Text
        name="title"
        label="Tên đặc điểm"
        placeholder="Điểm mạnh hoặc điểm yếu của bạn..."
        inputProps={{ maxLength: 120 }}
        required
      />

      <Field.Text
        name="metadata.context"
        label="Ngữ cảnh (tuỳ chọn)"
        placeholder="Đặc điểm này xuất hiện khi nào?"
        inputProps={{ maxLength: 200 }}
        multiline
        rows={2}
      />

      <Box>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Ghi chú thêm (tuỳ chọn)
        </Typography>
        <Field.Editor name="content" placeholder="Mô tả chi tiết hơn về đặc điểm này..." />
      </Box>
    </Stack>
  );
}
