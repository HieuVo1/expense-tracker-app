import type { NavSectionProps } from 'src/components/nav-section';

import { paths } from 'src/routes/paths';

import { Iconify } from 'src/components/iconify';

const icon = (
  name: 'home' | 'wallet' | 'assets' | 'target' | 'folder' | 'settings' | 'notes' | 'plans'
) => {
  const map = {
    home: 'solar:home-angle-bold-duotone',
    wallet: 'solar:transfer-horizontal-bold-duotone',
    assets: 'solar:dollar-minimalistic-bold',
    target: 'solar:bill-list-bold-duotone',
    folder: 'solar:add-folder-bold',
    settings: 'solar:settings-bold-duotone',
    notes: 'solar:notebook-bold-duotone',
    plans: 'solar:calendar-date-bold',
  } as const;
  return <Iconify icon={map[name]} width={24} />;
};

export const navData: NavSectionProps['data'] = [
  {
    subheader: 'Tổng quan',
    items: [
      { title: 'Tổng quan', path: paths.dashboard.root, icon: icon('home') },
      { title: 'Tài sản', path: paths.dashboard.assets, icon: icon('assets') },
      // deepMatch so /dashboard/transactions/new still highlights "Giao dịch".
      { title: 'Giao dịch', path: paths.dashboard.transactions, icon: icon('wallet'), deepMatch: true },
    ],
  },
  {
    subheader: 'Quản lý',
    items: [
      { title: 'Ngân sách', path: paths.dashboard.budgets, icon: icon('target') },
      { title: 'Danh mục', path: paths.dashboard.categories, icon: icon('folder') },
      { title: 'Ghi chú', path: paths.dashboard.notes, icon: icon('notes') },
      // deepMatch so /dashboard/plans/[id] still highlights "Kế hoạch".
      { title: 'Kế hoạch', path: paths.dashboard.plans, icon: icon('plans'), deepMatch: true },
      { title: 'Cài đặt', path: paths.dashboard.settings, icon: icon('settings') },
    ],
  },
];
