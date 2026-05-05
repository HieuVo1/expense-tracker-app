import type { PlanScope } from '@prisma/client';

import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';

import { PLAN_SCOPE_LABELS } from '../constants/plan-meta';

// ----------------------------------------------------------------------

type PlanTabsProps = {
  value: PlanScope;
  onChange: (scope: PlanScope) => void;
};

export function PlanTabs({ value, onChange }: PlanTabsProps) {
  return (
    <Tabs
      value={value}
      onChange={(_, v: PlanScope) => onChange(v)}
      sx={{ borderBottom: 1, borderColor: 'divider' }}
    >
      <Tab label={PLAN_SCOPE_LABELS.weekly} value="weekly" />
      <Tab label={PLAN_SCOPE_LABELS.monthly} value="monthly" />
    </Tabs>
  );
}
