import type { PlanScope } from '@prisma/client';

import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';

import { Iconify } from 'src/components/iconify';

import { PLAN_SCOPE_LABELS, PLAN_SCOPE_VALUES } from '../constants/plan-meta';

// ----------------------------------------------------------------------

/** Tabs can render PlanScope filters PLUS a special "calendar" view. */
export type PlanView = PlanScope | 'calendar';

type PlanTabsProps = {
  value: PlanView;
  onChange: (view: PlanView) => void;
};

export function PlanTabs({ value, onChange }: PlanTabsProps) {
  return (
    <Tabs
      value={value}
      onChange={(_, v: PlanView) => onChange(v)}
      sx={{ borderBottom: 1, borderColor: 'divider' }}
      variant="scrollable"
      scrollButtons="auto"
    >
      <Tab
        key="calendar"
        value="calendar"
        icon={<Iconify icon="solar:calendar-date-bold" width={16} />}
        iconPosition="start"
        label="Lịch tuần"
        sx={{ minHeight: 48 }}
      />
      {PLAN_SCOPE_VALUES.map((s) => (
        <Tab key={s} label={PLAN_SCOPE_LABELS[s]} value={s} />
      ))}
    </Tabs>
  );
}
