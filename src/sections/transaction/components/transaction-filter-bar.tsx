'use client';

import dayjs, { type Dayjs } from 'dayjs';
import { useState, useEffect, useTransition } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Badge from '@mui/material/Badge';
import Button from '@mui/material/Button';
import Collapse from '@mui/material/Collapse';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';
import InputAdornment from '@mui/material/InputAdornment';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

import { Iconify } from 'src/components/iconify';

type Category = { id: string; name: string };

type Props = {
  categories: Category[];
};

// URL ↔ Dayjs adapters. Server filter expects `YYYY-MM` for the month and
// `YYYY-MM-DD` for the day; the picker hands us a Dayjs (or null on clear).
function parseUrlMonth(value: string): Dayjs | null {
  if (!value) return null;
  const d = dayjs(`${value}-01`);
  return d.isValid() ? d : null;
}

function formatUrlMonth(value: Dayjs | null): string {
  return value && value.isValid() ? value.format('YYYY-MM') : '';
}

function parseUrlDay(value: string): Dayjs | null {
  if (!value) return null;
  const d = dayjs(value);
  return d.isValid() ? d : null;
}

function formatUrlDay(value: Dayjs | null): string {
  return value && value.isValid() ? value.format('YYYY-MM-DD') : '';
}

// Filter bar pushes selections into the URL searchParams so the server
// re-fetches with the new filter on the next render. Search input is
// debounced locally so each keystroke doesn't fire a new SSR request.
export function TransactionFilterBar({ categories }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const currentCategory = params.get('categoryId') ?? '';
  const currentQ = params.get('q') ?? '';
  const currentMonth = params.get('month') ?? '';
  const currentDay = params.get('day') ?? '';
  const currentMin = params.get('min') ?? '';
  const currentMax = params.get('max') ?? '';
  // Server-side filter validates this against {expense|income} and drops
  // anything else; mirroring those values keeps the UI in sync.
  const currentTypeRaw = params.get('type') ?? '';
  const currentType: '' | 'expense' | 'income' =
    currentTypeRaw === 'expense' || currentTypeRaw === 'income' ? currentTypeRaw : '';

  const [q, setQ] = useState(currentQ);
  // Local state for amount inputs so the user can type freely; committed to
  // URL on blur (or Enter) to avoid one round-trip per keystroke.
  const [minAmount, setMinAmount] = useState(currentMin);
  const [maxAmount, setMaxAmount] = useState(currentMax);
  // Advanced filters (type / date / amount) start collapsed unless any of
  // them is already active — that way refreshing the page with a deep-linked
  // filter shows the user what's applied without an extra click.
  const advancedActiveCount =
    (currentType ? 1 : 0) +
    (currentMonth ? 1 : 0) +
    (currentDay ? 1 : 0) +
    (currentMin ? 1 : 0) +
    (currentMax ? 1 : 0);
  const [advancedOpen, setAdvancedOpen] = useState(advancedActiveCount > 0);
  // Wraps router.replace so isPending stays true until the new server render
  // completes — gives the user a thin progress bar as feedback.
  const [isPending, startTransition] = useTransition();

  // Debounced commit of the search query — avoids one network round-trip per
  // keystroke. 300ms feels responsive without thrashing the server.
  useEffect(() => {
    const trimmed = q.trim();
    if (trimmed === currentQ) return undefined;
    const t = setTimeout(() => {
      const next = new URLSearchParams(params.toString());
      if (trimmed) next.set('q', trimmed);
      else next.delete('q');
      startTransition(() => {
        router.replace(`${pathname}?${next.toString()}`);
      });
    }, 300);
    return () => clearTimeout(t);
  }, [q, currentQ, params, pathname, router]);

  // Re-sync local inputs when the URL changes externally (e.g., reset button).
  useEffect(() => {
    setMinAmount(currentMin);
  }, [currentMin]);
  useEffect(() => {
    setMaxAmount(currentMax);
  }, [currentMax]);

  const setCategory = (categoryId: string) => {
    const next = new URLSearchParams(params.toString());
    if (categoryId) next.set('categoryId', categoryId);
    else next.delete('categoryId');
    startTransition(() => {
      router.replace(`${pathname}?${next.toString()}`);
    });
  };

  // Generic param mutator: accepts an entries array so caller can clear
  // multiple keys at once (e.g., picking a month also clears day).
  const setParams = (entries: Array<[string, string]>) => {
    const next = new URLSearchParams(params.toString());
    entries.forEach(([k, v]) => {
      if (v) next.set(k, v);
      else next.delete(k);
    });
    startTransition(() => {
      router.replace(`${pathname}?${next.toString()}`);
    });
  };

  const onPickMonth = (value: string) => {
    // Picking a month clears any specific day (mutually exclusive — day is
    // the more specific filter; clearing avoids a confusing "both set" state).
    setParams([['month', value], ['day', '']]);
  };

  const onPickDay = (value: string) => {
    // Picking a day clears the month for the same reason.
    setParams([['day', value], ['month', '']]);
  };

  const setType = (value: '' | 'expense' | 'income') => {
    setParams([['type', value]]);
  };

  const commitAmount = (key: 'min' | 'max', value: string) => {
    const trimmed = value.trim();
    if (trimmed === (key === 'min' ? currentMin : currentMax)) return;
    // Reject non-numeric input silently — the next render syncs back to the
    // URL value via the effects above.
    if (trimmed && !/^\d+$/.test(trimmed)) return;
    setParams([[key, trimmed]]);
  };

  const hasAnyFilter = !!(
    currentCategory ||
    currentQ ||
    currentMonth ||
    currentDay ||
    currentMin ||
    currentMax ||
    currentType
  );

  const resetAll = () => {
    setQ('');
    setMinAmount('');
    setMaxAmount('');
    startTransition(() => {
      router.replace(pathname);
    });
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
      {/* Search bar + advanced-filter toggle. Search stays always-visible
          since it's the most-used filter; the rest hides behind the button. */}
      <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
        <TextField
          size="small"
          placeholder="Tìm kiếm giao dịch…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify icon="eva:search-fill" width={18} />
                </InputAdornment>
              ),
            },
          }}
          sx={{ flex: 1, minWidth: 200 }}
        />
        <Badge
          color="primary"
          badgeContent={advancedActiveCount}
          invisible={advancedActiveCount === 0}
          overlap="rectangular"
        >
          <Button
            size="medium"
            variant={advancedOpen || advancedActiveCount > 0 ? 'contained' : 'outlined'}
            color="inherit"
            onClick={() => setAdvancedOpen((v) => !v)}
            startIcon={<Iconify icon="ic:round-filter-list" width={18} />}
            endIcon={
              <Iconify
                icon={
                  advancedOpen ? 'eva:arrow-ios-upward-fill' : 'eva:arrow-ios-downward-fill'
                }
                width={18}
              />
            }
          >
            Bộ lọc
          </Button>
        </Badge>
        {hasAnyFilter && (
          <Button
            size="small"
            color="inherit"
            onClick={resetAll}
            startIcon={<Iconify icon="mingcute:close-line" width={16} />}
          >
            Xoá lọc
          </Button>
        )}
      </Box>

      {/* Advanced filters: type (Chi/Thu) + month/day/amount. Collapses to
          keep the bar compact; auto-opens if any of these is active so the
          user always sees what's filtering the list. */}
      <Collapse in={advancedOpen} unmountOnExit>
        <Stack spacing={1.5}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Typography variant="caption" color="text.secondary" sx={{ mr: 0.5 }}>
              Loại
            </Typography>
            <FilterChip
              label="Tất cả"
              selected={!currentType}
              onClick={() => setType('')}
            />
            <FilterChip
              label="− Chi"
              selected={currentType === 'expense'}
              onClick={() => setType('expense')}
            />
            <FilterChip
              label="+ Thu"
              selected={currentType === 'income'}
              onClick={() => setType('income')}
            />
          </Box>

          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
            <DatePicker
              label="Tháng"
              value={parseUrlMonth(currentMonth)}
              onChange={(d) => onPickMonth(formatUrlMonth(d))}
              views={['year', 'month']}
              openTo="month"
              format="MM/YYYY"
              slotProps={{
                textField: { size: 'small', sx: { minWidth: 150 } },
                field: { clearable: true, onClear: () => onPickMonth('') },
              }}
            />
            <DatePicker
              label="Ngày"
              value={parseUrlDay(currentDay)}
              onChange={(d) => onPickDay(formatUrlDay(d))}
              format="DD/MM/YYYY"
              slotProps={{
                textField: { size: 'small', sx: { minWidth: 160 } },
                field: { clearable: true, onClear: () => onPickDay('') },
              }}
            />
            <TextField
              size="small"
              type="text"
              inputMode="numeric"
              label="Từ (₫)"
              placeholder="0"
              value={minAmount}
              onChange={(e) => setMinAmount(e.target.value.replace(/[^\d]/g, ''))}
              onBlur={(e) => commitAmount('min', e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
              }}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ minWidth: 120, flex: 1 }}
            />
            <TextField
              size="small"
              type="text"
              inputMode="numeric"
              label="Đến (₫)"
              placeholder="∞"
              value={maxAmount}
              onChange={(e) => setMaxAmount(e.target.value.replace(/[^\d]/g, ''))}
              onBlur={(e) => commitAmount('max', e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
              }}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ minWidth: 120, flex: 1 }}
            />
          </Box>
        </Stack>
      </Collapse>

      {/* Outer wrapper carries the width constraint so the inner scroller can
          actually overflow. Without this, the inner Box just stretches to fit
          its content inside flex/stack parents and there's nothing to scroll.
          Mouse-wheel → horizontal-scroll handled below for desktop. */}
      <Box sx={{ width: '100%', minWidth: 0 }}>
        <Box
          onWheel={(e) => {
            // Convert vertical wheel to horizontal scroll so desktop users
            // without a trackpad can still pan the chip row.
            const target = e.currentTarget;
            if (target.scrollWidth <= target.clientWidth) return;
            if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
              target.scrollLeft += e.deltaY;
            }
          }}
          sx={{
            display: 'flex',
            gap: 1,
            overflowX: 'auto',
            overflowY: 'hidden',
            pb: 0.5,
            touchAction: 'pan-x',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
            '&::-webkit-scrollbar': { display: 'none' },
          }}
        >
          <FilterChip
            label="Tất cả"
            selected={!currentCategory}
            onClick={() => setCategory('')}
          />
          {categories.map((c) => (
            <FilterChip
              key={c.id}
              label={c.name}
              selected={currentCategory === c.id}
              onClick={() => setCategory(c.id)}
            />
          ))}
        </Box>
      </Box>

      {/* Thin bar under the filters that stays visible until the server
          finishes re-rendering with the new searchParams. Reserves height
          even when idle so the layout doesn't shift on click. */}
      <Box sx={{ height: 2, mt: -1 }}>
        {isPending && <LinearProgress sx={{ height: 2, borderRadius: 1 }} />}
      </Box>
    </Box>
  );
}

function FilterChip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <Chip
      label={label}
      onClick={onClick}
      sx={{
        flexShrink: 0,
        height: 36,
        px: 0.5,
        borderRadius: 999,
        fontSize: 14,
        fontWeight: selected ? 500 : 400,
        // Dark pill matches the design mockup. Pure white text (common.white)
        // beats background.paper (#fdf8f8) which reads as faintly cream on
        // dark, and beats primary.contrastText which depends on Minimal Kit's
        // green primary scheme.
        bgcolor: selected ? '#1a1a1a' : 'background.paper',
        color: selected ? '#1a1a1a' : 'text.primary',
        border: '0.5px solid',
        borderColor: selected ? '#1a1a1a' : 'divider',
        // MUI Chip's label is a span — force it to inherit the parent color
        // so the rule above actually paints the text.
        '& .MuiChip-label': { color: 'inherit' },
        '&:hover': {
          bgcolor: selected ? '#000000' : 'action.hover',
        },
      }}
    />
  );
}
