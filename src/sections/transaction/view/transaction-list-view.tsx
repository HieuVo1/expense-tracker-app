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

type Tx = Awaited<ReturnType<typeof listTransactions>>[number];

// Net flow for a day's transactions: income +, expense −. Used in the section
// header beside the date so user reads the day's bottom-line at a glance.
function dayNet(rows: Tx[]) {
  return rows.reduce((s, t) => s + (t.type === 'income' ? t.amount : -t.amount), 0);
}

type Props = {
  searchParams: { type?: string; categoryId?: string; q?: string };
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
    listTransactions({ type, categoryId: searchParams.categoryId, q: searchParams.q }),
    listCategoriesForForm(),
  ]);

  // Group by date string for the section headers.
  const grouped = transactions.reduce<Record<string, typeof transactions>>((acc, t) => {
    (acc[t.date] ??= []).push(t);
    return acc;
  }, {});
  const groupKeys = Object.keys(grouped);

  const hasActiveFilter = !!(searchParams.type || searchParams.categoryId || searchParams.q);

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
            sx={{ display: { xs: 'none', lg: 'inline-flex' } }}
          >
            Thêm giao dịch
          </Button>
        </Box>

        <TransactionFilterBar categories={categories} />

        {groupKeys.length === 0 ? (
          <Card sx={{ p: 5, textAlign: 'center' }}>
            <Typography color="text.secondary">
              {hasActiveFilter
                ? 'Không có giao dịch khớp bộ lọc.'
                : 'Chưa có giao dịch nào. Bấm "+" để bắt đầu.'}
            </Typography>
          </Card>
        ) : (
          <Stack spacing={2.5}>
            {groupKeys.map((dateKey) => {
              const net = dayNet(grouped[dateKey]);
              const netPositive = net >= 0;
              return (
                <Box key={dateKey}>
                  {/* Date label + net total inline — matches the design where
                      the user reads "Hôm nay, 24 Tháng 4 ............. −420.000đ". */}
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
                    {grouped[dateKey].map((t) => (
                      <TransactionListItem key={t.id} transaction={t} />
                    ))}
                  </Card>
                </Box>
              );
            })}
          </Stack>
        )}
      </Stack>
    </DashboardContent>
  );
}
