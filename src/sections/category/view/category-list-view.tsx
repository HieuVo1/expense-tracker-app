import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { DashboardContent } from 'src/layouts/dashboard';

import { listCategories } from '../actions/category-actions';
import { CategoryListItem } from '../components/category-list-item';

export async function CategoryListView() {
  const categories = await listCategories();

  return (
    <DashboardContent>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h4" sx={{ mb: 0.5 }}>
            Danh mục
          </Typography>
          <Typography variant="body2" color="text.secondary">
            6 danh mục mặc định cho theo dõi chi tiêu hàng ngày. Bạn có thể đổi tên cho phù hợp.
          </Typography>
        </Box>

        <Card>
          {categories.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">Chưa có danh mục nào.</Typography>
            </Box>
          ) : (
            categories.map((c) => <CategoryListItem key={c.id} category={c} />)
          )}
        </Card>
      </Stack>
    </DashboardContent>
  );
}
