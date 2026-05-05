'use client';

import type { TaskPriority } from '@prisma/client';
import type { IconifyName } from 'src/components/iconify';
import type {
  ReminderTask,
  DashboardReminders,
  ReminderExpiredPlan,
} from '../actions/dashboard-reminders';

import { toast } from 'sonner';
import { useTransition } from 'react';
import { useRouter } from 'next/navigation';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import { useTheme } from '@mui/material/styles';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';

import { fDate } from 'src/utils/format-time';

import { Iconify } from 'src/components/iconify';

import { rolloverPlan } from 'src/sections/plan/actions/plan-actions';
import {
  TASK_PRIORITY_ICON,
  TASK_PRIORITY_LABEL,
  TASK_PRIORITY_COLOR,
} from 'src/sections/plan/constants/task-priority';

// ----------------------------------------------------------------------

type Props = {
  reminders: DashboardReminders;
};

export function DashboardRemindersCard({ reminders }: Props) {
  if (reminders.totalCount === 0) return null;

  return (
    <Card
      sx={{
        borderLeft: 4,
        borderLeftColor: 'warning.main',
        bgcolor: (theme) => `${theme.palette.warning.main}08`,
      }}
    >
      <CardHeader
        avatar={<Iconify icon="solar:bell-bing-bold-duotone" width={24} />}
        title="Cần chú ý"
        subheader={`Bạn có ${reminders.totalCount} mục cần xem`}
      />
      <CardContent sx={{ pt: 0 }}>
        <Stack spacing={2} divider={<Divider />}>
          {reminders.overdueTasks.length > 0 && (
            <TaskSection
              title="Việc quá hạn"
              icon="solar:danger-bold"
              color="error"
              tasks={reminders.overdueTasks}
              showRelativeDate
            />
          )}
          {reminders.todayTasks.length > 0 && (
            <TaskSection
              title="Việc hôm nay"
              icon="solar:calendar-date-bold"
              color="warning"
              tasks={reminders.todayTasks}
            />
          )}
          {reminders.expiredPlans.length > 0 && (
            <ExpiredPlansSection plans={reminders.expiredPlans} />
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}

// ----------------------------------------------------------------------

function TaskSection({
  title,
  icon,
  color,
  tasks,
  showRelativeDate = false,
}: {
  title: string;
  icon: IconifyName;
  color: 'error' | 'warning';
  tasks: ReminderTask[];
  showRelativeDate?: boolean;
}) {
  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
        <Iconify icon={icon} width={18} sx={{ color: `${color}.main` }} />
        <Typography variant="subtitle2" sx={{ color: `${color}.main` }}>
          {title}
        </Typography>
        <Chip label={tasks.length} size="small" color={color} sx={{ height: 20 }} />
      </Stack>
      <Stack spacing={1}>
        {tasks.map((t) => (
          <TaskRow key={t.id} task={t} showRelativeDate={showRelativeDate} />
        ))}
      </Stack>
    </Box>
  );
}

// ----------------------------------------------------------------------

function TaskRow({
  task,
  showRelativeDate,
}: {
  task: ReminderTask;
  showRelativeDate: boolean;
}) {
  const theme = useTheme();
  const colorKey = TASK_PRIORITY_COLOR[task.priority];
  const tint =
    colorKey === 'default' ? theme.palette.text.disabled : theme.palette[colorKey].main;

  return (
    <Box
      component="a"
      href={paths.dashboard.planDetail(task.planId)}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        p: 1.25,
        borderRadius: 1,
        textDecoration: 'none',
        color: 'inherit',
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        '&:hover': { bgcolor: 'action.hover' },
      }}
    >
      <Iconify icon={TASK_PRIORITY_ICON[task.priority]} width={18} sx={{ color: tint }} />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body2" sx={{ fontWeight: 500 }} noWrap>
          {task.title}
        </Typography>
        <Typography variant="caption" color="text.secondary" noWrap>
          {task.planTitle} · {TASK_PRIORITY_LABEL[task.priority as TaskPriority]}
          {showRelativeDate && ` · hạn ${fDate(task.dueDate, 'DD/MM')}`}
        </Typography>
      </Box>
      <Iconify icon="eva:arrow-ios-forward-fill" width={18} sx={{ color: 'text.disabled' }} />
    </Box>
  );
}

// ----------------------------------------------------------------------

function ExpiredPlansSection({ plans }: { plans: ReminderExpiredPlan[] }) {
  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
        <Iconify
          icon="solar:calendar-date-bold"
          width={18}
          sx={{ color: 'info.main' }}
        />
        <Typography variant="subtitle2" sx={{ color: 'info.main' }}>
          Kế hoạch quá hạn
        </Typography>
        <Chip label={plans.length} size="small" color="info" sx={{ height: 20 }} />
      </Stack>
      <Stack spacing={1}>
        {plans.map((p) => (
          <ExpiredPlanRow key={p.id} plan={p} />
        ))}
      </Stack>
    </Box>
  );
}

// ----------------------------------------------------------------------

function ExpiredPlanRow({ plan }: { plan: ReminderExpiredPlan }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const scopeLabel = plan.scope === 'weekly' ? 'tuần' : 'tháng';

  const handleRollover = () => {
    startTransition(async () => {
      try {
        const { id } = await rolloverPlan(plan.id);
        toast.success(`Đã chuyển ${plan.incompleteCount} việc sang ${scopeLabel} mới`);
        router.push(paths.dashboard.planDetail(id));
      } catch {
        toast.error('Không thể chuyển kế hoạch');
      }
    });
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        p: 1.25,
        borderRadius: 1,
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        flexWrap: 'wrap',
      }}
    >
      <Box sx={{ flex: 1, minWidth: 200 }}>
        <Typography variant="body2" sx={{ fontWeight: 500 }} noWrap>
          {plan.title}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Kết thúc {fDate(plan.endDate, 'DD/MM')} · {plan.incompleteCount} việc chưa xong
        </Typography>
      </Box>
      <Stack direction="row" spacing={1}>
        <Button
          size="small"
          variant="outlined"
          color="inherit"
          href={paths.dashboard.planDetail(plan.id)}
        >
          Xem
        </Button>
        <Button
          size="small"
          variant="contained"
          color="primary"
          disabled={isPending}
          onClick={handleRollover}
          startIcon={<Iconify icon="solar:double-alt-arrow-right-bold-duotone" width={16} />}
        >
          Chuyển sang {scopeLabel} sau
        </Button>
      </Stack>
    </Box>
  );
}
