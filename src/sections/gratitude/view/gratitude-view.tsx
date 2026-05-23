import dayjs from 'dayjs';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import { alpha } from '@mui/material/styles';
import Typography from '@mui/material/Typography';

import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';

import { GratitudeForm } from '../components/gratitude-form';
import { GratitudeHistoryList } from '../components/gratitude-history-list';
import { GRATITUDE_ACCENT, GRATITUDE_MIN_ITEMS } from '../constants/gratitude';
import { listGratitude, getTodayGratitude } from '../actions/gratitude-actions';

// ----------------------------------------------------------------------

export async function GratitudeView() {
  const [today, all] = await Promise.all([getTodayGratitude(), listGratitude()]);

  const todayStr = dayjs().format('YYYY-MM-DD');
  const history = all.filter((e) => e.date !== todayStr);
  const done = (today?.items.length ?? 0) >= GRATITUDE_MIN_ITEMS;

  return (
    <DashboardContent>
      <Stack spacing={{ xs: 2.5, sm: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ mb: 0.5 }}>
            Lòng biết ơn
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Mỗi ngày ghi lại ít nhất {GRATITUDE_MIN_ITEMS} điều bạn biết ơn.
          </Typography>
        </Box>

        <Card
          sx={{
            p: { xs: 2.25, sm: 3 },
            borderTop: 3,
            borderTopColor: GRATITUDE_ACCENT,
            // Static string (not a `(theme) => ...` fn): this is a Server Component,
            // and functions can't be passed in `sx` across the server→client boundary.
            // Fade the amber tint to transparent so the Card's paper bg shows through.
            background: `linear-gradient(180deg, ${alpha(GRATITUDE_ACCENT, 0.08)} 0%, transparent 140px)`,
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2.5 }}>
            <Iconify
              icon={done ? 'solar:check-circle-bold' : 'solar:hand-heart-bold'}
              width={24}
              sx={{ color: done ? 'success.main' : GRATITUDE_ACCENT, flexShrink: 0 }}
            />
            <Typography variant="h6" noWrap sx={{ minWidth: 0 }}>
              {done ? 'Hôm nay đã xong' : 'Biết ơn hôm nay'}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ ml: 'auto', flexShrink: 0, whiteSpace: 'nowrap' }}
            >
              {dayjs().format('DD/MM/YYYY')}
            </Typography>
          </Stack>

          <GratitudeForm entry={today} />
        </Card>

        <Box>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Những ngày trước{history.length > 0 ? ` (${history.length})` : ''}
          </Typography>
          <GratitudeHistoryList entries={history} />
        </Box>
      </Stack>
    </DashboardContent>
  );
}
