'use client';

import type { IconButtonProps } from '@mui/material/IconButton';

import { useBoolean } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Drawer from '@mui/material/Drawer';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';

import { useAuthContext } from 'src/auth/hooks';

import { AccountButton } from './account-button';
import { SignOutButton } from './sign-out-button';

export type AccountDrawerProps = IconButtonProps;

// Quick-access menu shown when the avatar in the header is clicked. Includes
// header (avatar + identity), navigation shortcuts to the main feature pages,
// and sign-out at the bottom.
const NAV_LINKS: Array<{ icon: string; label: string; href: string }> = [
  { icon: 'solar:home-angle-bold-duotone', label: 'Tổng quan', href: paths.dashboard.root },
  { icon: 'solar:transfer-horizontal-bold-duotone', label: 'Giao dịch', href: paths.dashboard.transactions },
  { icon: 'solar:add-circle-bold-duotone', label: 'Thêm giao dịch', href: paths.dashboard.addTransaction },
  { icon: 'solar:bill-list-bold-duotone', label: 'Ngân sách', href: paths.dashboard.budgets },
  { icon: 'solar:add-folder-bold', label: 'Danh mục', href: paths.dashboard.categories },
  { icon: 'solar:settings-bold-duotone', label: 'Cài đặt', href: paths.dashboard.settings },
];

export function AccountDrawer({ sx, ...other }: AccountDrawerProps) {
  const { user } = useAuthContext();

  const { value: open, onFalse: onClose, onTrue: onOpen } = useBoolean();

  const displayName = user?.user_metadata?.display_name ?? user?.email ?? '';
  const email = user?.email ?? '';
  const photoURL = user?.user_metadata?.avatar_url;

  return (
    <>
      <AccountButton
        onClick={onOpen}
        photoURL={photoURL}
        displayName={displayName}
        sx={sx}
        {...other}
      />

      <Drawer
        open={open}
        onClose={onClose}
        anchor="right"
        slotProps={{
          backdrop: { invisible: true },
          paper: { sx: { width: 320 } },
        }}
      >
        <IconButton onClick={onClose} sx={{ top: 12, left: 12, zIndex: 9, position: 'absolute' }}>
          <Iconify icon="mingcute:close-line" />
        </IconButton>

        <Scrollbar>
          {/* Identity header */}
          <Box sx={{ pt: 7, pb: 3, px: 2.5, textAlign: 'center' }}>
            <Avatar src={photoURL} alt={displayName} sx={{ width: 72, height: 72, mx: 'auto', mb: 2 }}>
              {displayName?.charAt(0).toUpperCase()}
            </Avatar>
            <Typography variant="subtitle1" noWrap>
              {displayName}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.25 }} noWrap>
              {email}
            </Typography>
          </Box>

          <Divider sx={{ borderStyle: 'dashed' }} />

          {/* Quick navigation */}
          <Stack sx={{ p: 1.5 }}>
            {NAV_LINKS.map((item) => (
              <Link
                key={item.href}
                component={RouterLink}
                href={item.href}
                onClick={onClose}
                color="inherit"
                underline="none"
                sx={{
                  px: 1.5,
                  py: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  borderRadius: 1,
                  typography: 'body2',
                  '&:hover': { bgcolor: 'action.hover' },
                }}
              >
                <Iconify icon={item.icon as never} width={20} />
                {item.label}
              </Link>
            ))}
          </Stack>
        </Scrollbar>

        <Box sx={{ p: 2.5 }}>
          <SignOutButton onClose={onClose} />
        </Box>
      </Drawer>
    </>
  );
}
