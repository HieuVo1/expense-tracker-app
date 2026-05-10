import type { AboutMeType } from '../types';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';

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
      {/* Breadcrumb */}
      <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
        <Box
          component="a"
          href={paths.dashboard.notes}
          sx={{ color: 'inherit', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
        >
          Nhật ký
        </Box>
        {' / '}
        <Box
          component="a"
          href={paths.dashboard.aboutMe}
          sx={{ color: 'inherit', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
        >
          Về tôi
        </Box>
        {' / '}
        {label}
      </Typography>

      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
          {label}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {rows.length > 0 ? `${rows.length} mục` : 'Chưa có mục nào'}
        </Typography>
      </Box>

      {/* SIGNAL: pattern board above entry list */}
      {type === 'SIGNAL' && patterns && (
        <AboutMePatternBoard patterns={patterns} sx={{ mb: 3 }} />
      )}

      <AboutMeListClient rows={rows} type={type} />
    </DashboardContent>
  );
}
