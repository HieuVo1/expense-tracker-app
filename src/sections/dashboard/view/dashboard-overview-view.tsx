import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';

import { getReportData } from 'src/sections/report/actions/report-actions';
import { TopMerchantsCard } from 'src/sections/report/components/top-merchants-card';
import { MonthlyTrendChart } from 'src/sections/report/components/monthly-trend-chart';
import { TopTransactionsCard } from 'src/sections/report/components/top-transactions-card';

import { MonthPicker } from '../components/month-picker';
import { SummaryCard } from '../components/summary-card';
import { CategoryDonut } from '../components/category-donut';
import { BudgetProgress } from '../components/budget-progress';
import { getDashboardData } from '../actions/dashboard-actions';
import { ImportCsvButton } from '../components/import-csv-button';

type Props = {
  searchParams?: { month?: string };
};

// Single landing view that combines the at-a-glance summary (this month) with
// the 6-month trend and rankings — fewer hops for the user, and the month
// picker drives both halves consistently.
export async function DashboardOverviewView({ searchParams }: Props) {
  const [data, reportData] = await Promise.all([
    getDashboardData(searchParams?.month),
    getReportData(searchParams?.month),
  ]);

  return (
    <DashboardContent>
      <Stack spacing={3}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 2,
            flexWrap: 'wrap',
          }}
        >
          <Box>
            <Typography variant="h4" sx={{ mb: 0.5 }}>
              Tổng quan
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Tóm tắt và phân tích chi tiêu tháng {data.monthLabel}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <MonthPicker />
            <Button
              component="a"
              href={
                searchParams?.month
                  ? `/api/reports/export?month=${encodeURIComponent(searchParams.month)}`
                  : '/api/reports/export'
              }
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

        <SummaryCard
          totalExpense={data.totalExpense}
          totalIncome={data.totalIncome}
          expenseDeltaPct={data.expenseDeltaPct}
          monthLabel={data.monthLabel}
        />

        <MonthlyTrendChart data={reportData.monthlyTrend} />

        <CategoryDonut expenseData={data.byCategory} incomeData={data.incomeByCategory} />

        <BudgetProgress rows={data.byCategory} />

        <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
          <TopTransactionsCard rows={reportData.topTransactions} />
          <TopMerchantsCard rows={reportData.topMerchants} />
        </Box>
      </Stack>
    </DashboardContent>
  );
}
