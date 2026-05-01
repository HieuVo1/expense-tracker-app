'use client';

import type { IconifyName } from 'src/components/iconify';

import dayjs from 'dayjs';
import { useState, useTransition } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { fCurrency } from 'src/utils/format-number';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

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

// Preview mode shown after a multi-transaction OCR scan. User can adjust each
// row's category (the AI / merchant memory pre-fills it), remove any false
// positives, then bulk-save. Amount/date/description are read-only here — for
// inline editing they'd need their own RHF form per row, which is overkill at
// this scale; user can always edit individual rows in the history list later.
// Date desc, then amount desc as tie-breaker, so larger transactions on the
// same day surface first. Mirrors how the dashboard lists transactions —
// keeps the user's mental ordering consistent across screens.
function sortByDateDesc(items: PreviewItem[]) {
  return [...items].sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1;
    return b.amount - a.amount;
  });
}

export function TransactionScanPreview({ items: initialItems, categories, onCancel }: Props) {
  const router = useRouter();
  const [items, setItems] = useState<PreviewItem[]>(() => sortByDateDesc(initialItems));
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Net flow: income adds, expense subtracts. Display Chi/Thu tổng riêng để
  // user dễ nhìn screenshot có nhiều income (chuyển khoản nội bộ, lãi tiền gửi).
  const totalExpense = items
    .filter((i) => i.type === 'expense')
    .reduce((s, i) => s + i.amount, 0);
  const totalIncome = items
    .filter((i) => i.type === 'income')
    .reduce((s, i) => s + i.amount, 0);

  const updateCategory = (uid: string, categoryId: string) => {
    setItems((prev) => prev.map((i) => (i.uid === uid ? { ...i, categoryId } : i)));
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

  return (
    <Stack spacing={3}>
      {!!error && <Alert severity="error">{error}</Alert>}

      <Alert severity="info" icon={<Iconify icon="solar:check-circle-bold" />}>
        Phát hiện <strong>{items.length}</strong> giao dịch — kiểm tra danh mục rồi bấm{' '}
        <strong>Lưu tất cả</strong>.
      </Alert>

      <Card>
        <Box
          sx={{
            p: 2.5,
            display: 'flex',
            gap: 3,
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '0.5px solid',
            borderColor: 'divider',
          }}
        >
          <Typography variant="subtitle2">Tổng cộng</Typography>
          <Box sx={{ display: 'flex', gap: 3 }}>
            {totalExpense > 0 && (
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="caption" color="text.secondary">
                  Chi
                </Typography>
                <Typography variant="subtitle1" className="tabular">
                  −{fCurrency(totalExpense)}
                </Typography>
              </Box>
            )}
            {totalIncome > 0 && (
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="caption" color="text.secondary">
                  Thu
                </Typography>
                <Typography
                  variant="subtitle1"
                  className="tabular"
                  sx={{ color: 'success.dark' }}
                >
                  +{fCurrency(totalIncome)}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>

        {items.length === 0 ? (
          <Box sx={{ p: 5, textAlign: 'center' }}>
            <Typography color="text.secondary">Đã xoá hết giao dịch.</Typography>
          </Box>
        ) : (
          items.map((item, idx) => {
            const category = categories.find((c) => c.id === item.categoryId);
            return (
              <Box
                key={item.uid}
                sx={{
                  p: 2.5,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1.5,
                  borderTop: idx > 0 ? '0.5px solid' : 'none',
                  borderColor: 'divider',
                }}
              >
                {/* Top row — icon + meta. Layout matches transaction list item
                    so the user reads "row of money" the same way everywhere. */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  {category && (
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        display: 'grid',
                        placeItems: 'center',
                        borderRadius: 1,
                        bgcolor: `${category.color}1a`,
                        color: category.color,
                        flexShrink: 0,
                      }}
                    >
                      <Iconify icon={category.icon as IconifyName} width={20} />
                    </Box>
                  )}

                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" noWrap>
                      {item.description}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1.5, mt: 0.25, flexWrap: 'wrap' }}>
                      <Typography variant="caption" color="text.secondary">
                        {dayjs(item.date).format('DD/MM/YYYY')}
                      </Typography>
                      <Typography
                        variant="caption"
                        className="tabular"
                        sx={{
                          fontWeight: 500,
                          color: item.type === 'income' ? 'success.dark' : 'text.primary',
                        }}
                      >
                        {item.type === 'income' ? '+' : '−'}
                        {fCurrency(item.amount)}
                      </Typography>
                      {item.merchant && (
                        <Typography variant="caption" color="text.secondary">
                          · {item.merchant}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </Box>

                {/* Bottom row — category select stretches, trash sits beside
                    it. Same visual rhythm whether mobile or desktop. */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pl: { xs: 0, sm: 7 } }}>
                  <Select
                    size="small"
                    value={item.categoryId}
                    onChange={(e) => updateCategory(item.uid, e.target.value)}
                    sx={{ flex: 1, minWidth: 0 }}
                  >
                    {/* Type-locked options keep a Chi row from saving as "Lương". */}
                    {categories
                      .filter((c) => c.type === item.type)
                      .map((c) => (
                        <MenuItem key={c.id} value={c.id}>
                          {c.name}
                        </MenuItem>
                      ))}
                  </Select>

                  <IconButton
                    size="small"
                    onClick={() => removeItem(item.uid)}
                    aria-label="Xoá khỏi danh sách"
                  >
                    <Iconify icon="solar:trash-bin-trash-bold" width={18} />
                  </IconButton>
                </Box>
              </Box>
            );
          })
        )}
      </Card>

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
    </Stack>
  );
}
