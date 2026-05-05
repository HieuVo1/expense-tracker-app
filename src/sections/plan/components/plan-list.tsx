import type { PlanRow } from '../types';

import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';

import { PlanListItem } from './plan-list-item';
import { PlanEmptyState } from './plan-empty-state';

// ----------------------------------------------------------------------

type PlanListProps = {
  current: PlanRow[];
  upcoming: PlanRow[];
  past: PlanRow[];
  archived: PlanRow[];
  showArchived: boolean;
  onToggleArchived: () => void;
  onCreate: () => void;
};

function SectionHeading({ label }: { label: string }) {
  return (
    <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
      {label}
    </Typography>
  );
}

export function PlanList({
  current,
  upcoming,
  past,
  archived,
  showArchived,
  onToggleArchived,
  onCreate,
}: PlanListProps) {
  const hasAny =
    current.length > 0 || upcoming.length > 0 || past.length > 0 || archived.length > 0;

  if (!hasAny) {
    return <PlanEmptyState onCreate={onCreate} />;
  }

  return (
    <Stack spacing={3}>
      {/* Current plans */}
      {current.length > 0 && (
        <Stack spacing={1}>
          <SectionHeading label="Đang diễn ra" />
          {current.map((p) => (
            <PlanListItem key={p.id} plan={p} />
          ))}
        </Stack>
      )}

      {/* Upcoming plans (startDate > today) */}
      {upcoming.length > 0 && (
        <Stack spacing={1}>
          <SectionHeading label="Sắp tới" />
          {upcoming.map((p) => (
            <PlanListItem key={p.id} plan={p} />
          ))}
        </Stack>
      )}

      {/* Past / completed plans */}
      {past.length > 0 && (
        <Stack spacing={1}>
          <SectionHeading label="Đã qua" />
          {past.map((p) => (
            <PlanListItem key={p.id} plan={p} />
          ))}
        </Stack>
      )}

      {/* Archived toggle + list */}
      {archived.length > 0 && (
        <Stack spacing={1}>
          <Button
            size="small"
            color="inherit"
            onClick={onToggleArchived}
            startIcon={
              <Iconify icon={showArchived ? 'solar:eye-bold' : 'solar:eye-closed-bold'} />
            }
            sx={{ alignSelf: 'flex-start', color: 'text.secondary' }}
          >
            {showArchived ? 'Ẩn kế hoạch lưu trữ' : `Hiện kế hoạch lưu trữ (${archived.length})`}
          </Button>

          {showArchived &&
            archived.map((p) => <PlanListItem key={p.id} plan={p} />)}
        </Stack>
      )}
    </Stack>
  );
}
