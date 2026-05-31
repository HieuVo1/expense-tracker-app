'use client';

import type { TimeSlot } from '@prisma/client';
import type { PlanTaskRow } from '../types';

import dayjs from 'dayjs';

import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';

import { PlanCalendarSlot } from './plan-calendar-slot';
import {
  DAY_LABEL_VN,
  TIME_SLOT_ICON,
  TIME_SLOT_LABEL,
  TIME_SLOT_ORDER,
} from '../constants/time-slot';

// ----------------------------------------------------------------------

type Props = {
  weekDays: string[]; // YYYY-MM-DD list, length 7
  tasksByCell: Map<string, PlanTaskRow[]>; // key = `${date}:${slot}`
};

// Mon-based index from a YYYY-MM-DD string. dayjs().day() returns 0=Sun..6=Sat;
// shift so 0=Mon..6=Sun.
function vnWeekdayIndex(date: string): number {
  const js = dayjs(date).day(); // 0..6 (Sun..Sat)
  return js === 0 ? 6 : js - 1;
}

export function PlanCalendarGrid({ weekDays, tasksByCell }: Props) {
  const theme = useTheme();
  const today = dayjs().format('YYYY-MM-DD');

  return (
    <Box sx={{ overflowX: 'auto' }}>
      <Box
        sx={{
          display: 'grid',
          // First column for slot label, then 7 days. Minimum widths so it stays usable on mobile (scrollable).
          gridTemplateColumns: '72px repeat(7, minmax(120px, 1fr))',
          gap: 1,
          minWidth: 800,
        }}
      >
        {/* Top-left empty corner */}
        <Box />

        {/* Day headers */}
        {weekDays.map((d) => {
          const isToday = d === today;
          const idx = vnWeekdayIndex(d);
          return (
            <Box
              key={`hdr-${d}`}
              sx={{
                px: 1,
                py: 0.75,
                borderRadius: 1,
                bgcolor: isToday ? `${theme.palette.primary.main}14` : 'transparent',
                border: `1px solid ${isToday ? theme.palette.primary.main : 'transparent'}`,
                textAlign: 'center',
              }}
            >
              <Typography
                variant="caption"
                sx={{ display: 'block', color: isToday ? 'primary.main' : 'text.secondary' }}
              >
                {DAY_LABEL_VN[idx]}
              </Typography>
              <Typography
                variant="subtitle2"
                sx={{ color: isToday ? 'primary.main' : 'text.primary' }}
              >
                {dayjs(d).format('DD/MM')}
              </Typography>
            </Box>
          );
        })}

        {/* Slot rows */}
        {TIME_SLOT_ORDER.map((slot) => (
          <RowFragment
            key={slot}
            slot={slot}
            weekDays={weekDays}
            tasksByCell={tasksByCell}
          />
        ))}
      </Box>
    </Box>
  );
}

// ----------------------------------------------------------------------

function RowFragment({
  slot,
  weekDays,
  tasksByCell,
}: {
  slot: TimeSlot;
  weekDays: string[];
  tasksByCell: Map<string, PlanTaskRow[]>;
}) {
  const theme = useTheme();
  return (
    <>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 0.25,
          color: 'text.secondary',
        }}
      >
        <Iconify icon={TIME_SLOT_ICON[slot]} width={18} sx={{ color: theme.palette.text.secondary }} />
        <Typography variant="caption">{TIME_SLOT_LABEL[slot]}</Typography>
      </Box>

      {weekDays.map((d) => {
        const cellTasks = tasksByCell.get(`${d}:${slot}`) ?? [];
        return <PlanCalendarSlot key={`${slot}-${d}`} date={d} slot={slot} tasks={cellTasks} />;
      })}
    </>
  );
}
