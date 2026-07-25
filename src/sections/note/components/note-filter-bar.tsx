'use client';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type NoteFilterBarProps = {
  query: string;
  allTags: string[];
  selectedTags: string[];
  onQueryChange: (q: string) => void;
  onTagsChange: (tags: string[]) => void;
};

export function NoteFilterBar({
  query,
  allTags,
  selectedTags,
  onQueryChange,
  onTagsChange,
}: NoteFilterBarProps) {
  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onTagsChange(selectedTags.filter((t) => t !== tag));
    } else {
      onTagsChange([...selectedTags, tag]);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Search box */}
      <TextField
        size="small"
        placeholder="Tìm kiếm theo tiêu đề hoặc nội dung..."
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
            </InputAdornment>
          ),
        }}
        sx={{ maxWidth: 400 }}
      />

      {/* Tag chips — only render when we have at least one tag */}
      {allTags.length > 0 && (
        <Stack spacing={1}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Iconify
              icon="solar:tag-horizontal-bold-duotone"
              width={16}
              sx={{ color: 'text.secondary' }}
            />
            <Typography variant="caption" color="text.secondary">
              Thẻ
            </Typography>
            {selectedTags.length > 0 && (
              <Chip
                size="small"
                label="Bỏ chọn"
                variant="outlined"
                onClick={() => onTagsChange([])}
              />
            )}
          </Stack>
          <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
            {allTags.map((tag) => {
              const active = selectedTags.includes(tag);
              return (
                <Chip
                  key={tag}
                  size="small"
                  label={`#${tag}`}
                  variant={active ? 'filled' : 'outlined'}
                  color={active ? 'primary' : 'default'}
                  onClick={() => toggleTag(tag)}
                />
              );
            })}
          </Box>
        </Stack>
      )}
    </Box>
  );
}
