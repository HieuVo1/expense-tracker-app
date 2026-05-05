import dayjs from 'dayjs';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';

import { fCurrency } from 'src/utils/format-number';

import { prisma } from 'src/lib/prisma';
import { CONFIG } from 'src/global-config';
import { requireUser } from 'src/lib/auth-helpers';
import { DashboardContent } from 'src/layouts/dashboard';
import { SignOutButton } from 'src/layouts/components/sign-out-button';

import { Iconify } from 'src/components/iconify';

// Server component — pulls auth user (Supabase) + a few summary numbers from
// Prisma (transaction count, total spend) so the user has a sense of what's
// stored in the system. Keeps Settings useful even when the rest is light.
export async function SettingsView() {
  const user = await requireUser();

  const [txCount, expenseAggregate] = await Promise.all([
    prisma.transaction.count({ where: { userId: user.id } }),
    prisma.transaction.aggregate({
      where: { userId: user.id, type: 'expense' },
      _sum: { amount: true },
    }),
  ]);
  const totalSpend = Number(expenseAggregate._sum.amount ?? 0);

  const displayName: string =
    user.user_metadata?.display_name ?? user.email ?? 'Người dùng';
  const photoURL: string | undefined = user.user_metadata?.avatar_url;
  const createdAt = user.created_at ? dayjs(user.created_at).format('DD/MM/YYYY') : '—';

  return (
    <DashboardContent>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h4" sx={{ mb: 0.5 }}>
            Cài đặt
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Tài khoản, mật khẩu, ứng dụng
          </Typography>
        </Box>

        <Card sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
            <Avatar src={photoURL} sx={{ width: 64, height: 64 }}>
              {displayName.charAt(0).toUpperCase()}
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="subtitle1" noWrap>
                {displayName}
              </Typography>
              <Typography variant="body2" color="text.secondary" noWrap>
                {user.email}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Thành viên từ {createdAt}
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ my: 3 }} />

          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: { xs: '1fr 1fr', sm: '1fr 1fr' },
            }}
          >
            <Box>
              <Typography variant="caption" color="text.secondary">
                Tổng giao dịch
              </Typography>
              <Typography variant="h6" className="tabular">
                {txCount}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Tổng đã chi
              </Typography>
              <Typography variant="h6" className="tabular">
                {fCurrency(totalSpend)}
              </Typography>
            </Box>
          </Box>
        </Card>

        <Card>
          {/* Categories + Budgets used to live in the sidebar nav. With the
              mobile bottom-nav showing only 4 main tabs, they're surfaced here
              instead so the user can always reach them in 2 taps. */}
          <SettingsRow
            icon="solar:add-folder-bold"
            title="Danh mục"
            description="Sửa tên, icon, màu cho từng nhóm"
            actionHref={paths.dashboard.categories}
            actionLabel="Mở"
          />
          <SettingsRow
            icon="solar:bill-list-bold-duotone"
            title="Ngân sách"
            description="Đặt hạn mức chi tiêu theo tháng"
            actionHref={paths.dashboard.budgets}
            actionLabel="Mở"
          />
          <SettingsRow
            icon="solar:lock-password-bold-duotone"
            title="Đổi mật khẩu"
            description="Đặt lại mật khẩu đăng nhập"
            actionHref={paths.auth.updatePassword}
            actionLabel="Đổi"
          />
          <SettingsRow
            icon="solar:settings-bold-duotone"
            title="Phiên bản ứng dụng"
            description={CONFIG.appVersion}
          />
        </Card>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <SignOutButton sx={{ maxWidth: 240 }} />
        </Box>
      </Stack>
    </DashboardContent>
  );
}

function SettingsRow({
  icon,
  title,
  description,
  actionHref,
  actionLabel,
}: {
  icon: string;
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <Box
      sx={{
        py: 2,
        px: 2.5,
        gap: 2,
        display: 'flex',
        alignItems: 'center',
        borderBottom: '0.5px solid',
        borderColor: 'divider',
        '&:last-of-type': { borderBottom: 'none' },
      }}
    >
      <Box
        sx={{
          width: 40,
          height: 40,
          display: 'grid',
          placeItems: 'center',
          borderRadius: 1,
          bgcolor: 'action.hover',
          flexShrink: 0,
        }}
      >
        <Iconify icon={icon as never} width={22} />
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body1">{title}</Typography>
        <Typography variant="caption" color="text.secondary">
          {description}
        </Typography>
      </Box>
      {actionHref && (
        <Button href={actionHref} variant="outlined" size="small">
          {actionLabel ?? 'Mở'}
        </Button>
      )}
    </Box>
  );
}
