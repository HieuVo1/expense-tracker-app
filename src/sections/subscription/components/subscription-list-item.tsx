'use client';

import type { SubscriptionRow } from '../types';
import type { IconifyName } from 'src/components/iconify';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Menu from '@mui/material/Menu';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { fDate } from 'src/utils/format-time';
import { fCurrency } from 'src/utils/format-number';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';

import { dueLabel } from '../utils/summary';
import { advanceDueDate } from '../utils/cycle-math';
import { BILLING_CYCLE_LABEL, BILLING_CYCLE_SHORT } from '../constants/billing-cycle';
import {
  deleteSubscription,
  markSubscriptionPaid,
  setSubscriptionActive,
} from '../actions/subscription-actions';

type Props = {
  row: SubscriptionRow;
  onEdit: (row: SubscriptionRow) => void;
};

export function SubscriptionListItem({ row, onEdit }: Props) {
  const router = useRouter();
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [payOpen, setPayOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const closeMenu = () => setMenuAnchor(null);

  const confirmPaid = () => {
    setPayOpen(false);
    startTransition(async () => {
      try {
        await markSubscriptionPaid(row.id);
        toast.success(`Đã ghi nhận thanh toán ${fCurrency(row.amount)}`);
        router.refresh();
      } catch {
        toast.error('Không thể ghi nhận thanh toán');
      }
    });
  };

  const handleToggleActive = () => {
    closeMenu();
    startTransition(async () => {
      try {
        await setSubscriptionActive(row.id, !row.active);
        toast.success(row.active ? 'Đã tạm dừng' : 'Đã kích hoạt lại');
        router.refresh();
      } catch {
        toast.error('Không thể cập nhật');
      }
    });
  };

  const confirmDelete = () => {
    setDeleteOpen(false);
    startTransition(async () => {
      try {
        await deleteSubscription(row.id);
        toast.success('Đã xoá');
        router.refresh();
      } catch {
        toast.error('Không thể xoá');
      }
    });
  };

  const nextDue = advanceDueDate(row.nextDueDate, row.cycle);

  const overdue = row.active && row.daysUntilDue < 0;
  const dueSoon = row.active && row.daysUntilDue >= 0 && row.daysUntilDue <= 7;

  return (
    <Card
      sx={{
        p: 2,
        borderLeft: 4,
        borderLeftColor: !row.active
          ? 'divider'
          : overdue
            ? 'error.main'
            : dueSoon
              ? 'warning.main'
              : 'transparent',
        opacity: row.active ? 1 : 0.6,
      }}
    >
      <Stack direction="row" spacing={2} alignItems="flex-start">
        {/* Category icon */}
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 1,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: `${row.categoryColor}1A`,
            color: row.categoryColor,
            flexShrink: 0,
          }}
        >
          <Iconify icon={row.categoryIcon as IconifyName} width={22} />
        </Box>

        {/* Main info */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
            sx={{ flexWrap: 'wrap', rowGap: 0.5 }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }} noWrap>
              {row.name}
            </Typography>
            <Label variant="soft" color="default">
              {BILLING_CYCLE_LABEL[row.cycle]}
            </Label>
            {!row.active && (
              <Label variant="soft" color="default">
                Tạm dừng
              </Label>
            )}
          </Stack>

          <Typography
            variant="caption"
            color={overdue ? 'error.main' : dueSoon ? 'warning.main' : 'text.secondary'}
            sx={{ display: 'block', mt: 0.25 }}
          >
            {row.active ? (
              <>
                {dueLabel(row.daysUntilDue, row.cycle)} · Đến hạn{' '}
                {fDate(row.nextDueDate, 'DD/MM/YYYY')}
              </>
            ) : (
              <>Đã tạm dừng</>
            )}
          </Typography>

          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
            {row.categoryName}
            {row.monthlyEquivalent !== row.amount && (
              <> · ≈ {fCurrency(row.monthlyEquivalent)}/tháng</>
            )}
          </Typography>
        </Box>

        {/* Amount + actions */}
        <Stack alignItems="flex-end" spacing={1}>
          <Typography variant="subtitle1" className="tabular" sx={{ fontWeight: 700 }}>
            {fCurrency(row.amount)}
          </Typography>
          <Stack direction="row" spacing={0.5}>
            {row.active && (
              <Button
                size="small"
                variant="contained"
                color="primary"
                disabled={isPending}
                onClick={() => setPayOpen(true)}
                startIcon={<Iconify icon="solar:check-circle-bold" width={16} />}
              >
                Đã thanh toán
              </Button>
            )}
            <IconButton size="small" onClick={(e) => setMenuAnchor(e.currentTarget)}>
              <Iconify icon="eva:more-vertical-fill" width={18} />
            </IconButton>
          </Stack>
        </Stack>
      </Stack>

      <Menu anchorEl={menuAnchor} open={!!menuAnchor} onClose={closeMenu}>
        <MenuItem
          onClick={() => {
            closeMenu();
            onEdit(row);
          }}
        >
          <Iconify icon="solar:pen-bold" width={18} sx={{ mr: 1 }} />
          Sửa
        </MenuItem>
        <MenuItem onClick={handleToggleActive}>
          <Iconify
            icon={row.active ? 'solar:stop-circle-bold' : 'solar:play-circle-bold'}
            width={18}
            sx={{ mr: 1 }}
          />
          {row.active ? 'Tạm dừng' : 'Kích hoạt'}
        </MenuItem>
        <MenuItem
          onClick={() => {
            closeMenu();
            setDeleteOpen(true);
          }}
          sx={{ color: 'error.main' }}
        >
          <Iconify icon="solar:trash-bin-trash-bold" width={18} sx={{ mr: 1 }} />
          Xoá
        </MenuItem>
      </Menu>

      <ConfirmDialog
        open={payOpen}
        onClose={() => setPayOpen(false)}
        title={`Ghi nhận thanh toán ${row.name}?`}
        content={
          <>
            Sẽ tạo giao dịch <strong>chi {fCurrency(row.amount)}</strong> ({row.categoryName}) ngày{' '}
            {fDate(row.nextDueDate, 'DD/MM/YYYY')} và đẩy ngày đến hạn kế tiếp sang{' '}
            <strong>{fDate(nextDue, 'DD/MM/YYYY')}</strong> (sau 1 {BILLING_CYCLE_SHORT[row.cycle]}
            ).
          </>
        }
        action={
          <Button variant="contained" color="primary" disabled={isPending} onClick={confirmPaid}>
            Xác nhận
          </Button>
        }
      />

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Xoá hoá đơn?"
        content={`Hành động này sẽ xoá "${row.name}" và không thể hoàn tác. Các giao dịch đã ghi nhận trước đó sẽ không bị ảnh hưởng.`}
        action={
          <Button variant="contained" color="error" disabled={isPending} onClick={confirmDelete}>
            Xoá
          </Button>
        }
      />
    </Card>
  );
}
