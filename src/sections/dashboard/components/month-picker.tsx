'use client';

import dayjs from 'dayjs';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';

type Props = {
  // Number of past months (including current) to offer in the dropdown.
  monthsBack?: number;
};

// Pushes the selected month into the URL as ?month=YYYY-MM. The server
// component re-fetches dashboard data for the new month on the next render.
export function MonthPicker({ monthsBack = 12 }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  // Build the option list once per render — last N months in reverse so
  // current month sits at the top.
  const now = dayjs();
  const options = Array.from({ length: monthsBack }).map((_, i) => {
    const m = now.subtract(i, 'month');
    return { value: m.format('YYYY-MM'), label: m.format('MM/YYYY') };
  });

  const current = params.get('month') ?? options[0]?.value ?? '';

  const setMonth = (value: string) => {
    const next = new URLSearchParams(params.toString());
    if (!value || value === options[0]?.value) {
      next.delete('month');
    } else {
      next.set('month', value);
    }
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  };

  return (
    <TextField
      select
      size="small"
      label="Tháng"
      value={current}
      onChange={(e) => setMonth(e.target.value)}
      sx={{ minWidth: 140 }}
    >
      {options.map((opt) => (
        <MenuItem key={opt.value} value={opt.value}>
          Tháng {opt.label}
        </MenuItem>
      ))}
    </TextField>
  );
}
