'use client';

import type { WheelSuggestion } from 'src/lib/ai/wheel-types';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { Iconify } from 'src/components/iconify';

import {
  LIFE_AREA_ICON,
  LIFE_AREA_LABEL,
  LIFE_AREA_COLOR,
} from '../constants/life-area';

// ----------------------------------------------------------------------

type Props = {
  suggestion: WheelSuggestion;
  score: number;
  onCreateTask: (suggestion: WheelSuggestion) => void;
  isCreating: boolean;
};

export function WheelSuggestionCard({ suggestion, score, onCreateTask, isCreating }: Props) {
  const theme = useTheme();
  const color = theme.palette[LIFE_AREA_COLOR[suggestion.area]].main;

  return (
    <Card
      sx={{
        p: 2,
        borderLeft: `4px solid ${color}`,
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1.5}>
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: `${color}18`,
            flexShrink: 0,
          }}
        >
          <Iconify icon={LIFE_AREA_ICON[suggestion.area]} width={20} sx={{ color }} />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle2" sx={{ lineHeight: 1.25 }}>
            {LIFE_AREA_LABEL[suggestion.area]}
          </Typography>
          <Typography variant="caption" sx={{ color, fontWeight: 600 }}>
            {score}/10
          </Typography>
        </Box>
      </Stack>

      <Typography
        variant="body2"
        color="text.secondary"
        sx={{
          display: '-webkit-box',
          WebkitLineClamp: 4,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {suggestion.message}
      </Typography>

      {suggestion.recommendedTaskTitle && (
        <Box
          sx={{
            mt: 'auto',
            p: 1.25,
            borderRadius: 1,
            bgcolor: 'background.neutral',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <Iconify
            icon="solar:add-circle-bold"
            width={16}
            sx={{ color: 'text.secondary', flexShrink: 0 }}
          />
          <Typography variant="caption" sx={{ flex: 1, minWidth: 0, lineHeight: 1.4 }}>
            {suggestion.recommendedTaskTitle}
          </Typography>
        </Box>
      )}

      <Button
        size="small"
        variant="outlined"
        disabled={isCreating}
        onClick={() => onCreateTask(suggestion)}
        startIcon={
          isCreating ? (
            <CircularProgress size={14} />
          ) : (
            <Iconify icon="solar:add-circle-bold" width={16} />
          )
        }
        sx={{ alignSelf: 'flex-start', borderColor: color, color }}
      >
        Thêm task gợi ý
      </Button>
    </Card>
  );
}
