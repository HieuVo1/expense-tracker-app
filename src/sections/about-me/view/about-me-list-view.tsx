import type { AboutMeType } from '../types';

import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { listAboutMe } from '../actions/about-me-actions';
import { AboutMeListClient } from './about-me-list-client';
import { AboutMePatternBoard } from './about-me-pattern-board';
import { ABOUT_ME_TYPE_LABELS } from '../constants/about-me-types';
import { getSignalPatterns } from '../actions/about-me-signal-patterns';

// ----------------------------------------------------------------------

type Props = { type: AboutMeType };

export async function AboutMeListView({ type }: Props) {
  const [rows, patterns] = await Promise.all([
    listAboutMe(type),
    type === 'SIGNAL' ? getSignalPatterns() : Promise.resolve(null),
  ]);

  const label = ABOUT_ME_TYPE_LABELS[type];

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={label}
        links={[
          { name: 'Nhật ký', href: paths.dashboard.notes },
          { name: 'Về tôi', href: paths.dashboard.aboutMe },
          { name: label },
        ]}
        sx={{ mb: 1 }}
      />

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {rows.length > 0 ? `${rows.length} mục` : 'Chưa có mục nào'}
      </Typography>

      {/* SIGNAL: pattern board above entry list */}
      {type === 'SIGNAL' && patterns && (
        <AboutMePatternBoard patterns={patterns} sx={{ mb: 3 }} />
      )}

      <AboutMeListClient rows={rows} type={type} />
    </DashboardContent>
  );
}
