'use client';

import type { Breakpoint } from '@mui/material/styles';

import { usePathname } from 'next/navigation';

import Paper from '@mui/material/Paper';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { Iconify } from 'src/components/iconify';

// Tabs shown in the mobile bottom bar. Order is the user's mental hierarchy:
// Home → productivity (Plans, Notes) → financial (Assets, History) → Settings.
// Six tabs fit at icon+label on most phones; if reach issues surface, the
// secondary pairs (Plans/Notes, Assets/History) can be folded into a "More"
// overflow popover.
const TABS = [
  { value: paths.dashboard.root, label: 'Trang chủ', icon: 'solar:home-angle-bold-duotone' },
  { value: paths.dashboard.plans, label: 'Kế hoạch', icon: 'solar:calendar-date-bold' },
  { value: paths.dashboard.notes, label: 'Ghi chú', icon: 'solar:notebook-bold-duotone' },
  { value: paths.dashboard.assets, label: 'Tài sản', icon: 'solar:dollar-minimalistic-bold' },
  { value: paths.dashboard.transactions, label: 'Lịch sử', icon: 'solar:clock-circle-bold' },
  { value: paths.dashboard.settings, label: 'Cài đặt', icon: 'solar:settings-bold-duotone' },
] as const;

// Resolves the active tab from the current path. Sub-routes count as their
// closest tab — e.g. /dashboard/transactions/new highlights "Lịch sử".
function activeTab(pathname: string) {
  // Longer paths first so /transactions wins over /transactions root '/'.
  const match = [...TABS].sort((a, b) => b.value.length - a.value.length).find((t) => {
    if (t.value === paths.dashboard.root) return pathname === paths.dashboard.root;
    return pathname.startsWith(t.value);
  });
  return match?.value ?? paths.dashboard.root;
}

type Props = {
  /** Hide bar at and above this breakpoint — desktop uses the sidebar instead. */
  hideAtBreakpoint?: Breakpoint;
};

export function BottomNav({ hideAtBreakpoint = 'lg' }: Props) {
  const pathname = usePathname();
  const value = activeTab(pathname);

  return (
    <Paper
      elevation={0}
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: (theme) => theme.zIndex.appBar,
        borderTop: '0.5px solid',
        borderColor: 'divider',
        // Honour iOS bottom safe area so the bar lifts above the home indicator.
        pb: 'env(safe-area-inset-bottom)',
        bgcolor: 'background.paper',
        display: { xs: 'block', [hideAtBreakpoint]: 'none' },
      }}
    >
      <BottomNavigation
        value={value}
        showLabels
        sx={{
          height: 64,
          bgcolor: 'transparent',
          // 6 tabs fit on phones >=360px when each action shrinks proportionally.
          '& .MuiBottomNavigationAction-root': {
            minWidth: 0,
            padding: '6px 4px',
            color: 'text.secondary',
            '&.Mui-selected': { color: 'text.primary' },
            // Smaller label so 6 tabs don't overflow on narrow phones.
            '& .MuiBottomNavigationAction-label': {
              fontSize: '0.65rem',
              '&.Mui-selected': { fontSize: '0.7rem' },
            },
          },
        }}
      >
        {TABS.map((tab) => (
          <BottomNavigationAction
            key={tab.value}
            component={RouterLink}
            href={tab.value}
            value={tab.value}
            label={tab.label}
            icon={<Iconify icon={tab.icon} width={24} />}
          />
        ))}
      </BottomNavigation>
    </Paper>
  );
}

