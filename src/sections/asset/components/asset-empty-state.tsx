import Card from '@mui/material/Card';

import { EmptyContent } from 'src/components/empty-content';

export function AssetEmptyState() {
  return (
    <Card sx={{ p: 4 }}>
      <EmptyContent
        title="Chưa có tài sản nào"
        description="Bấm + để thêm khoản tiền mặt, cổ phiếu, chứng chỉ quỹ hoặc tiết kiệm."
      />
    </Card>
  );
}
