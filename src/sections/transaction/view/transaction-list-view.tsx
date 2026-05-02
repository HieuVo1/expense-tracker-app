import type { TransactionType } from '@prisma/client';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';

import { TransactionFilterBar } from '../components/transaction-filter-bar';
import { TransactionListGrouped } from '../components/transaction-list-grouped';
import { listTransactions, listCategoriesForForm } from '../actions/transaction-actions';

const PAGE_SIZE = 50;

type Props = {
  searchParams: { type?: string; categoryId?: string; q?: string };
};

export async function TransactionListView({ searchParams }: Props) {
  // Coerce searchParams to typed filter — drop unknown values silently.
  const type =
    searchParams.type === 'expense' || searchParams.type === 'income'
      ? (searchParams.type as TransactionType)
      : undefined;

  const filter = { type, categoryId: searchParams.categoryId, q: searchParams.q };

  const [page, categories] = await Promise.all([
    listTransactions(filter, { take: PAGE_SIZE }),
    listCategoriesForForm(),
  ]);

  const hasActiveFilter = !!(searchParams.type || searchParams.categoryId || searchParams.q);
  // Filter signature drives the client component's `key` so it remounts (and
  // resets its appended-rows state) whenever the user changes a filter.
  const filterKey = `${type ?? ''}|${searchParams.categoryId ?? ''}|${searchParams.q ?? ''}`;

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

        {page.rows.length === 0 ? (
          <Card sx={{ p: 5, textAlign: 'center' }}>
            <Typography color="text.secondary">
              {hasActiveFilter
                ? 'Không có giao dịch khớp bộ lọc.'
                : 'Chưa có giao dịch nào. Bấm "+" để bắt đầu.'}
            </Typography>
          </Card>
        ) : (
          <TransactionListGrouped
            key={filterKey}
            initialRows={page.rows}
            initialHasMore={page.hasMore}
            filter={filter}
            pageSize={PAGE_SIZE}
          />
        )}
      </Stack>
    </DashboardContent>
  );
}
