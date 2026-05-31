'use client';

import type { PlanScope } from '@prisma/client';
import type { PlanRow } from '../types';
import type { PlanView } from '../components/plan-tabs';
import type { WeekSchedulingContext } from '../actions/plan-actions';

import dayjs from 'dayjs';
import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';

import { PlanTabs } from '../components/plan-tabs';
import { PlanList } from '../components/plan-list';
import { PlanBacklogList } from '../components/plan-backlog-list';
import { PlanCalendarView } from '../components/plan-calendar-view';
import { PlanCreateDialog } from '../components/plan-create-dialog';

// ----------------------------------------------------------------------

type PlanListClientProps = {
  initial: PlanRow[];
  weekContext: WeekSchedulingContext;
};

export function PlanListClient({ initial, weekContext }: PlanListClientProps) {
  const [activeView, setActiveView] = useState<PlanView>('calendar');
  const [createOpen, setCreateOpen] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  // Only compute scope-tab data when a scope is active (not calendar).
  const isScopeView = activeView !== 'calendar';
  const scopeTab = isScopeView ? (activeView as PlanScope) : null;

  const { current, upcoming, past, archived, backlogItems } = useMemo(() => {
    const tabRows = scopeTab ? initial.filter((r) => r.scope === scopeTab) : [];
    const today = dayjs().format('YYYY-MM-DD');

    return {
      current: tabRows.filter((r) => r.isCurrent),
      upcoming: tabRows.filter(
        (r) =>
          !r.isCurrent &&
          r.status !== 'archived' &&
          r.startDate !== null &&
          r.startDate > today
      ),
      past: tabRows.filter(
        (r) =>
          !r.isCurrent &&
          r.status !== 'archived' &&
          r.endDate !== null &&
          r.endDate < today
      ),
      archived: tabRows.filter((r) => r.status === 'archived'),
      backlogItems: initial.filter((r) => r.scope === 'backlog'),
    };
  }, [initial, scopeTab]);

  const handleTabChange = (v: PlanView) => {
    setActiveView(v);
    setShowArchived(false);
  };

  const isBacklog = activeView === 'backlog';
  const isCalendar = activeView === 'calendar';
  // Default scope for the create dialog when triggered from a non-scope view.
  const createDefaultScope: PlanScope = isCalendar ? 'weekly' : (activeView as PlanScope);

  return (
    <Stack spacing={3}>
      {/* Header */}
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h4">Kế hoạch</Typography>
          <Button
            variant="contained"
            startIcon={<Iconify icon="solar:add-circle-bold" />}
            onClick={() => setCreateOpen(true)}
          >
            Tạo kế hoạch
          </Button>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, maxWidth: 720 }}>
          Mỗi <strong>kế hoạch</strong> là một mục tiêu cho tuần, tháng hoặc năm. Bên trong, bạn liệt kê các{' '}
          <strong>việc cần làm</strong> và phân loại theo mức độ <em>khẩn cấp / quan trọng</em>. Backlog là kho ý tưởng — chưa có thời hạn. Tab <strong>Lịch tuần</strong> để AI tự xếp lịch theo ma trận Eisenhower.
        </Typography>
      </Box>

      <PlanTabs value={activeView} onChange={handleTabChange} />

      {isCalendar ? (
        <PlanCalendarView
          weekStart={weekContext.weekStart}
          weekEnd={weekContext.weekEnd}
          weekDays={weekContext.weekDays}
          tasks={weekContext.tasks}
        />
      ) : isBacklog ? (
        <PlanBacklogList items={backlogItems} onCreate={() => setCreateOpen(true)} />
      ) : (
        <PlanList
          current={current}
          upcoming={upcoming}
          past={past}
          archived={archived}
          showArchived={showArchived}
          onToggleArchived={() => setShowArchived((p) => !p)}
          onCreate={() => setCreateOpen(true)}
        />
      )}

      <PlanCreateDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        defaultScope={createDefaultScope}
      />
    </Stack>
  );
}
