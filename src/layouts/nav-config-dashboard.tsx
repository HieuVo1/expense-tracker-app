import type { NavSectionProps } from 'src/components/nav-section';

import { paths } from 'src/routes/paths';

import { Iconify } from 'src/components/iconify';

const icon = (
  name:
    | 'home'
    | 'wallet'
    | 'assets'
    | 'target'
    | 'folder'
    | 'settings'
    | 'notes'
    | 'plans'
    | 'invoice'
    | 'about-me'
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
    invoice: 'solar:card-bold',
    'about-me': 'solar:user-rounded-bold',
  } as const;
  return <Iconify icon={map[name]} width={24} />;
};

export const navData: NavSectionProps['data'] = [
  {
    subheader: 'Tổng quan',
    items: [
      { title: 'Tổng quan', path: paths.dashboard.root, icon: icon('home') },
    ],
  },
  {
    subheader: 'Tài chính',
    items: [
      // deepMatch so /dashboard/transactions/new still highlights "Giao dịch".
      { title: 'Giao dịch', path: paths.dashboard.transactions, icon: icon('wallet'), deepMatch: true },
      { title: 'Tài sản', path: paths.dashboard.assets, icon: icon('assets') },
      { title: 'Ngân sách', path: paths.dashboard.budgets, icon: icon('target') },
      { title: 'Hoá đơn định kỳ', path: paths.dashboard.subscriptions, icon: icon('invoice') },
      { title: 'Danh mục', path: paths.dashboard.categories, icon: icon('folder') },
    ],
  },
  {
    subheader: 'Phát triển bản thân',
    items: [
      { title: 'Về tôi', path: paths.dashboard.aboutMe, icon: icon('about-me'), deepMatch: true },
      { title: 'Nhật ký', path: paths.dashboard.notes, icon: icon('notes') },
      // deepMatch so /dashboard/plans/[id] still highlights "Kế hoạch".
      { title: 'Kế hoạch', path: paths.dashboard.plans, icon: icon('plans'), deepMatch: true },
    ],
  },
  {
    subheader: 'Hệ thống',
    items: [
      { title: 'Cài đặt', path: paths.dashboard.settings, icon: icon('settings') },
    ],
  },
];
