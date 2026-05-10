'use client';

import type { IconifyName } from 'src/components/iconify';
import type { SubscriptionRow, SubscriptionTotals } from '../types';

import NextLink from 'next/link';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';

import { paths } from 'src/routes/paths';

import { fDate } from 'src/utils/format-time';
import { fCurrency } from 'src/utils/format-number';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';

import { dueLabel } from '../utils/summary';
import { BILLING_CYCLE_LABEL } from '../constants/billing-cycle';

type Props = {
  // Active subs sorted by daysUntilDue ascending; only first ~5 shown.
  upcoming: SubscriptionRow[];
  totals: SubscriptionTotals;
};

// Dashboard widget — surfaces monthly burn + next few subscriptions due.
// Hidden entirely when there are no active subscriptions.
export function SubscriptionDashboardCard({ upcoming, totals }: Props) {
  if (totals.activeCount === 0) return null;

  return (
    <Card>
      <CardHeader
        avatar={<Iconify icon="solar:bill-list-bold-duotone" width={24} />}
        title="Hoá đơn định kỳ"
        subheader={
          <Stack direction="row" spacing={1.5} sx={{ mt: 0.5, flexWrap: 'wrap' }}>
            <Typography variant="caption" color="text.secondary">
              Chi phí tháng:{' '}
              <Box component="span" className="tabular" sx={{ fontWeight: 700, color: 'warning.main' }}>
                {fCurrency(totals.monthlyEquivalent)}
              </Box>
            </Typography>
            <Typography variant="caption" color="text.secondary">
              · Năm:{' '}
              <Box component="span" className="tabular" sx={{ fontWeight: 700 }}>
                {fCurrency(totals.yearlyEquivalent)}
              </Box>
            </Typography>
          </Stack>
        }
        action={
          <Button
            size="small"
            color="inherit"
            component={NextLink}
            href={paths.dashboard.subscriptions}
            endIcon={<Iconify icon="eva:arrow-ios-forward-fill" width={16} />}
          >
            Quản lý
          </Button>
        }
      />
      {upcoming.length > 0 && (
        <CardContent sx={{ pt: 0 }}>
          <Stack spacing={1} divider={<Divider flexItem />}>
            {upcoming.map((r) => (
              <UpcomingRow key={r.id} row={r} />
            ))}
          </Stack>
        </CardContent>
      )}
    </Card>
  );
}

function UpcomingRow({ row }: { row: SubscriptionRow }) {
  const overdue = row.daysUntilDue < 0;
  const dueSoon = !overdue && row.daysUntilDue <= 7;

  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={1.5}
      sx={{ py: 1 }}
    >
      <Box
        sx={{
          width: 32,
          height: 32,
          borderRadius: 1,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: `${row.categoryColor}1A`,
          color: row.categoryColor,
          flexShrink: 0,
        }}
      >
        <Iconify icon={row.categoryIcon as IconifyName} width={18} />
      </Box>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="body2" sx={{ fontWeight: 500 }} noWrap>
            {row.name}
          </Typography>
          <Label variant="soft" color="default" sx={{ height: 18, fontSize: 10 }}>
            {BILLING_CYCLE_LABEL[row.cycle]}
          </Label>
        </Stack>
        <Typography
          variant="caption"
          color={overdue ? 'error.main' : dueSoon ? 'warning.main' : 'text.secondary'}
        >
          {dueLabel(row.daysUntilDue, row.cycle)} · {fDate(row.nextDueDate, 'DD/MM')}
        </Typography>
      </Box>

      <Typography variant="body2" className="tabular" sx={{ fontWeight: 700 }}>
        {fCurrency(row.amount)}
      </Typography>
    </Stack>
  );
}
