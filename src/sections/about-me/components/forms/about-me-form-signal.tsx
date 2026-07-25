'use client';

import Stack from '@mui/material/Stack';

import { Field } from 'src/components/hook-form';

import { SIGNAL_KIND_LABELS } from '../../constants/about-me-copy';

// ----------------------------------------------------------------------

const KIND_OPTIONS = [
  { label: SIGNAL_KIND_LABELS.positive, value: 'positive' },
  { label: SIGNAL_KIND_LABELS.negative, value: 'negative' },
];

export function AboutMeFormSignal() {
  return (
    <Stack spacing={2.5}>
      <Field.Text
        name="title"
        label="Tiêu đề (tuỳ chọn)"
        placeholder="Tự động: Tín hiệu DD/MM/YYYY nếu để trống"
        inputProps={{ maxLength: 120 }}
      />

      <Field.RadioGroup name="metadata.kind" label="Loại tín hiệu" options={KIND_OPTIONS} row />

      <Field.Text
        name="metadata.trigger"
        label="Trigger"
        placeholder="Điều gì đã kích hoạt cảm xúc này?"
        inputProps={{ maxLength: 200 }}
        required
      />

      <Field.Text
        name="metadata.emotion"
        label="Cảm xúc"
        placeholder="Bạn cảm thấy gì? (vd: tức giận, vui mừng...)"
        inputProps={{ maxLength: 100 }}
        required
      />

      <Field.Text
        name="metadata.meaning"
        label="Ý nghĩa (tuỳ chọn)"
        placeholder="Tín hiệu này có nghĩa gì với bạn?"
        inputProps={{ maxLength: 500 }}
        multiline
        rows={2}
      />

      <Field.Text
        name="metadata.action"
        label="Hành động (tuỳ chọn)"
        placeholder="Bạn sẽ làm gì tiếp theo?"
        inputProps={{ maxLength: 500 }}
        multiline
        rows={2}
      />
    </Stack>
  );
}
