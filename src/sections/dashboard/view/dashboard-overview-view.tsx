import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';

import { TransactionListItem } from 'src/sections/transaction/components/transaction-list-item';

import { MonthPicker } from '../components/month-picker';
import { SummaryCard } from '../components/summary-card';
import { CategoryDonut } from '../components/category-donut';
import { BudgetProgress } from '../components/budget-progress';
import { getDashboardData } from '../actions/dashboard-actions';

type Props = {
  searchParams?: { month?: string };
};

export async function DashboardOverviewView({ searchParams }: Props) {
  const data = await getDashboardData(searchParams?.month);

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
              Tóm tắt chi tiêu tháng {data.monthLabel}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <MonthPicker />
            <Button
              variant="contained"
              href={paths.dashboard.addTransaction}
              startIcon={<Iconify icon="solar:add-circle-bold" />}
            >
              Thêm giao dịch
            </Button>
          </Box>
        </Box>

        <Box
          sx={{
            display: 'grid',
            gap: 3,
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          }}
        >
          <SummaryCard
            totalExpense={data.totalExpense}
            expenseDeltaPct={data.expenseDeltaPct}
            monthLabel={data.monthLabel}
          />
          <BudgetProgress rows={data.byCategory} />
        </Box>

        <CategoryDonut data={data.byCategory} />

        <Box>
          <Typography variant="subtitle1" sx={{ mb: 1.5 }}>
            Giao dịch gần nhất
          </Typography>
          {data.recent.length === 0 ? (
            <Card sx={{ p: 5, textAlign: 'center' }}>
              <Typography color="text.secondary">
                Chưa có giao dịch nào. Bắt đầu với <strong>Thêm giao dịch</strong>.
              </Typography>
            </Card>
          ) : (
            <Card>
              {data.recent.map((t) => (
                <TransactionListItem key={t.id} transaction={t} />
              ))}
            </Card>
          )}
        </Box>
      </Stack>
    </DashboardContent>
  );
}
