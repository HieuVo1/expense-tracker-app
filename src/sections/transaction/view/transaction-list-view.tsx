import type { TransactionType } from '@prisma/client';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';

import { ImportCsvButton } from '../components/import-csv-button';
import { TransactionFilterBar } from '../components/transaction-filter-bar';
import { TransactionListGrouped } from '../components/transaction-list-grouped';
import { listTransactions, listCategoriesForForm } from '../actions/transaction-actions';

const PAGE_SIZE = 100;

type Props = {
  searchParams: {
    type?: string;
    categoryId?: string;
    q?: string;
    month?: string;
    day?: string;
    min?: string;
    max?: string;
  };
};

// Parse a string searchParam to a positive integer. Returns undefined for
// missing/blank/invalid values so the filter falls back to "no bound".
function parseAmountParam(raw: string | undefined): number | undefined {
  if (!raw) return undefined;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : undefined;
}

export async function TransactionListView({ searchParams }: Props) {
  // Coerce searchParams to typed filter — drop unknown values silently.
  const type =
    searchParams.type === 'expense' || searchParams.type === 'income'
      ? (searchParams.type as TransactionType)
      : undefined;

  const filter = {
    type,
    categoryId: searchParams.categoryId,
    q: searchParams.q,
    month: searchParams.month,
    day: searchParams.day,
    minAmount: parseAmountParam(searchParams.min),
    maxAmount: parseAmountParam(searchParams.max),
  };

  const [page, categories] = await Promise.all([
    listTransactions(filter, { take: PAGE_SIZE }),
    listCategoriesForForm(),
  ]);

  const hasActiveFilter = !!(
    searchParams.type ||
    searchParams.categoryId ||
    searchParams.q ||
    searchParams.month ||
    searchParams.day ||
    searchParams.min ||
    searchParams.max
  );
  // Filter signature drives the client component's `key` so it remounts (and
  // resets its appended-rows state) whenever the user changes a filter.
  const filterKey = [
    type ?? '',
    searchParams.categoryId ?? '',
    searchParams.q ?? '',
    searchParams.month ?? '',
    searchParams.day ?? '',
    searchParams.min ?? '',
    searchParams.max ?? '',
  ].join('|');

  // Build the export URL by re-encoding only the filter-relevant searchParams,
  // so the CSV always matches the current view (filtered or full).
  const exportParams = new URLSearchParams();
  for (const k of ['type', 'categoryId', 'q', 'month', 'day', 'min', 'max'] as const) {
    const v = searchParams[k];
    if (v) exportParams.set(k, v);
  }
  const exportQuery = exportParams.toString();
  const exportHref = exportQuery ? `/api/reports/export?${exportQuery}` : '/api/reports/export';

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
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            <Button
              component="a"
              href={exportHref}
              variant="outlined"
              startIcon={<Iconify icon="solar:download-bold" />}
            >
              Xuất CSV
            </Button>
            <ImportCsvButton />
            <Button
              variant="contained"
              href={paths.dashboard.addTransaction}
              startIcon={<Iconify icon="solar:add-circle-bold" />}
              sx={{ display: { xs: 'none', lg: 'inline-flex' } }}
            >
              Thêm giao dịch
            </Button>
          </Box>
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
