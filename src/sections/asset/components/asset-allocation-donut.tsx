'use client';

import type { AssetType } from '@prisma/client';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';

import { fCurrency } from 'src/utils/format-number';

import { Chart, useChart } from 'src/components/chart';

import { ASSET_TYPE_HEX, ASSET_TYPE_LABELS } from '../constants/asset-types';

type Props = {
  byType: Record<AssetType, number>;
};

export function AssetAllocationDonut({ byType }: Props) {
  const slices = (Object.keys(byType) as AssetType[])
    .filter((t) => byType[t] > 0)
    .map((t) => ({
      type: t,
      label: ASSET_TYPE_LABELS[t],
      color: ASSET_TYPE_HEX[t],
      amount: byType[t],
    }));

  const total = slices.reduce((s, d) => s + d.amount, 0);

  const chartOptions = useChart({
    chart: { sparkline: { enabled: true } },
    labels: slices.map((s) => s.label),
    colors: slices.map((s) => s.color),
    stroke: { width: 0 },
    legend: { show: false },
    dataLabels: { enabled: false },
    tooltip: { y: { formatter: (val: number) => fCurrency(val) } },
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
      <Typography variant="subtitle1" sx={{ mb: 2 }}>
        Phân bổ theo loại
      </Typography>

      {slices.length === 0 ? (
        <Box sx={{ py: 6, textAlign: 'center' }}>
          <Typography color="text.secondary">Chưa có tài sản nào.</Typography>
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
                  key={s.type}
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
                    {s.label}
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
