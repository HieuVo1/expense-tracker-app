'use client';

import type { PlanScope } from '@prisma/client';
import type { PlanRow } from '../types';

import dayjs from 'dayjs';
import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';

import { PlanTabs } from '../components/plan-tabs';
import { PlanList } from '../components/plan-list';
import { PlanCreateDialog } from '../components/plan-create-dialog';

// ----------------------------------------------------------------------

type PlanListClientProps = {
  initial: PlanRow[];
};

export function PlanListClient({ initial }: PlanListClientProps) {
  const [activeTab, setActiveTab] = useState<PlanScope>('weekly');
  const [createOpen, setCreateOpen] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  const { current, upcoming, past, archived } = useMemo(() => {
    const tabRows = initial.filter((r) => r.scope === activeTab);
    const today = dayjs().format('YYYY-MM-DD');

    return {
      current: tabRows.filter((r) => r.isCurrent),
      // Future plans (start hasn't arrived yet) — typically rolled-over plans waiting for next period.
      upcoming: tabRows.filter(
        (r) => !r.isCurrent && r.status !== 'archived' && r.startDate > today
      ),
      // Past = ended (endDate < today) and not archived.
      past: tabRows.filter(
        (r) => !r.isCurrent && r.status !== 'archived' && r.endDate < today
      ),
      archived: tabRows.filter((r) => r.status === 'archived'),
    };
  }, [initial, activeTab]);

  const handleTabChange = (scope: PlanScope) => {
    setActiveTab(scope);
    setShowArchived(false); // reset archived toggle on tab switch
  };

  return (
    <Stack spacing={3}>
      {/* Header */}
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h4">Kế hoạch</Typography>
          <Button
            variant="contained"
            startIcon={<Iconify icon="mingcute:add-line" />}
            onClick={() => setCreateOpen(true)}
          >
            Tạo kế hoạch
          </Button>
        </Box>

        {/* Concept explainer — clarifies plan vs task hierarchy */}
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, maxWidth: 720 }}>
          Mỗi <strong>kế hoạch</strong> là một mục tiêu cho tuần hoặc tháng. Bên trong, bạn liệt kê các{' '}
          <strong>việc cần làm</strong> và phân loại theo mức độ <em>khẩn cấp / quan trọng</em> để biết nên ưu tiên cái nào trước.
        </Typography>
      </Box>

      {/* Scope tabs */}
      <PlanTabs value={activeTab} onChange={handleTabChange} />

      {/* Plan sections */}
      <PlanList
        current={current}
        upcoming={upcoming}
        past={past}
        archived={archived}
        showArchived={showArchived}
        onToggleArchived={() => setShowArchived((p) => !p)}
        onCreate={() => setCreateOpen(true)}
      />

      {/* Create dialog */}
      <PlanCreateDialog open={createOpen} onClose={() => setCreateOpen(false)} />
    </Stack>
  );
}
