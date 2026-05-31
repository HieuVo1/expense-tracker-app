import type { PlanRow } from '../types';

import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';

import { PlanListItem } from './plan-list-item';

// ----------------------------------------------------------------------

type Props = {
  items: PlanRow[];
  onCreate: () => void;
};

export function PlanBacklogList({ items, onCreate }: Props) {
  if (items.length === 0) {
    return (
      <Stack spacing={2} alignItems="center" sx={{ py: 6, textAlign: 'center' }}>
        <Iconify icon="solar:inbox-bold" width={48} sx={{ color: 'text.disabled' }} />
        <Typography variant="subtitle1">Chưa có backlog nào</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 480 }}>
          Backlog là kho ý tưởng. Tạo plan ở đây để gom các việc cần làm nhưng chưa muốn xếp lịch.
          Khi sẵn sàng, bạn có thể chuyển việc từ backlog sang kế hoạch tuần/tháng/năm.
        </Typography>
        <Button
          variant="contained"
          startIcon={<Iconify icon="solar:add-circle-bold" />}
          onClick={onCreate}
        >
          Tạo backlog đầu tiên
        </Button>
      </Stack>
    );
  }

  return (
    <Stack spacing={1}>
      <Typography variant="overline" color="text.secondary">
        Backlog
      </Typography>
      {items.map((p) => (
        <PlanListItem key={p.id} plan={p} />
      ))}
    </Stack>
  );
}
