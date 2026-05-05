'use client';

import type { PlanDetail } from 'src/sections/plan/types';

import NextLink from 'next/link';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';

import { paths } from 'src/routes/paths';

import { Iconify } from 'src/components/iconify';

import { PlanProgressBar } from 'src/sections/plan/components/plan-progress-bar';
import {
  TASK_PRIORITY_LABEL,
  TASK_PRIORITY_COLOR,
  TASK_PRIORITY_ORDER,
} from 'src/sections/plan/constants/task-priority';

// ----------------------------------------------------------------------

type Props = { plan: PlanDetail | null };

// Dashboard card: shows the user's current weekly plan at-a-glance.
// Empty state when no active weekly plan exists in the current date range.
// `plan` is pre-fetched by the parent server component (DashboardOverviewView).
export function CurrentWeekPlanCard({ plan }: Props) {
  return (
    <Card>
      <CardHeader
        title="Kế hoạch tuần này"
        action={
          plan ? (
            <Link
              component={NextLink}
              href={paths.dashboard.planDetail(plan.id)}
              underline="hover"
              variant="caption"
              color="text.secondary"
            >
              Xem chi tiết
            </Link>
          ) : null
        }
      />

      <CardContent sx={{ pt: 1 }}>
        {plan ? <ActiveContent plan={plan} /> : <EmptyContent />}
      </CardContent>
    </Card>
  );
}

// ----------------------------------------------------------------------

function EmptyContent() {
  return (
    <Box sx={{ py: 3, textAlign: 'center' }}>
      <Iconify
        icon="solar:notes-bold-duotone"
        width={40}
        sx={{ color: 'text.disabled', mb: 1 }}
      />
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Chưa có kế hoạch tuần
      </Typography>
      <Button
        component={NextLink}
        href={`${paths.dashboard.plans}?scope=weekly&new=1`}
        variant="outlined"
        size="small"
        startIcon={<Iconify icon="solar:add-circle-bold" />}
      >
        Tạo kế hoạch
      </Button>
    </Box>
  );
}

// ----------------------------------------------------------------------

function ActiveContent({ plan }: { plan: PlanDetail }) {
  // First 3 incomplete tasks sorted by priority enum order, then by `order ASC`
  // (DB already returns tasks ordered by order ASC, createdAt ASC via getPlan).
  const incompleteTasks = plan.tasks
    .filter((t) => !t.isDone)
    .sort(
      (a, b) =>
        TASK_PRIORITY_ORDER.indexOf(a.priority) - TASK_PRIORITY_ORDER.indexOf(b.priority)
    )
    .slice(0, 3);

  return (
    <Stack spacing={2}>
      {/* Plan title */}
      <Link
        component={NextLink}
        href={paths.dashboard.planDetail(plan.id)}
        underline="hover"
        color="text.primary"
        variant="subtitle2"
      >
        {plan.title}
      </Link>

      {/* Progress bar */}
      <PlanProgressBar
        doneCount={plan.doneCount}
        totalCount={plan.totalCount}
        progress={plan.progress}
      />

      {/* Incomplete tasks (up to 3) */}
      {plan.totalCount === 0 ? (
        <Typography variant="body2" color="text.disabled" fontStyle="italic">
          Chưa có việc nào
        </Typography>
      ) : incompleteTasks.length === 0 ? (
        <Typography variant="body2" color="success.main" fontStyle="italic">
          Tất cả việc đã hoàn thành
        </Typography>
      ) : (
        <Stack spacing={1}>
          {incompleteTasks.map((task) => (
            <Box
              key={task.id}
              sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
            >
              <Iconify
                icon="solar:check-circle-bold"
                width={16}
                sx={{ color: 'text.disabled', flexShrink: 0 }}
              />
              <Typography variant="body2" sx={{ flex: 1, lineHeight: 1.4 }}>
                {task.title}
              </Typography>
              <Chip
                label={TASK_PRIORITY_LABEL[task.priority]}
                color={TASK_PRIORITY_COLOR[task.priority]}
                size="small"
                sx={{ height: 18, fontSize: 10, px: 0.25 }}
              />
            </Box>
          ))}
        </Stack>
      )}
    </Stack>
  );
}
