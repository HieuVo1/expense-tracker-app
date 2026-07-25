import type { NavSectionProps } from 'src/components/nav-section';

import { paths } from 'src/routes/paths';

import { Iconify } from 'src/components/iconify';

const icon = (
  name:
    | 'home'
    | 'wallet'
    | 'spending'
    | 'assets'
    | 'target'
    | 'folder'
    | 'settings'
    | 'notes'
    | 'plans'
    | 'invoice'
    | 'about-me'
    | 'gratitude'
    | 'gallery'
) => {
  const map = {
    home: 'solar:home-angle-bold-duotone',
    wallet: 'solar:transfer-horizontal-bold-duotone',
    spending: 'solar:graph-up-bold',
    assets: 'solar:dollar-minimalistic-bold',
    target: 'solar:bill-list-bold-duotone',
    folder: 'solar:add-folder-bold',
    settings: 'solar:settings-bold-duotone',
    notes: 'solar:notebook-bold-duotone',
    plans: 'solar:calendar-date-bold',
    invoice: 'solar:card-bold',
    'about-me': 'solar:user-rounded-bold',
    gratitude: 'solar:hand-heart-bold',
    gallery: 'solar:gallery-wide-bold',
  } as const;
  return <Iconify icon={map[name]} width={24} />;
};

export const navData: NavSectionProps['data'] = [
  {
    subheader: 'Tổng quan',
    items: [{ title: 'Tổng quan', path: paths.dashboard.root, icon: icon('home') }],
  },
  {
    subheader: 'Tài chính',
    items: [
      { title: 'Chi tiêu', path: paths.dashboard.spending, icon: icon('spending') },
      // deepMatch so /dashboard/transactions/new still highlights "Giao dịch".
      {
        title: 'Giao dịch',
        path: paths.dashboard.transactions,
        icon: icon('wallet'),
        deepMatch: true,
      },
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
      { title: 'Lòng biết ơn', path: paths.dashboard.gratitude, icon: icon('gratitude') },
      { title: 'Nhật ký', path: paths.dashboard.notes, icon: icon('notes') },
      { title: 'Thư viện ảnh', path: paths.dashboard.gallery, icon: icon('gallery') },
      // deepMatch so /dashboard/plans/[id] still highlights "Kế hoạch".
      { title: 'Kế hoạch', path: paths.dashboard.plans, icon: icon('plans'), deepMatch: true },
    ],
  },
  {
    subheader: 'Hệ thống',
    items: [{ title: 'Cài đặt', path: paths.dashboard.settings, icon: icon('settings') }],
  },
];
