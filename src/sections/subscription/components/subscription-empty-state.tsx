import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';

type Props = {
  onCreate: () => void;
};

export function SubscriptionEmptyState({ onCreate }: Props) {
  return (
    <Box
      sx={{
        py: 8,
        textAlign: 'center',
        border: '1px dashed',
        borderColor: 'divider',
        borderRadius: 2,
      }}
    >
      <Stack spacing={2} alignItems="center">
        <Iconify icon="solar:bill-list-bold-duotone" width={56} sx={{ color: 'text.disabled' }} />
        <Box>
          <Typography variant="h6">Chưa có hoá đơn định kỳ</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Thêm các subscription (cloud, AI, streaming...) để theo dõi chi phí hàng tháng.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Iconify icon="solar:add-circle-bold" />}
          onClick={onCreate}
        >
          Thêm hoá đơn
        </Button>
      </Stack>
    </Box>
  );
}
