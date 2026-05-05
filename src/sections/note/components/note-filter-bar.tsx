'use client';

import type { NoteType } from '@prisma/client';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';

import { Iconify } from 'src/components/iconify';

import { NOTE_TYPE_LABELS, NOTE_TYPE_VALUES, NOTE_TYPE_COLORS } from '../constants/note-types';

// ----------------------------------------------------------------------

type ActiveType = NoteType | 'all';

type NoteFilterBarProps = {
  activeType: ActiveType;
  query: string;
  allTags: string[];
  selectedTags: string[];
  onTypeChange: (type: ActiveType) => void;
  onQueryChange: (q: string) => void;
  onTagsChange: (tags: string[]) => void;
};

export function NoteFilterBar({
  activeType,
  query,
  allTags,
  selectedTags,
  onTypeChange,
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
      {/* Type chips */}
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Chip
          label="Tất cả"
          variant={activeType === 'all' ? 'filled' : 'outlined'}
          onClick={() => onTypeChange('all')}
          sx={{ fontWeight: activeType === 'all' ? 'fontWeightBold' : 'fontWeightRegular' }}
        />
        {NOTE_TYPE_VALUES.map((type) => (
          <Chip
            key={type}
            label={NOTE_TYPE_LABELS[type]}
            variant={activeType === type ? 'filled' : 'outlined'}
            onClick={() => onTypeChange(type)}
            sx={{
              fontWeight: activeType === type ? 'fontWeightBold' : 'fontWeightRegular',
              ...(activeType === type && {
                backgroundColor: NOTE_TYPE_COLORS[type],
                color: '#fff',
                '&:hover': { backgroundColor: NOTE_TYPE_COLORS[type], opacity: 0.9 },
              }),
            }}
          />
        ))}
      </Box>

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
            <Iconify icon="solar:tag-horizontal-bold-duotone" width={16} sx={{ color: 'text.secondary' }} />
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
