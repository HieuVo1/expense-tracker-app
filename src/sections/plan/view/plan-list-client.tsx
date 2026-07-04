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
import { PlanBacklogList } from '../components/plan-backlog-list';
import { PlanCreateDialog } from '../components/plan-create-dialog';

// ----------------------------------------------------------------------

type PlanListClientProps = {
  initial: PlanRow[];
};

export function PlanListClient({ initial }: PlanListClientProps) {
  const [activeScope, setActiveScope] = useState<PlanScope>('weekly');
  const [createOpen, setCreateOpen] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  const { current, upcoming, past, archived, backlogItems } = useMemo(() => {
    const tabRows = initial.filter((r) => r.scope === activeScope);
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
  }, [initial, activeScope]);

  const handleTabChange = (scope: PlanScope) => {
    setActiveScope(scope);
    setShowArchived(false);
  };

  const isBacklog = activeScope === 'backlog';

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
          <strong>việc cần làm</strong> và phân loại theo mức độ <em>khẩn cấp / quan trọng</em>. Backlog là kho ý tưởng — chưa có thời hạn.
        </Typography>
      </Box>

      <PlanTabs value={activeScope} onChange={handleTabChange} />

      {isBacklog ? (
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
        defaultScope={activeScope}
      />
    </Stack>
  );
}
