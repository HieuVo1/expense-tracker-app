import type { TransactionType } from '@prisma/client';

import dayjs from 'dayjs';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { fCurrency } from 'src/utils/format-number';
import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';

import { TransactionListItem } from '../components/transaction-list-item';
import { TransactionFilterBar } from '../components/transaction-filter-bar';
import { listTransactions, listCategoriesForForm } from '../actions/transaction-actions';

type Props = {
  searchParams: { type?: string; categoryId?: string };
};

// Group "Hôm nay / Hôm qua / 25 thg 3 2026" — Vietnamese conventions.
function formatGroupLabel(dateIso: string) {
  const today = dayjs().startOf('day');
  const yesterday = today.subtract(1, 'day');
  const d = dayjs(dateIso).startOf('day');

  if (d.isSame(today)) return 'Hôm nay';
  if (d.isSame(yesterday)) return 'Hôm qua';
  return d.format('DD [thg] M YYYY');
}

export async function TransactionListView({ searchParams }: Props) {
  // Coerce searchParams to typed filter — drop unknown values silently.
  const type =
    searchParams.type === 'expense' || searchParams.type === 'income'
      ? (searchParams.type as TransactionType)
      : undefined;

  const [transactions, categories] = await Promise.all([
    listTransactions({ type, categoryId: searchParams.categoryId }),
    listCategoriesForForm(),
  ]);

  // Group by date string for the section headers.
  const grouped = transactions.reduce<Record<string, typeof transactions>>((acc, t) => {
    (acc[t.date] ??= []).push(t);
    return acc;
  }, {});
  const groupKeys = Object.keys(grouped);

  // Compute current-month totals for the header summary card.
  const monthStart = dayjs().startOf('month');
  const inMonth = transactions.filter((t) => dayjs(t.date).isAfter(monthStart.subtract(1, 'day')));
  const totalExpense = inMonth.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const totalIncome = inMonth.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);

  return (
    <DashboardContent>
      <Stack spacing={3}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
          <Box>
            <Typography variant="h4" sx={{ mb: 0.5 }}>
              Giao dịch
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Lịch sử chi tiêu, sắp xếp theo ngày
            </Typography>
          </Box>
          <Button
            variant="contained"
            href={paths.dashboard.addTransaction}
            startIcon={<Iconify icon="solar:add-circle-bold" />}
          >
            Thêm giao dịch
          </Button>
        </Box>

        <Card sx={{ p: 2.5, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Chi tháng này
            </Typography>
            <Typography variant="h5" className="tabular" sx={{ color: 'text.primary' }}>
              {fCurrency(totalExpense)}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Thu tháng này
            </Typography>
            <Typography variant="h5" className="tabular" sx={{ color: 'success.dark' }}>
              {fCurrency(totalIncome)}
            </Typography>
          </Box>
        </Card>

        <TransactionFilterBar categories={categories} />

        {groupKeys.length === 0 ? (
          <Card sx={{ p: 5, textAlign: 'center' }}>
            <Typography color="text.secondary">
              Chưa có giao dịch nào. Bấm <strong>Thêm giao dịch</strong> để bắt đầu.
            </Typography>
          </Card>
        ) : (
          <Stack spacing={2.5}>
            {groupKeys.map((dateKey) => (
              <Box key={dateKey}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ ml: 0.5, mb: 1, display: 'block', textTransform: 'uppercase' }}
                >
                  {formatGroupLabel(dateKey)}
                </Typography>
                <Card>
                  {grouped[dateKey].map((t) => (
                    <TransactionListItem key={t.id} transaction={t} />
                  ))}
                </Card>
              </Box>
            ))}
          </Stack>
        )}
      </Stack>
    </DashboardContent>
  );
}
