'use client';

import type { AboutMeRow } from '../../types';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { Field } from 'src/components/hook-form';

// ----------------------------------------------------------------------

type Props = {
  lessonOptions: AboutMeRow[];
};

export function AboutMeFormPrinciple({ lessonOptions }: Props) {
  return (
    <Stack spacing={2.5}>
      <Field.Text
        name="title"
        label="Tiêu chuẩn / Nguyên tắc"
        placeholder="Niềm tin định hướng bạn..."
        inputProps={{ maxLength: 120 }}
        required
      />

      <Box>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Nội dung chi tiết
        </Typography>
        <Field.Editor
          name="content"
          placeholder="Giải thích nguyên tắc này và lý do bạn tin vào nó..."
        />
      </Box>

      <Field.Autocomplete
        name="metadata.derivedFromLessonId"
        label="Rút ra từ bài học (tuỳ chọn)"
        placeholder="Chọn bài học liên quan..."
        options={lessonOptions.map((r) => ({ label: r.title, value: r.id }))}
        isOptionEqualToValue={(option, value) =>
          (option as { value: string }).value === (value as { value: string }).value
        }
        getOptionLabel={(option) =>
          typeof option === 'string' ? option : (option as { label: string }).label
        }
      />
    </Stack>
  );
}
