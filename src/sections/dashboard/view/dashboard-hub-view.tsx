import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';

import { fCurrency } from 'src/utils/format-number';

import { DashboardContent } from 'src/layouts/dashboard';

import { HorizontalScrollStrip } from 'src/components/horizontal-scroll-strip';

import { listAssets } from 'src/sections/asset/actions/asset-actions';
import { getReportData } from 'src/sections/report/actions/report-actions';
import { getPlan, listPlans } from 'src/sections/plan/actions/plan-actions';
import { getAboutMeStats } from 'src/sections/about-me/actions/about-me-stats';
import { computeSubscriptionTotals } from 'src/sections/subscription/utils/summary';
import { MonthlyTrendChart } from 'src/sections/report/components/monthly-trend-chart';
import { getDailyReflection } from 'src/sections/about-me/actions/about-me-reflection';
import { listSubscriptions } from 'src/sections/subscription/actions/subscription-actions';
import { SubscriptionDashboardCard } from 'src/sections/subscription/components/subscription-dashboard-card';

import { HubDomainCard } from '../components/hub-domain-card';
import { getDashboardData } from '../actions/dashboard-actions';
import { getDashboardReminders } from '../actions/dashboard-reminders';
import { DailyReflectionCard } from '../components/daily-reflection-card';
import { CurrentWeekPlanCard } from '../components/current-week-plan-card';
import { DashboardRemindersCard } from '../components/dashboard-reminders-card';

// ----------------------------------------------------------------------

/**
 * Cross-domain landing page — quick stats per area + actionable cards.
 * Pure chi-tiêu charts live under /dashboard/spending instead.
 */
export async function DashboardHubView() {
  const [
    aboutMeStats,
    dashboardData,
    reportData,
    assets,
    plans,
    subs,
    reminders,
    reflection,
  ] = await Promise.all([
    getAboutMeStats(),
    getDashboardData(),
    getReportData(),
    listAssets(),
    listPlans(),
    listSubscriptions(),
    getDashboardReminders(),
    getDailyReflection(),
  ]);

  // --- Asset summary ---
  const assetTotal = assets.reduce((s, a) => s + a.currentValue, 0);
  const assetCapital = assets.reduce((s, a) => s + a.capital, 0);
  const assetPnl = assetTotal - assetCapital;
  const assetPnlPct = assetCapital > 0 ? (assetPnl / assetCapital) * 100 : 0;

  // --- Plan summary ---
  const currentWeekRow = plans.find((p) => p.scope === 'weekly' && p.isCurrent) ?? null;
  const currentWeekPlan = currentWeekRow ? await getPlan(currentWeekRow.id) : null;
  const activePlanCount = plans.filter((p) => p.status === 'active').length;

  // --- Subscription summary ---
  const subTotals = computeSubscriptionTotals(subs);
  const upcoming7d = subs.filter((s) => s.active && s.daysUntilDue >= 0 && s.daysUntilDue <= 7).length;
  const upcomingSubs = subs
    .filter((s) => s.active)
    .sort((a, b) => a.daysUntilDue - b.daysUntilDue)
    .slice(0, 5);

  // --- Spending summary ---
  const netBalance = dashboardData.totalIncome - dashboardData.totalExpense;

  // --- Domain cards data ---
  const domainCards = [
    {
      label: 'Bản thân',
      href: paths.dashboard.aboutMe,
      icon: 'solar:user-rounded-bold' as const,
      iconColor: '#7C4DFF',
      value: `${aboutMeStats.totalEntries} entry`,
      hint: `${aboutMeStats.weeklyNew} mới tuần này`,
    },
    {
      label: 'Chi tiêu',
      href: paths.dashboard.spending,
      icon: 'solar:wallet-money-bold' as const,
      iconColor: '#FF9800',
      value: fCurrency(netBalance),
      hint: `Số dư tháng ${dashboardData.monthLabel}`,
      trend:
        dashboardData.expenseDeltaPct !== null
          ? {
              text: `${dashboardData.expenseDeltaPct >= 0 ? '+' : ''}${dashboardData.expenseDeltaPct.toFixed(0)}% chi vs tháng trước`,
              // Spending increase = bad trend (red); decrease = good (green).
              positive: dashboardData.expenseDeltaPct < 0,
            }
          : undefined,
    },
    {
      label: 'Tài sản',
      href: paths.dashboard.assets,
      icon: 'solar:dollar-minimalistic-bold' as const,
      iconColor: '#00B8D4',
      value: fCurrency(assetTotal),
      hint: `${assets.length} tài sản · vốn ${fCurrency(assetCapital)}`,
      trend:
        assetCapital > 0
          ? {
              text: `${assetPnl >= 0 ? '+' : ''}${fCurrency(assetPnl)} (${assetPnlPct.toFixed(1)}%)`,
              positive: assetPnl >= 0,
            }
          : undefined,
    },
    {
      label: 'Kế hoạch',
      href: paths.dashboard.plans,
      icon: 'solar:calendar-date-bold' as const,
      iconColor: '#00C853',
      value: currentWeekPlan
        ? `${currentWeekPlan.tasks.filter((t) => t.isDone).length}/${currentWeekPlan.tasks.length} việc`
        : `${activePlanCount} đang chạy`,
      hint: currentWeekPlan ? `Tuần này: ${currentWeekPlan.title}` : 'Chưa có kế hoạch tuần',
    },
    {
      label: 'Hóa đơn',
      href: paths.dashboard.subscriptions,
      icon: 'solar:card-bold' as const,
      iconColor: '#E91E63',
      value: fCurrency(subTotals.monthlyEquivalent),
      hint: `${subTotals.activeCount} đang dùng · ${upcoming7d} sắp đến hạn 7 ngày`,
    },
  ];

  return (
    <DashboardContent>
      <Stack spacing={3}>
        {/* Header */}
        <Box>
          <Typography variant="h4" sx={{ mb: 0.5 }}>
            Tổng quan
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Bức tranh toàn cảnh — bản thân, tài chính và kế hoạch
          </Typography>
        </Box>

        {/* Daily reflection — random self-note shown on app open. */}
        <DailyReflectionCard reflection={reflection} />

        {/* Reminders — cross-domain pending items. */}
        <DashboardRemindersCard reminders={reminders} />

        {/* Domain quick-stat cards.
            Mobile (xs): stack vertically, 1 card per row.
            sm+: horizontal scroll strip with desktop arrow buttons; ~4 cards
            visible on lg+, 5th peeks slightly to hint at scrollability. */}
        <HorizontalScrollStrip
          showButtonsAt="md"
          scrollSx={{
            gap: 2,
            pb: 1,
            scrollSnapType: { sm: 'x mandatory' },
            // xs: column stack (no horizontal scroll); sm+: row scroll.
            flexDirection: { xs: 'column', sm: 'row' },
            overflowX: { xs: 'visible', sm: 'auto' },
            '& > *': {
              flexShrink: { sm: 0 },
              scrollSnapAlign: 'start',
              width: {
                xs: '100%',
                sm: 240,
                // Desktop: show 4 cards within the container; 5th peeks ~12px.
                lg: 'calc((100% - 48px) / 4 - 12px)',
              },
            },
          }}
        >
          {domainCards.map((card) => (
            <HubDomainCard key={card.label} {...card} />
          ))}
        </HorizontalScrollStrip>

        {/* Actionable cards — weekly plan + upcoming subs. */}
        <CurrentWeekPlanCard plan={currentWeekPlan} />

        <SubscriptionDashboardCard upcoming={upcomingSubs} totals={subTotals} />

        {/* Cross-domain trend — chi tiêu 6 tháng for a glance, deeper drill on /dashboard/spending. */}
        <MonthlyTrendChart data={reportData.monthlyTrend} />
      </Stack>
    </DashboardContent>
  );
}
