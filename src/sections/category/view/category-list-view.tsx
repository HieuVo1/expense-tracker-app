import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { DashboardContent } from 'src/layouts/dashboard';

import { CategoryActions } from '../components/category-actions-bar';
import { listCategories } from '../actions/category-actions';
import { CategoryListItem } from '../components/category-list-item';

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
              Đặt tên, chọn icon và màu cho từng nhóm chi tiêu / thu nhập.
            </Typography>
          </Box>
          <CategoryActions />
        </Box>

        <Section title="Chi" rows={expense} />
        <Section title="Thu" rows={income} />
      </Stack>
    </DashboardContent>
  );
}

type Row = { id: string; name: string; icon: string; color: string; type: 'expense' | 'income' };

function Section({ title, rows }: { title: string; rows: Row[] }) {
  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
        {title}
      </Typography>
      <Card>
        {rows.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary" variant="body2">
              Chưa có danh mục.
            </Typography>
          </Box>
        ) : (
          rows.map((c) => <CategoryListItem key={c.id} category={c} />)
        )}
      </Card>
    </Box>
  );
}
