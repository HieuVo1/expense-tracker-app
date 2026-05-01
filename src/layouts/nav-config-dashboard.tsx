import type { NavSectionProps } from 'src/components/nav-section';

import { paths } from 'src/routes/paths';

import { Iconify } from 'src/components/iconify';

const icon = (name: 'home' | 'wallet' | 'chart' | 'target' | 'folder' | 'settings') => {
  const map = {
    home: 'solar:home-angle-bold-duotone',
    wallet: 'solar:transfer-horizontal-bold-duotone',
    chart: 'solar:chart-square-outline',
    target: 'solar:bill-list-bold-duotone',
    folder: 'solar:add-folder-bold',
    settings: 'solar:settings-bold-duotone',
  } as const;
  return <Iconify icon={map[name]} width={24} />;
};

export const navData: NavSectionProps['data'] = [
  {
    subheader: 'Tổng quan',
    items: [
      { title: 'Tổng quan', path: paths.dashboard.root, icon: icon('home') },
      { title: 'Giao dịch', path: paths.dashboard.transactions, icon: icon('wallet') },
      { title: 'Báo cáo', path: paths.dashboard.reports, icon: icon('chart') },
    ],
  },
  {
    subheader: 'Quản lý',
    items: [
      { title: 'Ngân sách', path: paths.dashboard.budgets, icon: icon('target') },
      { title: 'Danh mục', path: paths.dashboard.categories, icon: icon('folder') },
      { title: 'Cài đặt', path: paths.dashboard.settings, icon: icon('settings') },
    ],
  },
];
