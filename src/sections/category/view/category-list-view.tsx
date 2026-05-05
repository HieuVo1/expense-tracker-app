import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { DashboardContent } from 'src/layouts/dashboard';

import { listCategories } from '../actions/category-actions';
import { CategoryActions } from '../components/category-actions-bar';
import { SortableCategorySection } from '../components/sortable-category-section';

export async function CategoryListView() {
  const categories = await listCategories();
  const expense = categories.filter((c) => c.type === 'expense');
  const income = categories.filter((c) => c.type === 'income');

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

        <SortableCategorySection title="Chi" rows={expense} />
        <SortableCategorySection title="Thu" rows={income} />
      </Stack>
    </DashboardContent>
  );
}
