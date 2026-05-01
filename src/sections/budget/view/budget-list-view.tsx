import dayjs from 'dayjs';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { DashboardContent } from 'src/layouts/dashboard';

import { MonthPicker } from 'src/sections/dashboard/components/month-picker';

import { BudgetForm } from '../components/budget-form';
import { getBudgetsForMonth } from '../actions/budget-actions';

type Props = {
  searchParams?: { month?: string };
};

// Resolves the URL month param into a valid YYYY-MM key + label. Falls back
// to the current month for missing/malformed input — same rule as the
// dashboard so the two pages move in lockstep when the user picks a month.
function resolveMonth(monthParam: string | undefined) {
  const fallback = dayjs();
  if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
    const parsed = dayjs(`${monthParam}-01`);
    if (parsed.isValid()) {
      return { key: parsed.format('YYYY-MM'), label: parsed.format('MM/YYYY') };
    }
  }
  return { key: fallback.format('YYYY-MM'), label: fallback.format('MM/YYYY') };
}

export async function BudgetListView({ searchParams }: Props) {
  const { key: monthKey, label: monthLabel } = resolveMonth(searchParams?.month);
  const rows = await getBudgetsForMonth(monthKey);

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
              Ngân sách tháng {monthLabel}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Đặt hạn mức chi tiêu cho từng danh mục. Để 0 nếu chưa muốn theo dõi.
            </Typography>
          </Box>
          <MonthPicker />
        </Box>

        {/* Key forces a remount when month changes so RHF picks up new defaultValues. */}
        <BudgetForm key={monthKey} month={monthKey} initial={rows} />
      </Stack>
    </DashboardContent>
  );
}
