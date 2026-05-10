'use client';

import type { SubscriptionRow } from '../types';

import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';

import { computeSubscriptionTotals } from '../utils/summary';
import { SubscriptionListItem } from '../components/subscription-list-item';
import { SubscriptionFormDialog } from '../components/subscription-form-dialog';
import { SubscriptionEmptyState } from '../components/subscription-empty-state';
import { SubscriptionSummaryCards } from '../components/subscription-summary-cards';

type Props = {
  initial: SubscriptionRow[];
};

function SectionHeading({ label, count }: { label: string; count: number }) {
  return (
    <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
      {label} ({count})
    </Typography>
  );
}

export function SubscriptionListClient({ initial }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SubscriptionRow | null>(null);

  const totals = useMemo(() => computeSubscriptionTotals(initial), [initial]);

  // Group: overdue/today (≤0) → due soon (1–7) → later → paused (inactive)
  const { overdue, dueSoon, later, paused } = useMemo(() => {
    const o: SubscriptionRow[] = [];
    const s: SubscriptionRow[] = [];
    const l: SubscriptionRow[] = [];
    const p: SubscriptionRow[] = [];
    for (const r of initial) {
      if (!r.active) p.push(r);
      else if (r.daysUntilDue < 0) o.push(r);
      else if (r.daysUntilDue <= 7) s.push(r);
      else l.push(r);
    }
    return { overdue: o, dueSoon: s, later: l, paused: p };
  }, [initial]);

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };
  const openEdit = (row: SubscriptionRow) => {
    setEditing(row);
    setDialogOpen(true);
  };
  const closeDialog = () => {
    setDialogOpen(false);
    setEditing(null);
  };

  if (initial.length === 0) {
    return (
      <>
        <Stack spacing={3}>
          <Header onCreate={openCreate} />
          <SubscriptionEmptyState onCreate={openCreate} />
        </Stack>
        <SubscriptionFormDialog open={dialogOpen} onClose={closeDialog} editing={editing} />
      </>
    );
  }

  return (
    <>
      <Stack spacing={3}>
        <Header onCreate={openCreate} />

        <SubscriptionSummaryCards totals={totals} rows={initial} />

        {overdue.length > 0 && (
          <Box>
            <SectionHeading label="Quá hạn" count={overdue.length} />
            <Stack spacing={1}>
              {overdue.map((r) => (
                <SubscriptionListItem key={r.id} row={r} onEdit={openEdit} />
              ))}
            </Stack>
          </Box>
        )}

        {dueSoon.length > 0 && (
          <Box>
            <SectionHeading label="Sắp đến hạn (≤ 7 ngày)" count={dueSoon.length} />
            <Stack spacing={1}>
              {dueSoon.map((r) => (
                <SubscriptionListItem key={r.id} row={r} onEdit={openEdit} />
              ))}
            </Stack>
          </Box>
        )}

        {later.length > 0 && (
          <Box>
            <SectionHeading label="Sắp tới" count={later.length} />
            <Stack spacing={1}>
              {later.map((r) => (
                <SubscriptionListItem key={r.id} row={r} onEdit={openEdit} />
              ))}
            </Stack>
          </Box>
        )}

        {paused.length > 0 && (
          <Box>
            <SectionHeading label="Tạm dừng" count={paused.length} />
            <Stack spacing={1}>
              {paused.map((r) => (
                <SubscriptionListItem key={r.id} row={r} onEdit={openEdit} />
              ))}
            </Stack>
          </Box>
        )}
      </Stack>

      <SubscriptionFormDialog open={dialogOpen} onClose={closeDialog} editing={editing} />
    </>
  );
}

function Header({ onCreate }: { onCreate: () => void }) {
  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          flexWrap: 'wrap',
        }}
      >
        <Typography variant="h4">Hoá đơn định kỳ</Typography>
        <Button
          variant="contained"
          startIcon={<Iconify icon="mingcute:add-line" />}
          onClick={onCreate}
        >
          Thêm hoá đơn
        </Button>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1, maxWidth: 720 }}>
        Theo dõi các <strong>subscription</strong> và hoá đơn lặp lại (cloud, AI, streaming...).
        Số tiền theo chu kỳ năm/quý sẽ được quy đổi sang <strong>chi phí tháng</strong> để bạn biết rõ
        mức chi cố định mỗi tháng.
      </Typography>
    </Box>
  );
}
