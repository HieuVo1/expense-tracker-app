'use client';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';

import { fCurrency } from 'src/utils/format-number';

import { Chart, useChart } from 'src/components/chart';

type Slice = {
  categoryId: string;
  name: string;
  color: string;
  spent: number;
};

type Props = {
  data: Slice[];
};

// Donut breakdown by category. Slices with 0 spend are hidden so the chart
// reads cleanly when only a few categories have activity. Center label shows
// the total — it doubles as the "this month" headline.
export function CategoryDonut({ data }: Props) {
  const slices = data.filter((d) => d.spent > 0);
  const total = slices.reduce((s, d) => s + d.spent, 0);

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
            value: { fontSize: '20px', fontWeight: 500, formatter: (val: string) => fCurrency(Number(val)) },
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
      <Typography variant="subtitle1" sx={{ mb: 2 }}>
        Phân bổ theo danh mục
      </Typography>

      {slices.length === 0 ? (
        <Box sx={{ py: 6, textAlign: 'center' }}>
          <Typography color="text.secondary">Chưa có giao dịch tháng này.</Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, alignItems: 'center' }}>
          <Chart
            type="donut"
            series={slices.map((s) => s.spent)}
            options={chartOptions}
            sx={{ width: 220, height: 220 }}
          />

          <Box sx={{ flex: 1, minWidth: 200 }}>
            {slices.map((s) => {
              const pct = total > 0 ? (s.spent / total) * 100 : 0;
              return (
                <Box
                  key={s.categoryId}
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
                    {fCurrency(s.spent)}
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
