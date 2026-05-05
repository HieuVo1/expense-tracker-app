'use client';

import { Controller, useFormContext } from 'react-hook-form';

import Box from '@mui/material/Box';

import { Iconify } from 'src/components/iconify';

import {
  ASSET_TYPE_HEX,
  ASSET_TYPE_ICONS,
  ASSET_TYPE_LABELS,
  ASSET_TYPE_VALUES,
} from '../constants/asset-types';

type Props = {
  name: string;
};

export function AssetTypeSelect({ name }: Props) {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {ASSET_TYPE_VALUES.map((type) => {
            const selected = field.value === type;
            const color = ASSET_TYPE_HEX[type];
            return (
              <Box
                key={type}
                role="button"
                tabIndex={0}
                onClick={() => field.onChange(type)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    field.onChange(type);
                  }
                }}
                sx={{
                  px: 1.5,
                  height: 36,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.75,
                  borderRadius: 1,
                  cursor: 'pointer',
                  border: '0.5px solid',
                  borderColor: selected ? color : 'divider',
                  bgcolor: selected ? `${color}1a` : 'transparent',
                  color: selected ? color : 'text.primary',
                  fontWeight: 500,
                  fontSize: 14,
                  transition: 'all 120ms ease',
                }}
              >
                <Iconify icon={ASSET_TYPE_ICONS[type]} width={16} />
                {ASSET_TYPE_LABELS[type]}
              </Box>
            );
          })}
        </Box>
      )}
    />
  );
}
