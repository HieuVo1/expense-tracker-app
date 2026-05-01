import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { fDate } from 'src/utils/format-time';
import { DashboardContent } from 'src/layouts/dashboard';

import { BudgetForm } from '../components/budget-form';
import { getBudgetsForCurrentMonth } from '../actions/budget-actions';

export async function BudgetListView() {
  const rows = await getBudgetsForCurrentMonth();
  const monthLabel = fDate(new Date(), 'MM/YYYY');

  return (
    <DashboardContent>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h4" sx={{ mb: 0.5 }}>
            Ngân sách tháng {monthLabel}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Đặt hạn mức chi tiêu cho từng danh mục. Để 0 nếu chưa muốn theo dõi.
          </Typography>
        </Box>

        <BudgetForm initial={rows} />
      </Stack>
    </DashboardContent>
  );
}
