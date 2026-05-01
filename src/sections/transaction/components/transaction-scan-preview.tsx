'use client';

import type { IconifyName } from 'src/components/iconify';

import dayjs from 'dayjs';
import { useState, useTransition } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { fCurrency } from 'src/utils/format-number';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

import { TransactionScanEditDialog } from './transaction-scan-edit-dialog';
import { createTransactionsBatch } from '../actions/transaction-actions';

type Category = {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'expense' | 'income';
};

export type PreviewItem = {
  // Stable client-side key — index isn't enough since rows can be deleted.
  uid: string;
  amount: number;
  type: 'expense' | 'income';
  date: string;
  description: string;
  merchant?: string;
  categoryId: string;
};

type Props = {
  items: PreviewItem[];
  categories: Category[];
  onCancel: () => void;
};

// Same Vietnamese conventions as the saved-transactions list view — keeps
// grouping headers identical so user reads the two pages the same way.
function formatGroupLabel(dateIso: string) {
  const today = dayjs().startOf('day');
  const yesterday = today.subtract(1, 'day');
  const d = dayjs(dateIso).startOf('day');
  if (d.isSame(today)) return 'Hôm nay';
  if (d.isSame(yesterday)) return 'Hôm qua';
  return d.format('DD [thg] M YYYY');
}

function dayNet(rows: PreviewItem[]) {
  return rows.reduce((s, t) => s + (t.type === 'income' ? t.amount : -t.amount), 0);
}

export function TransactionScanPreview({ items: initialItems, categories, onCancel }: Props) {
  const router = useRouter();
  const [items, setItems] = useState<PreviewItem[]>(initialItems);
  const [error, setError] = useState<string | null>(null);
  const [editingUid, setEditingUid] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const editingItem = editingUid ? items.find((i) => i.uid === editingUid) ?? null : null;

  const updateItem = (updated: PreviewItem) => {
    setItems((prev) => prev.map((i) => (i.uid === updated.uid ? updated : i)));
  };

  const removeItem = (uid: string) => {
    setItems((prev) => prev.filter((i) => i.uid !== uid));
  };

  const handleSaveAll = () => {
    setError(null);
    if (items.length === 0) {
      onCancel();
      return;
    }
    startTransition(async () => {
      try {
        const res = await createTransactionsBatch(
          items.map((i) => ({
            amount: i.amount,
            type: i.type,
            categoryId: i.categoryId,
            date: i.date,
            description: i.description,
            merchant: i.merchant,
          }))
        );
        toast.success(`Đã lưu ${res.count} giao dịch`);
        router.push(paths.dashboard.transactions);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Có lỗi xảy ra');
      }
    });
  };

  // Group by date desc, then amount desc within a day — bigger transactions
  // surface first, matching the saved list view ordering.
  const grouped = items.reduce<Record<string, PreviewItem[]>>((acc, t) => {
    (acc[t.date] ??= []).push(t);
    return acc;
  }, {});
  const groupKeys = Object.keys(grouped).sort((a, b) => (a < b ? 1 : -1));
  for (const key of groupKeys) {
    grouped[key].sort((a, b) => b.amount - a.amount);
  }

  return (
    <Stack spacing={3}>
      {!!error && <Alert severity="error">{error}</Alert>}

      <Alert severity="info" icon={<Iconify icon="solar:check-circle-bold" />}>
        Phát hiện <strong>{items.length}</strong> giao dịch — kiểm tra rồi bấm{' '}
        <strong>Lưu tất cả</strong>.
      </Alert>

      {items.length === 0 ? (
        <Card sx={{ p: 5, textAlign: 'center' }}>
          <Typography color="text.secondary">Đã xoá hết giao dịch.</Typography>
        </Card>
      ) : (
        <Stack spacing={2.5}>
          {groupKeys.map((dateKey) => {
            const net = dayNet(grouped[dateKey]);
            const netPositive = net >= 0;
            return (
              <Box key={dateKey}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'baseline',
                    justifyContent: 'space-between',
                    gap: 2,
                    mb: 1,
                    px: 0.5,
                  }}
                >
                  <Typography variant="subtitle2" color="text.primary">
                    {formatGroupLabel(dateKey)}
                  </Typography>
                  <Typography
                    className="tabular"
                    variant="caption"
                    sx={{ color: netPositive ? 'success.dark' : 'text.secondary' }}
                  >
                    {netPositive ? '+' : '−'}
                    {fCurrency(Math.abs(net))}
                  </Typography>
                </Box>
                <Card>
                  {grouped[dateKey].map((item) => (
                    <ScanRow
                      key={item.uid}
                      item={item}
                      categories={categories}
                      onEdit={() => setEditingUid(item.uid)}
                      onDelete={() => removeItem(item.uid)}
                    />
                  ))}
                </Card>
              </Box>
            );
          })}
        </Stack>
      )}

      <Divider />

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button onClick={onCancel} color="inherit" disabled={isPending}>
          Quay lại nhập tay
        </Button>
        <Button
          variant="contained"
          onClick={handleSaveAll}
          loading={isPending}
          disabled={items.length === 0}
        >
          Lưu {items.length} giao dịch
        </Button>
      </Box>

      <TransactionScanEditDialog
        open={!!editingItem}
        onClose={() => setEditingUid(null)}
        item={editingItem}
        categories={categories}
        onSave={updateItem}
      />
    </Stack>
  );
}

type RowProps = {
  item: PreviewItem;
  categories: Category[];
  onEdit: () => void;
  onDelete: () => void;
};

function ScanRow({ item, categories, onEdit, onDelete }: RowProps) {
  const category = categories.find((c) => c.id === item.categoryId);
  const sign = item.type === 'expense' ? '−' : '+';
  const amountColor = item.type === 'expense' ? 'text.primary' : 'success.dark';
  const caption = [category?.name ?? '—', item.merchant].filter(Boolean).join(' · ');

  return (
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
          bgcolor: category ? `${category.color}1a` : 'action.hover',
          color: category?.color,
          flexShrink: 0,
        }}
      >
        {category && <Iconify icon={category.icon as IconifyName} width={20} />}
      </Box>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body2" noWrap>
          {item.description || category?.name}
        </Typography>
        <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
          {caption}
        </Typography>
      </Box>

      <Typography
        className="tabular"
        variant="subtitle2"
        sx={{ color: amountColor, whiteSpace: 'nowrap' }}
      >
        {sign}
        {fCurrency(item.amount)}
      </Typography>

      <IconButton size="small" onClick={onEdit} aria-label="Sửa" sx={{ ml: 0.5 }}>
        <Iconify icon="solar:pen-bold" width={18} />
      </IconButton>

      <IconButton size="small" onClick={onDelete} aria-label="Xoá">
        <Iconify icon="solar:trash-bin-trash-bold" width={18} />
      </IconButton>
    </Box>
  );
}
