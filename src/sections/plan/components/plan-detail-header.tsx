'use client';

import type { PlanStatus } from '@prisma/client';
import type { PlanDetail } from '../types';

import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Menu from '@mui/material/Menu';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';

import { paths } from 'src/routes/paths';

import { fDate } from 'src/utils/format-time';

import { Iconify } from 'src/components/iconify';

import { PlanEditDialog } from './plan-edit-dialog';
import { PlanProgressBar } from './plan-progress-bar';
import { deletePlan, setPlanStatus, rolloverPlan } from '../actions/plan-actions';
import { PLAN_SCOPE_LABELS, PLAN_STATUS_LABELS } from '../constants/plan-meta';

// ----------------------------------------------------------------------

type Props = {
  plan: PlanDetail;
};

export function PlanDetailHeader({ plan }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const handleStatusChange = (status: PlanStatus) => {
    startTransition(async () => {
      try {
        await setPlanStatus(plan.id, status);
        toast.success('Đã cập nhật trạng thái');
      } catch {
        toast.error('Không thể cập nhật trạng thái');
      }
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      try {
        await deletePlan(plan.id);
        router.replace(paths.dashboard.plans);
      } catch {
        toast.error('Không thể xoá kế hoạch');
      }
    });
  };

  const handleRollover = () => {
    setMenuAnchor(null);
    startTransition(async () => {
      try {
        const { id } = await rolloverPlan(plan.id);
        const remaining = plan.tasks.filter((t) => !t.isDone).length;
        toast.success(
          remaining > 0
            ? `Đã chuyển ${remaining} việc chưa xong sang ${plan.scope === 'weekly' ? 'tuần' : 'tháng'} mới`
            : `Đã tạo kế hoạch ${plan.scope === 'weekly' ? 'tuần' : 'tháng'} mới`
        );
        router.push(paths.dashboard.planDetail(id));
      } catch {
        toast.error('Không thể chuyển kế hoạch');
      }
    });
  };

  const rolloverLabel = plan.scope === 'weekly' ? 'Chuyển sang tuần sau' : 'Chuyển sang tháng sau';

  return (
    <>
      <Stack spacing={2} sx={{ mb: 3 }}>
        {/* Title row */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 0.5 }}>
              <Typography variant="h4" noWrap sx={{ flex: 1, minWidth: 0 }}>
                {plan.title}
              </Typography>
              <Chip
                label={PLAN_SCOPE_LABELS[plan.scope]}
                size="small"
                variant="outlined"
                sx={{ flexShrink: 0 }}
              />
            </Box>
            <Typography variant="body2" color="text.secondary">
              {fDate(plan.startDate, 'DD/MM/YYYY')} – {fDate(plan.endDate, 'DD/MM/YYYY')}
            </Typography>
          </Box>

          {/* Kebab menu */}
          <IconButton onClick={(e) => setMenuAnchor(e.currentTarget)} size="small">
            <Iconify icon="solar:menu-dots-bold-duotone" />
          </IconButton>
          <Menu
            anchorEl={menuAnchor}
            open={Boolean(menuAnchor)}
            onClose={() => setMenuAnchor(null)}
          >
            <MenuItem
              onClick={() => {
                setMenuAnchor(null);
                setEditOpen(true);
              }}
            >
              <Iconify icon="solar:pen-bold" width={18} sx={{ mr: 1, color: 'text.secondary' }} />
              Sửa
            </MenuItem>
            <MenuItem onClick={handleRollover} disabled={isPending}>
              <Iconify
                icon="solar:double-alt-arrow-right-bold-duotone"
                width={18}
                sx={{ mr: 1, color: 'text.secondary' }}
              />
              {rolloverLabel}
            </MenuItem>
            <MenuItem
              onClick={() => {
                setMenuAnchor(null);
                setDeleteOpen(true);
              }}
              sx={{ color: 'error.main' }}
            >
              <Iconify icon="solar:trash-bin-trash-bold" width={18} sx={{ mr: 1 }} />
              Xoá
            </MenuItem>
          </Menu>
        </Box>

        {/* Status select */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ flexShrink: 0 }}>
            Trạng thái:
          </Typography>
          <Select
            value={plan.status}
            size="small"
            disabled={isPending}
            onChange={(e) => handleStatusChange(e.target.value as PlanStatus)}
            sx={{ minWidth: 160 }}
          >
            {(Object.keys(PLAN_STATUS_LABELS) as PlanStatus[]).map((s) => (
              <MenuItem key={s} value={s}>
                {PLAN_STATUS_LABELS[s]}
              </MenuItem>
            ))}
          </Select>
        </Box>

        {/* Progress bar */}
        <PlanProgressBar
          doneCount={plan.doneCount}
          totalCount={plan.totalCount}
          progress={plan.progress}
        />
      </Stack>

      {/* Edit dialog */}
      <PlanEditDialog plan={plan} open={editOpen} onClose={() => setEditOpen(false)} />

      {/* Delete confirm dialog */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Xoá kế hoạch?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Xoá kế hoạch này? Tất cả việc cần làm sẽ bị xoá và không thể khôi phục.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)} color="inherit" disabled={isPending}>
            Huỷ
          </Button>
          <Button
            onClick={handleDelete}
            color="error"
            variant="contained"
            disabled={isPending}
          >
            Xoá
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
