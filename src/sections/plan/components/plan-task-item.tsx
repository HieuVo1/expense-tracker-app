'use client';

import type { TaskPriority } from '@prisma/client';
import type { PlanTaskRow } from '../types';

import { useRef, useState } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Checkbox from '@mui/material/Checkbox';
import TextField from '@mui/material/TextField';
import { useTheme } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { fDate } from 'src/utils/format-time';

import { Iconify } from 'src/components/iconify';

import { PlanTaskPriorityMenu } from './plan-task-priority-menu';
import {
  TASK_PRIORITY_ICON,
  TASK_PRIORITY_LABEL,
  TASK_PRIORITY_COLOR,
} from '../constants/task-priority';

// ----------------------------------------------------------------------

type Props = {
  task: PlanTaskRow;
  onToggle: (id: string, isDone: boolean) => void;
  onRename: (id: string, title: string) => void;
  onChangePriority: (id: string, priority: TaskPriority) => void;
  onDelete: (id: string) => void;
};

export function PlanTaskItem({ task, onToggle, onRename, onChangePriority, onDelete }: Props) {
  const theme = useTheme();
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(task.title);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const priorityColor = TASK_PRIORITY_COLOR[task.priority];
  const chipColor = priorityColor === 'default' ? theme.palette.text.disabled : theme.palette[priorityColor].main;

  const handleStartEdit = () => {
    setEditValue(task.title);
    setEditing(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleSave = () => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== task.title) {
      onRename(task.id, trimmed);
    }
    setEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); handleSave(); }
    if (e.key === 'Escape') { setEditing(false); setEditValue(task.title); }
  };

  return (
    <Stack
      direction="row"
      alignItems="flex-start"
      spacing={0.5}
      sx={{
        py: 0.5,
        opacity: task.isDone ? 0.55 : 1,
        transition: 'opacity 0.15s',
      }}
    >
      {/* Checkbox */}
      <Checkbox
        size="small"
        checked={task.isDone}
        onChange={(e) => onToggle(task.id, e.target.checked)}
        sx={{ mt: -0.25, flexShrink: 0 }}
      />

      {/* Title / edit field */}
      <Box sx={{ flex: 1, minWidth: 0, pt: 0.75 }}>
        {editing ? (
          <TextField
            inputRef={inputRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            size="small"
            fullWidth
            variant="standard"
            slotProps={{ htmlInput: { maxLength: 200 } }}
          />
        ) : (
          <Typography
            variant="body2"
            onClick={handleStartEdit}
            sx={{
              cursor: 'pointer',
              wordBreak: 'break-word',
              textDecoration: task.isDone ? 'line-through' : 'none',
              '&:hover': { textDecoration: task.isDone ? 'line-through' : 'underline' },
            }}
          >
            {task.title}
          </Typography>
        )}

        {/* Due date */}
        {task.dueDate && (
          <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 0.25 }}>
            {fDate(task.dueDate, 'DD/MM/YYYY')}
          </Typography>
        )}
      </Box>

      {/* Priority chip */}
      <Chip
        icon={<Iconify icon={TASK_PRIORITY_ICON[task.priority]} width={14} sx={{ color: chipColor }} />}
        label={TASK_PRIORITY_LABEL[task.priority]}
        size="small"
        onClick={(e) => setMenuAnchor(e.currentTarget)}
        sx={{
          flexShrink: 0,
          fontSize: '0.65rem',
          height: 22,
          cursor: 'pointer',
          color: chipColor,
          bgcolor: `${chipColor}18`,
          border: `1px solid ${chipColor}40`,
          '& .MuiChip-icon': { ml: 0.5 },
        }}
      />

      {/* Priority menu */}
      <PlanTaskPriorityMenu
        anchorEl={menuAnchor}
        current={task.priority}
        onSelect={(p) => onChangePriority(task.id, p)}
        onClose={() => setMenuAnchor(null)}
      />

      {/* Delete button */}
      <IconButton
        size="small"
        onClick={() => onDelete(task.id)}
        sx={{ flexShrink: 0, color: 'text.disabled', '&:hover': { color: 'error.main' } }}
      >
        <Iconify icon="solar:trash-bin-trash-bold" width={16} />
      </IconButton>
    </Stack>
  );
}
