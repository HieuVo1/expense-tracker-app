import type { PlanScope } from '@prisma/client';

import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';

import { PLAN_SCOPE_LABELS, PLAN_SCOPE_VALUES } from '../constants/plan-meta';

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
      variant="scrollable"
      scrollButtons="auto"
    >
      {PLAN_SCOPE_VALUES.map((s) => (
        <Tab key={s} label={PLAN_SCOPE_LABELS[s]} value={s} />
      ))}
    </Tabs>
  );
}
