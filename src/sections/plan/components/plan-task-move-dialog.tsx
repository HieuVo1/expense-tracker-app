'use client';

import type { PlanScope } from '@prisma/client';
import type { PlanMoveTarget } from '../types';

import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Select from '@mui/material/Select';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import ListSubheader from '@mui/material/ListSubheader';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { PLAN_SCOPE_LABELS } from '../constants/plan-meta';

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  onClose: () => void;
  targets: PlanMoveTarget[];
  onConfirm: (targetPlanId: string) => void | Promise<void>;
};

export function PlanTaskMoveDialog({ open, onClose, targets, onConfirm }: Props) {
  const [selected, setSelected] = useState<string>('');

  useEffect(() => {
    if (open) setSelected('');
  }, [open]);

  // Group targets by scope order: weekly → monthly → yearly
  const grouped: Record<PlanScope, PlanMoveTarget[]> = {
    weekly: [],
    monthly: [],
    yearly: [],
    backlog: [], // unused; listMoveTargets excludes
  };
  targets.forEach((t) => grouped[t.scope].push(t));

  const handleConfirm = () => {
    if (!selected) return;
    onConfirm(selected);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Chuyển sang kế hoạch khác</DialogTitle>
      <Divider />
      <DialogContent sx={{ pt: 2.5 }}>
        {targets.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            Chưa có kế hoạch tuần / tháng / năm đang hoạt động. Hãy tạo trước rồi quay lại.
          </Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Chọn kế hoạch đích để chuyển việc này sang:
            </Typography>
            <Select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              displayEmpty
              fullWidth
              size="small"
            >
              <MenuItem value="" disabled>
                — Chọn kế hoạch —
              </MenuItem>
              {(['weekly', 'monthly', 'yearly'] as const).flatMap((scope) => {
                const items = grouped[scope];
                if (items.length === 0) return [];
                return [
                  <ListSubheader key={`hdr-${scope}`}>{PLAN_SCOPE_LABELS[scope]}</ListSubheader>,
                  ...items.map((p) => (
                    <MenuItem key={p.id} value={p.id} sx={{ pl: 3 }}>
                      {p.title}
                    </MenuItem>
                  )),
                ];
              })}
            </Select>
          </Box>
        )}
      </DialogContent>
      <Divider />
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} color="inherit">
          Huỷ
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          disabled={!selected || targets.length === 0}
        >
          Chuyển
        </Button>
      </DialogActions>
    </Dialog>
  );
}
