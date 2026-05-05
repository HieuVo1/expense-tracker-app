import Card from '@mui/material/Card';
import Button from '@mui/material/Button';

import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';

// ----------------------------------------------------------------------

type PlanEmptyStateProps = {
  onCreate?: () => void;
};

export function PlanEmptyState({ onCreate }: PlanEmptyStateProps) {
  return (
    <Card sx={{ p: 4 }}>
      <EmptyContent
        title="Chưa có kế hoạch nào"
        description="Tạo kế hoạch tuần hoặc tháng để theo dõi mục tiêu của bạn."
        action={
          onCreate && (
            <Button
              variant="contained"
              startIcon={<Iconify icon="mingcute:add-line" />}
              onClick={onCreate}
              sx={{ mt: 2 }}
            >
              Tạo kế hoạch
            </Button>
          )
        }
      />
    </Card>
  );
}
