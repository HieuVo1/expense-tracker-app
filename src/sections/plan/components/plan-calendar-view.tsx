'use client';

import type { TimeSlot, PlanScope } from '@prisma/client';
import type { SchedulableTaskRow } from '../actions/plan-actions';

import dayjs from 'dayjs';
import { toast } from 'sonner';
import { useMemo, useState, useTransition } from 'react';
import { useSensor, DndContext, useSensors, PointerSensor, type DragEndEvent } from '@dnd-kit/core';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';

import { Iconify } from 'src/components/iconify';

import { PlanCalendarGrid } from './plan-calendar-grid';
import { scheduleTask } from '../actions/plan-task-actions';
import { PlanCalendarUnscheduledTray } from './plan-calendar-unscheduled-tray';
import { aiScheduleWeek, clearWeekSchedule } from '../actions/week-schedule-actions';

// ----------------------------------------------------------------------

type Props = {
  weekStart: string; // YYYY-MM-DD (Monday)
  weekEnd: string; // YYYY-MM-DD (Sunday)
  weekDays: string[];
  tasks: SchedulableTaskRow[];
};

const SCOPE_LABEL: Record<PlanScope, string> = {
  weekly: 'Tuần',
  monthly: 'Tháng',
  yearly: 'Năm',
  backlog: 'Backlog',
};

export function PlanCalendarView({ weekStart, weekEnd, weekDays, tasks: initial }: Props) {
  const [isPending, startTransition] = useTransition();
  const [tasks, setTasks] = useState<SchedulableTaskRow[]>(initial);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  // A task is "in current week" only when scheduledDate falls inside [weekStart, weekEnd].
  // Tasks scheduled in earlier/later weeks render in the tray for this view.
  const isInCurrentWeek = (d: string | null) =>
    d !== null && d >= weekStart && d <= weekEnd;

  const { tasksByCell, unscheduled } = useMemo(() => {
    const byCell = new Map<string, SchedulableTaskRow[]>();
    const tray: SchedulableTaskRow[] = [];
    for (const t of tasks) {
      if (t.scheduledDate && t.scheduledSlot && isInCurrentWeek(t.scheduledDate)) {
        const key = `${t.scheduledDate}:${t.scheduledSlot}`;
        const arr = byCell.get(key);
        if (arr) arr.push(t);
        else byCell.set(key, [t]);
      } else {
        tray.push(t);
      }
    }
    return { tasksByCell: byCell, unscheduled: tray };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks, weekStart, weekEnd]);

  const handleDragEnd = (e: DragEndEvent) => {
    const overId = e.over?.id;
    if (!overId) return;

    const taskId = String(e.active.id);
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    let nextDate: string | null = null;
    let nextSlot: TimeSlot | null = null;

    if (overId === 'unscheduled') {
      nextDate = null;
      nextSlot = null;
    } else if (typeof overId === 'string' && overId.startsWith('slot:')) {
      const parts = overId.split(':');
      if (parts.length >= 3) {
        nextDate = parts[1];
        nextSlot = parts.slice(2).join(':') as TimeSlot;
      }
    } else {
      return;
    }

    if (task.scheduledDate === nextDate && task.scheduledSlot === nextSlot) return;

    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, scheduledDate: nextDate, scheduledSlot: nextSlot } : t))
    );

    startTransition(async () => {
      try {
        await scheduleTask(taskId, nextDate, nextSlot);
      } catch {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === taskId
              ? { ...t, scheduledDate: task.scheduledDate, scheduledSlot: task.scheduledSlot }
              : t
          )
        );
        toast.error('Không cập nhật được lịch');
      }
    });
  };

  const handleAiSchedule = () => {
    startTransition(async () => {
      try {
        const { scheduledCount, assignments } = await aiScheduleWeek();
        if (scheduledCount === 0) {
          toast.info('Không có việc nào cần sắp xếp.');
          return;
        }
        const byId = new Map(assignments.map((a) => [a.taskId, a]));
        setTasks((prev) =>
          prev.map((t) => {
            const a = byId.get(t.id);
            if (!a) return t;
            return { ...t, scheduledDate: a.date, scheduledSlot: a.slot };
          })
        );
        toast.success(`AI đã sắp xếp ${scheduledCount} việc trong tuần.`);
      } catch (err) {
        console.error(err);
        toast.error('AI chưa sắp xếp được. Thử lại sau.');
      }
    });
  };

  const handleClear = () => {
     
    if (!confirm('Xóa toàn bộ lịch tuần hiện tại?')) return;
    startTransition(async () => {
      try {
        const { clearedCount } = await clearWeekSchedule();
        setTasks((prev) =>
          prev.map((t) =>
            isInCurrentWeek(t.scheduledDate)
              ? { ...t, scheduledDate: null, scheduledSlot: null }
              : t
          )
        );
        toast.success(`Đã xóa lịch của ${clearedCount} việc.`);
      } catch {
        toast.error('Không xóa được lịch.');
      }
    });
  };

  if (tasks.length === 0) {
    return (
      <Card sx={{ p: 4, textAlign: 'center' }}>
        <Iconify icon="solar:calendar-date-bold" width={48} sx={{ color: 'text.disabled', mb: 1 }} />
        <Typography variant="subtitle1" sx={{ mb: 0.5 }}>
          Không có việc nào để xếp lịch
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 420, mx: 'auto', mb: 2 }}>
          Tạo task trong kế hoạch tuần / tháng / năm / backlog. Calendar gom tất cả task chưa xong từ các plan đang hoạt động.
        </Typography>
      </Card>
    );
  }

  const sourceSummary = Object.entries(
    tasks.reduce<Record<PlanScope, number>>(
      (acc, t) => {
        acc[t.planScope] = (acc[t.planScope] ?? 0) + 1;
        return acc;
      },
      { weekly: 0, monthly: 0, yearly: 0, backlog: 0 }
    )
  )
    .filter(([, n]) => n > 0)
    .map(([scope, n]) => `${SCOPE_LABEL[scope as PlanScope]}: ${n}`)
    .join(' · ');

  return (
    <Card sx={{ p: { xs: 2, sm: 3 } }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1.5}
        alignItems={{ xs: 'stretch', sm: 'center' }}
        sx={{ mb: 2 }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle1">
            Tuần {dayjs(weekStart).format('DD/MM')} – {dayjs(weekEnd).format('DD/MM/YYYY')}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {tasks.length} việc · {unscheduled.length} chưa xếp · {sourceSummary}
          </Typography>
        </Box>
        <Button
          color="inherit"
          size="small"
          startIcon={<Iconify icon="solar:eraser-bold" width={16} />}
          onClick={handleClear}
          disabled={isPending}
        >
          Xóa lịch
        </Button>
        <LoadingButton
          variant="contained"
          loading={isPending}
          onClick={handleAiSchedule}
          startIcon={<Iconify icon="solar:cup-star-bold" width={18} />}
        >
          AI sắp xếp tuần
        </LoadingButton>
      </Stack>

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <Stack spacing={2}>
          <PlanCalendarUnscheduledTray tasks={unscheduled} />
          <PlanCalendarGrid weekDays={weekDays} tasksByCell={tasksByCell} />
        </Stack>
      </DndContext>

      <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 2 }}>
        Kéo việc vào ô để xếp lịch. AI dựa trên ma trận Eisenhower: do_first ưu tiên đầu tuần, schedule rải đều, delegate đẩy chiều/tối, eliminate có thể bỏ qua.
      </Typography>
    </Card>
  );
}
