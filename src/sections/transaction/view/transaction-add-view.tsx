import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { DashboardContent } from 'src/layouts/dashboard';

import { listCategoriesForForm } from '../actions/transaction-actions';
import { TransactionAddClient } from '../components/transaction-add-client';

export async function TransactionAddView() {
  const categories = await listCategoriesForForm();

  return (
    <DashboardContent>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h4" sx={{ mb: 0.5 }}>
            Thêm giao dịch
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Nhập thủ công hoặc quét ảnh hoá đơn / screenshot Techcombank để AI tự điền.
          </Typography>
        </Box>

        <TransactionAddClient categories={categories} />
      </Stack>
    </DashboardContent>
  );
}
