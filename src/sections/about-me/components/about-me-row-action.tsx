'use client';

import type { AboutMeRow, ActionMetadata } from '../types';

import { useState, useTransition } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Checkbox from '@mui/material/Checkbox';
import Typography from '@mui/material/Typography';

import { fDate } from 'src/utils/format-time';

import { ACTION_STATUS_LABELS } from '../constants/about-me-copy';
import { toggleActionStatus } from '../actions/about-me-action-status';

// ----------------------------------------------------------------------

type Props = { row: AboutMeRow; onClick: () => void };

export function AboutMeRowAction({ row, onClick }: Props) {
  const meta = row.metadata as Partial<ActionMetadata> | null;
  const status = (meta?.status ?? 'planned') as ActionMetadata['status'];
  const dueDate = meta?.dueDate;

  const [optimisticStatus, setOptimisticStatus] = useState(status);
  const [isPending, startTransition] = useTransition();

  const isDone = optimisticStatus === 'done';

  const handleCheck = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next: ActionMetadata['status'] = isDone ? 'planned' : 'done';
    setOptimisticStatus(next);
    startTransition(async () => {
      try {
        await toggleActionStatus(row.id, next);
      } catch {
        setOptimisticStatus(status);
      }
    });
  };

  return (
    <Box
      sx={{
        p: 1.5,
        borderRadius: 2,
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: '0 1px 2px 0 rgba(145, 158, 171, 0.08)',
        opacity: isPending ? 0.6 : 1,
        transition: 'transform 0.15s, box-shadow 0.15s, border-color 0.15s, opacity 0.15s',
        '&:hover': {
          transform: 'translateY(-1px)',
          boxShadow: '0 6px 16px -4px rgba(145, 158, 171, 0.16)',
          borderColor: 'transparent',
        },
        cursor: 'pointer',
      }}
    >
      <Stack direction="row" alignItems="center" gap={1}>
        <Checkbox
          size="small"
          checked={isDone}
          onClick={handleCheck}
          aria-label={`Đánh dấu ${row.title} là ${isDone ? 'chưa hoàn thành' : 'hoàn thành'}`}
          sx={{ p: 0.5, flexShrink: 0 }}
        />

        <Box
          sx={{ flex: 1, minWidth: 0 }}
          role="button"
          tabIndex={0}
          onClick={onClick}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') onClick();
          }}
          aria-label={`Xem chi tiết: ${row.title}`}
        >
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 500,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              lineHeight: 1.4,
              textDecoration: isDone ? 'line-through' : 'none',
              color: isDone ? 'text.disabled' : 'text.primary',
            }}
          >
            {row.title}
          </Typography>
          <Stack direction="row" alignItems="center" gap={1}>
            <Typography variant="caption" color="text.secondary">
              {ACTION_STATUS_LABELS[optimisticStatus]}
            </Typography>
            {dueDate && (
              <Typography variant="caption" color="text.disabled" className="tabular">
                · {fDate(dueDate)}
              </Typography>
            )}
          </Stack>
        </Box>
      </Stack>
    </Box>
  );
}
