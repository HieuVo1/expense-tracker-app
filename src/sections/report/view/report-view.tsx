import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';

import { MonthPicker } from 'src/sections/dashboard/components/month-picker';

import { getReportData } from '../actions/report-actions';
import { MonthlyTrendChart } from '../components/monthly-trend-chart';
import { TopMerchantsCard } from '../components/top-merchants-card';
import { TopTransactionsCard } from '../components/top-transactions-card';

type Props = {
  searchParams?: { month?: string };
};

export async function ReportView({ searchParams }: Props) {
  const data = await getReportData(searchParams?.month);

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
              Báo cáo
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Phân tích chi tiêu 6 tháng kết thúc tại tháng đã chọn
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <MonthPicker />
            <Button
              component="a"
              href="/api/reports/export"
              variant="outlined"
              startIcon={<Iconify icon="solar:download-bold" />}
            >
              Xuất CSV
            </Button>
          </Box>
        </Box>

        <MonthlyTrendChart data={data.monthlyTrend} />

        <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
          <TopTransactionsCard rows={data.topTransactions} />
          <TopMerchantsCard rows={data.topMerchants} />
        </Box>
      </Stack>
    </DashboardContent>
  );
}
