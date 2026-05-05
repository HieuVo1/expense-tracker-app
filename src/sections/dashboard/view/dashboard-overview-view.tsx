import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';

import { getReportData } from 'src/sections/report/actions/report-actions';
import { getPlan, listPlans } from 'src/sections/plan/actions/plan-actions';
import { TopMerchantsCard } from 'src/sections/report/components/top-merchants-card';
import { MonthlyTrendChart } from 'src/sections/report/components/monthly-trend-chart';
import { TopTransactionsCard } from 'src/sections/report/components/top-transactions-card';

import { MonthPicker } from '../components/month-picker';
import { SummaryCard } from '../components/summary-card';
import { CategoryDonut } from '../components/category-donut';
import { BudgetProgress } from '../components/budget-progress';
import { getDashboardData } from '../actions/dashboard-actions';
import { CurrentWeekPlanCard } from '../components/current-week-plan-card';
import { getDashboardReminders } from '../actions/dashboard-reminders';
import { DashboardRemindersCard } from '../components/dashboard-reminders-card';

type Props = {
  searchParams?: { month?: string };
};

// Single landing view that combines the at-a-glance summary (this month) with
// the 6-month trend and rankings — fewer hops for the user, and the month
// picker drives both halves consistently.
export async function DashboardOverviewView({ searchParams }: Props) {
  const [data, reportData, allPlans, reminders] = await Promise.all([
    getDashboardData(searchParams?.month),
    getReportData(searchParams?.month),
    listPlans(),
    getDashboardReminders(),
  ]);

  // Current weekly plan: scope=weekly, active, today within [startDate, endDate].
  // `listPlans` already sorts with isCurrent=true plans first, so `.find` picks
  // the most-relevant row. If multiple overlapping weekly plans exist (data anomaly),
  // the first match (earliest by startDate DESC from DB sort) is used.
  const currentWeekRow = allPlans.find((p) => p.scope === 'weekly' && p.isCurrent) ?? null;
  const currentWeekPlan = currentWeekRow ? await getPlan(currentWeekRow.id) : null;

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
              variant="contained"
              href={paths.dashboard.addTransaction}
              startIcon={<Iconify icon="solar:add-circle-bold" />}
              sx={{ display: { xs: 'none', lg: 'inline-flex' } }}
            >
              Thêm giao dịch
            </Button>
          </Box>
        </Box>

        {/* Reminders — shown FIRST when there's anything pending so user sees it on app open. */}
        <DashboardRemindersCard reminders={reminders} />

        <SummaryCard
          totalExpense={data.totalExpense}
          totalIncome={data.totalIncome}
          expenseDeltaPct={data.expenseDeltaPct}
          monthLabel={data.monthLabel}
        />

        <CurrentWeekPlanCard plan={currentWeekPlan} />

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
