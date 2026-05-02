'use client';

import { useState } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import Tabs from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';

import { fCurrency } from 'src/utils/format-number';

import { Chart, useChart } from 'src/components/chart';

type ExpenseSlice = {
  categoryId: string;
  name: string;
  color: string;
  spent: number;
};

type IncomeSlice = {
  categoryId: string;
  name: string;
  color: string;
  earned: number;
};

type Props = {
  expenseData: ExpenseSlice[];
  incomeData: IncomeSlice[];
};

type TabValue = 'expense' | 'income';

// Donut breakdown with Chi/Thu tab toggle. Internally we collapse both data
// shapes to {name, color, amount} so the render path is identical regardless
// of which tab is active.
export function CategoryDonut({ expenseData, incomeData }: Props) {
  const [tab, setTab] = useState<TabValue>('expense');

  // Sort by amount desc so the biggest categories appear at the top of the
  // legend list and own the largest slice clockwise from 12 o'clock — quick
  // read for "where did most of the money go?".
  const slices = (
    tab === 'expense'
      ? expenseData
          .filter((d) => d.spent > 0)
          .map((d) => ({ id: d.categoryId, name: d.name, color: d.color, amount: d.spent }))
      : incomeData
          .filter((d) => d.earned > 0)
          .map((d) => ({ id: d.categoryId, name: d.name, color: d.color, amount: d.earned }))
  ).sort((a, b) => b.amount - a.amount);

  const total = slices.reduce((s, d) => s + d.amount, 0);
  const emptyMessage =
    tab === 'expense' ? 'Chưa có chi tháng này.' : 'Chưa có thu tháng này.';

  const chartOptions = useChart({
    chart: { sparkline: { enabled: true } },
    labels: slices.map((s) => s.name),
    colors: slices.map((s) => s.color),
    stroke: { width: 0 },
    legend: { show: false },
    dataLabels: { enabled: false },
    tooltip: {
      y: { formatter: (val: number) => fCurrency(val) },
    },
    plotOptions: {
      pie: {
        donut: {
          size: '72%',
          labels: {
            show: true,
            value: {
              fontSize: '20px',
              fontWeight: 500,
              formatter: (val: string) => fCurrency(Number(val)),
            },
            total: {
              show: true,
              label: 'Tổng',
              fontSize: '12px',
              color: 'text.secondary',
              formatter: () => fCurrency(total),
            },
          },
        },
      },
    },
  });

  return (
    <Card sx={{ p: 3 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 2,
          gap: 2,
          flexWrap: 'wrap',
        }}
      >
        <Typography variant="subtitle1">Phân bổ theo danh mục</Typography>
        <Tabs
          value={tab}
          onChange={(_, v: TabValue) => setTab(v)}
          sx={{ minHeight: 32, '& .MuiTab-root': { minHeight: 32, py: 0.5, px: 2 } }}
        >
          <Tab value="expense" label="Chi" />
          <Tab value="income" label="Thu" />
        </Tabs>
      </Box>

      {slices.length === 0 ? (
        <Box sx={{ py: 6, textAlign: 'center' }}>
          <Typography color="text.secondary">{emptyMessage}</Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, alignItems: 'center' }}>
          <Chart
            type="donut"
            series={slices.map((s) => s.amount)}
            options={chartOptions}
            sx={{ width: 220, height: 220 }}
          />

          <Box sx={{ flex: 1, minWidth: 200 }}>
            {slices.map((s) => {
              const pct = total > 0 ? (s.amount / total) * 100 : 0;
              return (
                <Box
                  key={s.id}
                  sx={{
                    py: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    borderBottom: '0.5px solid',
                    borderColor: 'divider',
                    '&:last-of-type': { borderBottom: 'none' },
                  }}
                >
                  <Box
                    sx={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      bgcolor: s.color,
                      flexShrink: 0,
                    }}
                  />
                  <Typography variant="body2" sx={{ flex: 1 }}>
                    {s.name}
                  </Typography>
                  <Typography
                    className="tabular"
                    variant="caption"
                    color="text.secondary"
                    sx={{ minWidth: 48, textAlign: 'right' }}
                  >
                    {pct.toFixed(0)}%
                  </Typography>
                  <Typography
                    className="tabular"
                    variant="body2"
                    sx={{ minWidth: 90, textAlign: 'right' }}
                  >
                    {fCurrency(s.amount)}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        </Box>
      )}
    </Card>
  );
}
