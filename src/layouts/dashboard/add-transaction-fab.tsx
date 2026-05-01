'use client';

import type { Breakpoint } from '@mui/material/styles';

import { usePathname } from 'next/navigation';

import Fab from '@mui/material/Fab';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { Iconify } from 'src/components/iconify';

// Hide on the Add page itself (FAB pointing at the page you're on is noise)
// and on auth pages (no DashboardLayout there but we guard anyway).
function shouldShow(pathname: string) {
  if (pathname.startsWith(paths.dashboard.addTransaction)) return false;
  return pathname.startsWith(paths.dashboard.root);
}

type Props = {
  /** Hide FAB at and above this breakpoint — desktop has inline buttons. */
  hideAtBreakpoint?: Breakpoint;
};

export function AddTransactionFab({ hideAtBreakpoint = 'lg' }: Props) {
  const pathname = usePathname();
  if (!shouldShow(pathname)) return null;

  return (
    <Fab
      component={RouterLink}
      href={paths.dashboard.addTransaction}
      color="primary"
      aria-label="Thêm giao dịch"
      sx={{
        position: 'fixed',
        // Sits above the bottom nav (64px) plus its safe-area inset, with a
        // little extra breathing room so it doesn't kiss the divider line.
        bottom: 'calc(64px + env(safe-area-inset-bottom) + 16px)',
        right: 16,
        zIndex: (theme) => theme.zIndex.appBar + 1,
        display: { xs: 'inline-flex', [hideAtBreakpoint]: 'none' },
      }}
    >
      <Iconify icon="solar:add-circle-bold" width={28} />
    </Fab>
  );
}
