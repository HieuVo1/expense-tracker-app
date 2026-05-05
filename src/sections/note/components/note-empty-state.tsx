import Card from '@mui/material/Card';
import Button from '@mui/material/Button';

import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';

// ----------------------------------------------------------------------

type NoteEmptyStateProps = {
  filtered?: boolean;
  onCreate?: () => void;
};

export function NoteEmptyState({ filtered = false, onCreate }: NoteEmptyStateProps) {
  if (filtered) {
    return (
      <Card sx={{ p: 4 }}>
        <EmptyContent
          title="Không tìm thấy ghi chú phù hợp"
          description="Thử thay đổi bộ lọc hoặc từ khoá tìm kiếm."
        />
      </Card>
    );
  }

  return (
    <Card sx={{ p: 4 }}>
      <EmptyContent
        title="Chưa có ghi chú nào"
        description="Bấm + để tạo ghi chú đầu tiên của bạn."
        action={
          onCreate && (
            <Button
              variant="contained"
              startIcon={<Iconify icon="mingcute:add-line" />}
              onClick={onCreate}
              sx={{ mt: 2 }}
            >
              Tạo ghi chú
            </Button>
          )
        }
      />
    </Card>
  );
}
