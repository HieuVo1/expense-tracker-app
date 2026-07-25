'use client';

import type { AboutMeRow, GoalMetadata } from '../types';

import { useState, useTransition } from 'react';

import Box from '@mui/material/Box';
import Menu from '@mui/material/Menu';
import Stack from '@mui/material/Stack';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import LinearProgress from '@mui/material/LinearProgress';

import { fDate } from 'src/utils/format-time';

import { Iconify } from 'src/components/iconify';

import { toggleActionStatus } from '../actions/about-me-action-status';
import { GOAL_KIND_CHIP, GOAL_KIND_LABELS, GOAL_STATUS_LABELS } from '../constants/about-me-copy';

// ----------------------------------------------------------------------

const GOAL_STATUSES: GoalMetadata['status'][] = ['active', 'achieved', 'paused', 'abandoned'];

function GoalKindChip({ kind }: { kind: GoalMetadata['kind'] }) {
  const { bg, fg } = GOAL_KIND_CHIP[kind];
  return (
    <Box
      component="span"
      sx={{
        fontSize: 10,
        fontWeight: 600,
        px: 0.75,
        py: 0.125,
        borderRadius: 0.5,
        bgcolor: bg,
        color: fg,
        flexShrink: 0,
        lineHeight: 1.8,
      }}
    >
      {GOAL_KIND_LABELS[kind]}
    </Box>
  );
}

// ----------------------------------------------------------------------

type Props = { row: AboutMeRow; onClick: () => void };

export function AboutMeRowGoal({ row, onClick }: Props) {
  const meta = row.metadata as Partial<GoalMetadata> | null;
  const kind = (meta?.kind ?? 'short') as GoalMetadata['kind'];
  const status = (meta?.status ?? 'active') as GoalMetadata['status'];
  const progress = meta?.progress;
  const targetDate = meta?.targetDate;
  const showProgress = status === 'active' && progress != null;

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [optimisticStatus, setOptimisticStatus] = useState(status);
  const [isPending, startTransition] = useTransition();

  const handleStatusChange = (newStatus: GoalMetadata['status']) => {
    setAnchorEl(null);
    setOptimisticStatus(newStatus);
    startTransition(async () => {
      try {
        await toggleActionStatus(row.id, newStatus);
      } catch {
        setOptimisticStatus(status); // revert on error
      }
    });
  };

  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 2,
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: '0 1px 2px 0 rgba(145, 158, 171, 0.08)',
        opacity: isPending ? 0.7 : 1,
        transition: 'transform 0.15s, box-shadow 0.15s, border-color 0.15s, opacity 0.15s',
        '&:hover': {
          transform: 'translateY(-1px)',
          boxShadow: '0 6px 16px -4px rgba(145, 158, 171, 0.16)',
          borderColor: 'transparent',
        },
      }}
    >
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" gap={1}>
        {/* Title + kind chip — click area */}
        <Box
          sx={{ flex: 1, minWidth: 0, cursor: 'pointer' }}
          onClick={onClick}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') onClick();
          }}
          aria-label={`Xem chi tiết: ${row.title}`}
        >
          <Stack direction="row" alignItems="center" gap={0.75} sx={{ mb: 0.5 }}>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 600,
                flex: 1,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                lineHeight: 1.4,
              }}
            >
              {row.title}
            </Typography>
            <GoalKindChip kind={kind} />
          </Stack>

          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="caption" color="text.secondary">
              {GOAL_STATUS_LABELS[optimisticStatus]}
            </Typography>
            {targetDate && (
              <Typography variant="caption" color="text.disabled" className="tabular">
                {fDate(targetDate)}
              </Typography>
            )}
          </Stack>

          {showProgress && (
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{ height: 4, borderRadius: 1, mt: 0.5, bgcolor: 'divider' }}
            />
          )}
        </Box>

        {/* Status menu trigger */}
        <IconButton
          size="small"
          aria-label="Thay đổi trạng thái mục tiêu"
          onClick={(e) => {
            e.stopPropagation();
            setAnchorEl(e.currentTarget);
          }}
          sx={{ mt: -0.5, flexShrink: 0 }}
        >
          <Iconify icon="eva:more-vertical-fill" width={16} />
        </IconButton>
      </Stack>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        {GOAL_STATUSES.map((s) => (
          <MenuItem
            key={s}
            selected={optimisticStatus === s}
            onClick={() => handleStatusChange(s)}
            sx={{ fontSize: 13 }}
          >
            {GOAL_STATUS_LABELS[s]}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
}
