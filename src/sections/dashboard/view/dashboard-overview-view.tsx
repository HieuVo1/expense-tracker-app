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
import { getPlan, listPlans } from 'src/sections/plan/actions/plan-actions';
import { computeSubscriptionTotals } from 'src/sections/subscription/utils/summary';
import { TopMerchantsCard } from 'src/sections/report/components/top-merchants-card';
import { MonthlyTrendChart } from 'src/sections/report/components/monthly-trend-chart';
import { TopTransactionsCard } from 'src/sections/report/components/top-transactions-card';
import { listSubscriptions } from 'src/sections/subscription/actions/subscription-actions';
import { SubscriptionDashboardCard } from 'src/sections/subscription/components/subscription-dashboard-card';

import { MonthPicker } from '../components/month-picker';
import { CategoryDonut } from '../components/category-donut';
import { BudgetProgress } from '../components/budget-progress';
import { getDashboardData } from '../actions/dashboard-actions';
import { getDashboardReminders } from '../actions/dashboard-reminders';
import { CurrentWeekPlanCard } from '../components/current-week-plan-card';
import { DashboardRemindersCard } from '../components/dashboard-reminders-card';

type Props = {
  searchParams?: { month?: string };
};

// Single landing view that combines the at-a-glance summary (this month) with
// the 6-month trend and rankings — fewer hops for the user, and the month
// picker drives both halves consistently.
export async function DashboardOverviewView({ searchParams }: Props) {
  const [data, reportData, allPlans, reminders, subs] = await Promise.all([
    getDashboardData(searchParams?.month),
    getReportData(searchParams?.month),
    listPlans(),
    getDashboardReminders(),
    listSubscriptions(),
  ]);

  // Current weekly plan: scope=weekly, active, today within [startDate, endDate].
  // `listPlans` already sorts with isCurrent=true plans first, so `.find` picks
  // the most-relevant row. If multiple overlapping weekly plans exist (data anomaly),
  // the first match (earliest by startDate DESC from DB sort) is used.
  const currentWeekRow = allPlans.find((p) => p.scope === 'weekly' && p.isCurrent) ?? null;
  const currentWeekPlan = currentWeekRow ? await getPlan(currentWeekRow.id) : null;

  const subTotals = computeSubscriptionTotals(subs);
  const upcomingSubs = subs
    .filter((s) => s.active)
    .sort((a, b) => a.daysUntilDue - b.daysUntilDue)
    .slice(0, 5);

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

        <CurrentWeekPlanCard plan={currentWeekPlan} />

        <SubscriptionDashboardCard upcoming={upcomingSubs} totals={subTotals} />

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
