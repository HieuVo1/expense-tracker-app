'use client';

import dayjs from 'dayjs';
import { useState, useTransition } from 'react';

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
// the user changes filters.
export function TransactionListGrouped({ initialRows, initialHasMore, filter, pageSize }: Props) {
  const [rows, setRows] = useState<Tx[]>(initialRows);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isPending, startTransition] = useTransition();

  const handleLoadMore = () => {
    startTransition(async () => {
      const next = await listTransactions(filter, { skip: rows.length, take: pageSize });
      setRows((prev) => [...prev, ...next.rows]);
      setHasMore(next.hasMore);
    });
  };

  const grouped = rows.reduce<Record<string, Tx[]>>((acc, t) => {
    (acc[t.date] ??= []).push(t);
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
