import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { DashboardContent } from 'src/layouts/dashboard';

import {
  TRANSACTION_TYPES,
  TRANSACTION_TYPE_LABEL,
} from 'src/sections/transaction/lib/transaction-type';

import { listCategories } from '../actions/category-actions';
import { CategoryActions } from '../components/category-actions-bar';
import { SortableCategorySection } from '../components/sortable-category-section';

export async function CategoryListView() {
  const categories = await listCategories();
  const byType = TRANSACTION_TYPES.map((type) => ({
    type,
    title: TRANSACTION_TYPE_LABEL[type],
    rows: categories.filter((c) => c.type === type),
  }));

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
              Danh mục
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Đặt tên, chọn icon, màu và kéo để sắp xếp lại từng nhóm.
            </Typography>
          </Box>
          <CategoryActions />
        </Box>

        {byType.map((group) => (
          <SortableCategorySection key={group.type} title={group.title} rows={group.rows} />
        ))}
      </Stack>
    </DashboardContent>
  );
}
