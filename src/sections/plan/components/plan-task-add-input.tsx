'use client';

import type { TaskPriority } from '@prisma/client';

import { toast } from 'sonner';
import { memo, useState, useTransition } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import TextField from '@mui/material/TextField';
import { useTheme } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import ToggleButton from '@mui/material/ToggleButton';
import CircularProgress from '@mui/material/CircularProgress';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

// NOTE: Don't wrap ToggleButton in Tooltip here — ToggleButtonGroup clones
// its direct ToggleButton children to inject `selected`. Wrapping in Tooltip
// breaks that and produces a "click twice to select" bug.

import { Iconify } from 'src/components/iconify';

import { addTask } from '../actions/plan-task-actions';
import {
  TASK_PRIORITY_ICON,
  TASK_PRIORITY_ORDER,
  TASK_PRIORITY_LABEL,
  TASK_PRIORITY_COLOR,
} from '../constants/task-priority';

// ----------------------------------------------------------------------

// Memoized priority row — only re-renders when `value` or `disabled` changes.
// Prevents the 4 ToggleButtons + tooltips from re-evaluating their sx callbacks
// on every keystroke in the title field, which caused perceived typing lag.
const PriorityRow = memo(function PriorityRow({
  value,
  onChange,
  disabled,
}: {
  value: TaskPriority | null;
  onChange: (v: TaskPriority | null) => void;
  disabled: boolean;
}) {
  const theme = useTheme();

  const getColor = (p: TaskPriority) => {
    const key = TASK_PRIORITY_COLOR[p];
    return key === 'default' ? theme.palette.text.disabled : theme.palette[key].main;
  };

  return (
    <ToggleButtonGroup
      value={value}
      exclusive
      onChange={(_, v: TaskPriority | null) => onChange(v)}
      size="small"
      disabled={disabled}
      sx={{ flexWrap: 'wrap', gap: 0.5 }}
    >
      {TASK_PRIORITY_ORDER.map((p) => (
        <ToggleButton
          key={p}
          value={p}
          sx={{
            gap: 0.5,
            border: `1px solid ${theme.palette.divider}`,
            textTransform: 'none',
            '&.Mui-selected': {
              bgcolor: `${getColor(p)}18`,
              borderColor: getColor(p),
              color: getColor(p),
            },
          }}
        >
          <Iconify icon={TASK_PRIORITY_ICON[p]} width={16} sx={{ color: getColor(p) }} />
          <Typography variant="caption" sx={{ color: 'inherit' }}>
            {TASK_PRIORITY_LABEL[p]}
          </Typography>
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
});

// ----------------------------------------------------------------------

type Props = {
  planId: string;
};

export function PlanTaskAddInput({ planId }: Props) {
  const theme = useTheme();
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<TaskPriority | null>(null);

  const trimmedLen = title.trim().length;
  const canSubmit = trimmedLen > 0 && priority !== null && !isPending;

  const handleSubmit = () => {
    if (!canSubmit || priority === null) return;

    const trimmedTitle = title.trim();
    startTransition(async () => {
      try {
        await addTask(planId, { title: trimmedTitle, priority });
        setTitle('');
        setPriority(null);
      } catch {
        toast.error('Không thể thêm việc. Vui lòng thử lại.');
      }
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && canSubmit) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <Box
      sx={{
        mt: 3,
        pt: 2,
        borderTop: `1px solid ${theme.palette.divider}`,
      }}
    >
      <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
        + Thêm việc cần làm
      </Typography>

      <Stack spacing={1.5}>
        {/* Title input */}
        <TextField
          fullWidth
          size="small"
          placeholder="Tên việc cần làm..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isPending}
          slotProps={{ htmlInput: { maxLength: 200 } }}
        />

        {/* Priority picker + submit row */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <PriorityRow value={priority} onChange={setPriority} disabled={isPending} />

          <Tooltip title={!canSubmit ? 'Nhập tên và chọn độ ưu tiên' : 'Thêm việc'}>
            <span>
              <IconButton
                color="primary"
                disabled={!canSubmit}
                onClick={handleSubmit}
                sx={{ flexShrink: 0 }}
              >
                {isPending ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <Iconify icon="solar:add-circle-bold" />
                )}
              </IconButton>
            </span>
          </Tooltip>
        </Box>

        {/* Helper line — fixed height to avoid layout shift on every keystroke. */}
        <Typography
          variant="caption"
          color="text.disabled"
          sx={{ minHeight: 18, display: 'block' }}
        >
          {priority === null && trimmedLen > 0 ? 'Vui lòng chọn độ ưu tiên trước khi thêm' : ''}
        </Typography>
      </Stack>
    </Box>
  );
}
