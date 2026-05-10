'use client';

import 'dayjs/locale/vi';

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider as MuiLocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';

// `timezone="UTC"` on each picker requires the dayjs UTC plugin to be
// registered. Extending here (idempotent) keeps the rule in one place.
dayjs.extend(utc);

// Vietnamese as the global dayjs locale so all formatters (fDate etc.) and
// MUI X pickers render Vietnamese weekday/month names by default.
dayjs.locale('vi');

type Props = {
  children: React.ReactNode;
};

// Wraps the app so MUI X date pickers find their adapter context. Pickers
// in this codebase are configured with `timezone="UTC"` so the wall-clock
// time the user types matches what's persisted (see CLAUDE.md "naive UTC"
// convention).
export function LocalizationProvider({ children }: Props) {
  return (
    <MuiLocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="vi">
      {children}
    </MuiLocalizationProvider>
  );
}
