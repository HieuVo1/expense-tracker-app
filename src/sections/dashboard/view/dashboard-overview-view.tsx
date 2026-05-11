import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';
import { SummaryCard } from 'src/components/summary-card';

import { getReportData } from 'src/sections/report/actions/report-actions';
import { TopMerchantsCard } from 'src/sections/report/components/top-merchants-card';
import { MonthlyTrendChart } from 'src/sections/report/components/monthly-trend-chart';
import { TopTransactionsCard } from 'src/sections/report/components/top-transactions-card';

import { MonthPicker } from '../components/month-picker';
import { CategoryDonut } from '../components/category-donut';
import { BudgetProgress } from '../components/budget-progress';
import { getDashboardData } from '../actions/dashboard-actions';

type Props = {
  searchParams?: { month?: string };
};

/**
 * Pure chi-tiêu detail page — month-scoped totals, trend, category breakdown,
 * budget progress, top transactions/merchants. Cross-domain items (reminders,
 * weekly plan, subs, daily reflection) live on the /dashboard hub.
 */
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
              Chi tiêu
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Tóm tắt và phân tích chi tiêu tháng {data.monthLabel}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <MonthPicker />
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

        {/* 4 gradient summary cards — distinct color per metric (no two greens). */}
        <Grid container spacing={3}>
          {[
            {
              title: 'Tổng giao dịch',
              total: data.totalExpense + data.totalIncome,
              color: 'secondary' as const,
              icon: <Iconify icon="solar:card-bold" width={48} />,
            },
            {
              title: `Tổng chi tháng ${data.monthLabel}`,
              // Show as negative so the user reads "-X ₫" — reinforces "money out".
              total: -data.totalExpense,
              color: 'error' as const,
              icon: <Iconify icon="solar:wallet-money-bold" width={48} />,
            },
            {
              title: `Tổng thu tháng ${data.monthLabel}`,
              total: data.totalIncome,
              color: 'success' as const,
              icon: <Iconify icon="solar:hand-money-bold" width={48} />,
            },
            {
              title: 'Số dư tháng này',
              total: data.totalIncome - data.totalExpense,
              color: 'info' as const,
              icon: <Iconify icon="solar:graph-up-bold" width={48} />,
            },
          ].map((card) => (
            <Grid key={card.title} size={{ xs: 12, sm: 6, md: 3 }}>
              <SummaryCard
                title={card.title}
                total={card.total}
                percent={0}
                color={card.color}
                icon={card.icon}
                chart={{ series: [], categories: [] }}
                format="currency"
              />
            </Grid>
          ))}
        </Grid>

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
