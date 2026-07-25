'use client';

import type { AboutMeRow, ActionMetadata } from '../types';

import { useTransition } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Checkbox from '@mui/material/Checkbox';
import Typography from '@mui/material/Typography';

import { fDate } from 'src/utils/format-time';

import { toggleActionStatus } from '../actions/about-me-action-status';

// ----------------------------------------------------------------------

function ActionRow({ row }: { row: AboutMeRow }) {
  const [pending, startTransition] = useTransition();
  const meta = row.metadata as Partial<ActionMetadata> | null;
  const status = meta?.status ?? 'planned';
  const isDone = status === 'done';

  const handleToggle = () => {
    const next = isDone ? 'planned' : 'done';
    startTransition(async () => {
      await toggleActionStatus(row.id, next);
    });
  };

  return (
    <Box
      sx={{
        display: 'flex',
        gap: 0.5,
        alignItems: 'center',
        px: 0.75,
        py: 0.5,
        bgcolor: 'background.neutral',
        borderRadius: 1,
        opacity: pending ? 0.6 : 1,
        transition: 'opacity 0.15s',
      }}
    >
      <Checkbox
        size="small"
        checked={isDone}
        onChange={handleToggle}
        disabled={pending}
        sx={{ p: 0.5 }}
      />
      <Stack sx={{ flex: 1, overflow: 'hidden' }}>
        <Typography
          variant="body2"
          sx={{
            fontSize: 13,
            textDecoration: isDone ? 'line-through' : 'none',
            color: isDone ? 'text.disabled' : 'text.primary',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {row.title}
        </Typography>
        {meta?.dueDate && (
          <Typography variant="caption" color="text.secondary" className="tabular">
            Hạn: {fDate(meta.dueDate)}
          </Typography>
        )}
      </Stack>
    </Box>
  );
}

// ----------------------------------------------------------------------

type Props = { rows: AboutMeRow[] };

export function AboutMeCardActionBody({ rows }: Props) {
  if (rows.length === 0) return null;

  return (
    <>
      {rows.map((row) => (
        <ActionRow key={row.id} row={row} />
      ))}
    </>
  );
}
