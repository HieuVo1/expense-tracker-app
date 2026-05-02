'use client';

import dayjs from 'dayjs';
import { useRef, useState, useEffect, useTransition } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { fCurrency } from 'src/utils/format-number';

import { Iconify } from 'src/components/iconify';

import { TransactionListItem } from './transaction-list-item';
import {
  listTransactions,
  type TransactionListFilter,
} from '../actions/transaction-actions';

type Tx = Awaited<ReturnType<typeof listTransactions>>['rows'][number];

type Props = {
  initialRows: Tx[];
  initialHasMore: boolean;
  filter: TransactionListFilter;
  pageSize: number;
};

// Vietnamese conventions: today / yesterday / "DD thg M YYYY".
function formatGroupLabel(dateIso: string) {
  const today = dayjs().startOf('day');
  const yesterday = today.subtract(1, 'day');
  const d = dayjs(dateIso).startOf('day');
  if (d.isSame(today)) return 'Hôm nay';
  if (d.isSame(yesterday)) return 'Hôm qua';
  return d.format('DD [thg] M YYYY');
}

function dayNet(rows: Tx[]) {
  return rows.reduce((s, t) => s + (t.type === 'income' ? t.amount : -t.amount), 0);
}

// Owns the appended-rows state. Server view passes the first page; subsequent
// pages are fetched via the same server action and merged in. A `key` driven
// by filter values in the parent ensures this remounts with fresh state when
// the user changes filters. When the server re-renders with fresh data (after
// edit/delete mutations call revalidatePath), `initialRows` arrives as a new
// reference — we refill the appended rows to preserve the user's scroll depth
// instead of collapsing the list back to page 1.
export function TransactionListGrouped({ initialRows, initialHasMore, filter, pageSize }: Props) {
  const [appendedRows, setAppendedRows] = useState<Tx[]>([]);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isPending, startTransition] = useTransition();

  // Tracks the last `initialRows` ref we processed and the appended count at
  // that moment, so the refill effect can detect server revalidation without
  // re-running on its own setState.
  const lastInitialRef = useRef(initialRows);
  const appendedCountRef = useRef(0);
  appendedCountRef.current = appendedRows.length;

  useEffect(() => {
    if (lastInitialRef.current === initialRows) return;
    lastInitialRef.current = initialRows;

    const previouslyAppended = appendedCountRef.current;
    if (previouslyAppended === 0) {
      setHasMore(initialHasMore);
      return;
    }

    // Refetch the same number of rows the user had loaded beyond page 1, so
    // edit/delete mutations don't visibly collapse the list to the first page.
    startTransition(async () => {
      const next = await listTransactions(filter, {
        skip: initialRows.length,
        take: previouslyAppended,
      });
      setAppendedRows(next.rows);
      setHasMore(next.hasMore);
    });
  }, [initialRows, initialHasMore, filter]);

  const rows = appendedRows.length > 0 ? [...initialRows, ...appendedRows] : initialRows;

  const handleLoadMore = () => {
    startTransition(async () => {
      const next = await listTransactions(filter, { skip: rows.length, take: pageSize });
      setAppendedRows((prev) => [...prev, ...next.rows]);
      setHasMore(next.hasMore);
    });
  };

  // `t.date` is a full ISO datetime ("YYYY-MM-DDTHH:mm:ss.sssZ"); slice(0, 10)
  // gives the day key without dragging dayjs into the grouping path.
  const grouped = rows.reduce<Record<string, Tx[]>>((acc, t) => {
    const dayKey = t.date.slice(0, 10);
    (acc[dayKey] ??= []).push(t);
    return acc;
  }, {});
  const groupKeys = Object.keys(grouped);

  return (
    <Stack spacing={2.5}>
      {groupKeys.map((dateKey) => {
        const net = dayNet(grouped[dateKey]);
        const netPositive = net >= 0;
        return (
          <Box key={dateKey}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                gap: 2,
                mb: 1,
                px: 0.5,
              }}
            >
              <Typography variant="subtitle2" color="text.primary">
                {formatGroupLabel(dateKey)}
              </Typography>
              <Typography
                className="tabular"
                variant="caption"
                sx={{ color: netPositive ? 'success.dark' : 'text.secondary' }}
              >
                {netPositive ? '+' : '−'}
                {fCurrency(Math.abs(net))}
              </Typography>
            </Box>
            <Card>
              {grouped[dateKey].map((t) => (
                <TransactionListItem key={t.id} transaction={t} />
              ))}
            </Card>
          </Box>
        );
      })}

      {hasMore && (
        <Box sx={{ display: 'flex', justifyContent: 'center', pt: 1 }}>
          <Button
            variant="outlined"
            color="inherit"
            onClick={handleLoadMore}
            loading={isPending}
            startIcon={<Iconify icon="eva:arrow-downward-fill" />}
          >
            Tải thêm
          </Button>
        </Box>
      )}
    </Stack>
  );
}
