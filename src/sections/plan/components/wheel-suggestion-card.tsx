'use client';

import type { WheelSuggestion } from 'src/lib/ai/wheel-types';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import { useTheme } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { Iconify } from 'src/components/iconify';

import { LIFE_AREA_ICON, LIFE_AREA_LABEL, LIFE_AREA_COLOR } from '../constants/life-area';

// ----------------------------------------------------------------------

type Props = {
  suggestion: WheelSuggestion;
  score: number;
  onCreateTask: (suggestion: WheelSuggestion, taskTitle: string) => void;
  /** Key of the task currently being created — `${area}-${title}` */
  creatingKey: string | null;
};

// Depth labels matching the prompt's 3-tier task structure.
const TASK_TIER_LABELS = ['Hôm nay', 'Hằng tuần', 'Dài hạn'];

export function WheelSuggestionCard({ suggestion, score, onCreateTask, creatingKey }: Props) {
  const theme = useTheme();
  const color = theme.palette[LIFE_AREA_COLOR[suggestion.area]].main;

  // New assessments carry 2-3 options; old stored ones a single legacy title.
  const taskOptions = suggestion.recommendedTasks?.length
    ? suggestion.recommendedTasks
    : suggestion.recommendedTaskTitle
      ? [suggestion.recommendedTaskTitle]
      : [];

  const showTierLabels = taskOptions.length === 3;

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

      <Typography variant="body2" color="text.secondary">
        {suggestion.message}
      </Typography>

      {suggestion.reason && (
        <Stack direction="row" spacing={0.75} alignItems="flex-start">
          <Iconify
            icon="solar:chart-square-outline"
            width={14}
            sx={{ color: 'text.disabled', flexShrink: 0, mt: '2px' }}
          />
          <Typography variant="caption" color="text.disabled" sx={{ lineHeight: 1.5 }}>
            {suggestion.reason}
          </Typography>
        </Stack>
      )}

      {taskOptions.length > 0 && (
        <Stack spacing={0.75} sx={{ mt: 'auto' }}>
          {taskOptions.map((title, idx) => {
            const isCreating = creatingKey === `${suggestion.area}-${title}`;
            return (
              <Box
                key={title}
                sx={{
                  p: 0.75,
                  pl: 1.25,
                  borderRadius: 1,
                  bgcolor: 'background.neutral',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  {showTierLabels && (
                    <Typography
                      variant="caption"
                      sx={{
                        display: 'block',
                        color,
                        fontWeight: 600,
                        fontSize: 10,
                        lineHeight: 1.2,
                      }}
                    >
                      {TASK_TIER_LABELS[idx]}
                    </Typography>
                  )}
                  <Typography variant="caption" sx={{ lineHeight: 1.4 }}>
                    {title}
                  </Typography>
                </Box>
                <IconButton
                  size="small"
                  aria-label="Thêm task này vào kế hoạch"
                  disabled={creatingKey !== null}
                  onClick={() => onCreateTask(suggestion, title)}
                  sx={{ color, flexShrink: 0 }}
                >
                  {isCreating ? (
                    <CircularProgress size={16} sx={{ color }} />
                  ) : (
                    <Iconify icon="solar:add-circle-bold" width={20} />
                  )}
                </IconButton>
              </Box>
            );
          })}
        </Stack>
      )}
    </Card>
  );
}
