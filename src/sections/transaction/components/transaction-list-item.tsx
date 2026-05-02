'use client';

import type { IconifyName } from 'src/components/iconify';

import { useState, useTransition } from 'react';

import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { fCurrency } from 'src/utils/format-number';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';

import { TransactionEditDialog } from './transaction-edit-dialog';
import { deleteTransaction } from '../actions/transaction-actions';

type Props = {
  transaction: {
    id: string;
    amount: number;
    type: 'expense' | 'income';
    date: string;
    description: string | null;
    category: { id: string; name: string; icon: string; color: string };
  };
};

export function TransactionListItem({ transaction }: Props) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      try {
        await deleteTransaction(transaction.id);
        toast.success('Đã xoá giao dịch');
        setConfirmOpen(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Xoá thất bại');
      }
    });
  };

  const sign = transaction.type === 'expense' ? '−' : '+';
  const amountColor = transaction.type === 'expense' ? 'text.primary' : 'success.dark';

  return (
    <>
      <Box
        sx={{
          py: 1.75,
          px: 2.5,
          gap: 2,
          display: 'flex',
          alignItems: 'center',
          borderBottom: '0.5px solid',
          borderColor: 'divider',
          '&:last-of-type': { borderBottom: 'none' },
        }}
      >
        <Box
          sx={{
            width: 36,
            height: 36,
            display: 'grid',
            placeItems: 'center',
            borderRadius: 1,
            bgcolor: `${transaction.category.color}1a`,
            color: transaction.category.color,
            flexShrink: 0,
          }}
        >
          <Iconify icon={transaction.category.icon as IconifyName} width={20} />
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body2" noWrap>
            {transaction.description || transaction.category.name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {transaction.category.name} · {transaction.date.slice(11, 16)}
          </Typography>
        </Box>

        <Typography
          className="tabular"
          variant="subtitle2"
          sx={{ color: amountColor, whiteSpace: 'nowrap' }}
        >
          {sign}
          {fCurrency(transaction.amount)}
        </Typography>

        <IconButton
          size="small"
          onClick={() => setEditOpen(true)}
          aria-label="Sửa"
          sx={{ ml: 0.5 }}
        >
          <Iconify icon="solar:pen-bold" width={18} />
        </IconButton>

        <IconButton
          size="small"
          onClick={() => setConfirmOpen(true)}
          aria-label="Xoá"
        >
          <Iconify icon="solar:trash-bin-trash-bold" width={18} />
        </IconButton>
      </Box>

      <TransactionEditDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        transaction={transaction}
      />

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Xoá giao dịch?"
        content="Hành động này không thể hoàn tác."
        action={
          <IconButton
            disabled={isPending}
            onClick={handleDelete}
            sx={{
              px: 2,
              borderRadius: 1,
              color: 'error.contrastText',
              bgcolor: 'error.main',
              '&:hover': { bgcolor: 'error.dark' },
            }}
          >
            <Typography variant="button">Xoá</Typography>
          </IconButton>
        }
      />
    </>
  );
}
