import type { PlanRow } from '../types';

import NextLink from 'next/link';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CardActionArea from '@mui/material/CardActionArea';

import { paths } from 'src/routes/paths';

import { fDate } from 'src/utils/format-time';

import { Label } from 'src/components/label';

import { PlanProgressBar } from './plan-progress-bar';
import { PLAN_STATUS_LABELS, PLAN_STATUS_COLORS } from '../constants/plan-meta';

// ----------------------------------------------------------------------

type PlanListItemProps = {
  plan: PlanRow;
};

export function PlanListItem({ plan }: PlanListItemProps) {
  const { id, title, startDate, endDate, status, doneCount, totalCount, progress } = plan;

  return (
    <Card>
      <CardActionArea component={NextLink} href={paths.dashboard.planDetail(id)} sx={{ p: 2 }}>
        <Stack spacing={1.5}>
          {/* Title + status chip */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, lineHeight: 1.4 }}>
              {title}
            </Typography>
            <Label
              variant="soft"
              sx={{
                flexShrink: 0,
                color: PLAN_STATUS_COLORS[status],
                bgcolor: `${PLAN_STATUS_COLORS[status]}1A`,
              }}
            >
              {PLAN_STATUS_LABELS[status]}
            </Label>
          </Box>

          {/* Date range */}
          <Typography variant="caption" color="text.secondary">
            {fDate(startDate, 'DD/MM/YYYY')} – {fDate(endDate, 'DD/MM/YYYY')}
          </Typography>

          {/* Progress bar */}
          <PlanProgressBar
            doneCount={doneCount}
            totalCount={totalCount}
            progress={progress}
          />
        </Stack>
      </CardActionArea>
    </Card>
  );
}
