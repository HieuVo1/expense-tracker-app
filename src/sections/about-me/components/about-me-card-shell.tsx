'use client';

import type { ReactNode } from 'react';
import type { IconifyName } from 'src/components/iconify';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type Props = {
  icon: IconifyName;
  title: string;
  subtitle?: string;
  iconBg: string;
  count?: number;
  countLabel?: string;
  footerHref?: string;
  onAdd?: () => void;
  children: ReactNode;
  isEmpty?: boolean;
  emptyText?: string;
};

export function AboutMeCardShell({
  icon,
  title,
  subtitle,
  iconBg,
  count,
  countLabel,
  footerHref,
  onAdd,
  children,
  isEmpty,
  emptyText,
}: Props) {
  return (
    <Card
      sx={{
        p: 2.5,
        borderRadius: 2,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 240,
        // Soft elevation by default, lift on hover for clear card boundaries.
        boxShadow: '0 4px 12px -2px rgba(145, 158, 171, 0.16), 0 2px 4px -2px rgba(145, 158, 171, 0.08)',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 12px 24px -4px rgba(145, 158, 171, 0.24)',
        },
      }}
    >
      {/* Head */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.75 }}>
        <Stack direction="row" alignItems="center" gap={1.25}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 1.25,
              display: 'grid',
              placeItems: 'center',
              background: iconBg,
              flexShrink: 0,
            }}
          >
            <Iconify icon={icon} width={22} />
          </Box>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, lineHeight: 1.3 }}>
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.2 }}>
                {subtitle}
              </Typography>
            )}
          </Box>
        </Stack>

        {count !== undefined && (
          <Chip
            label={countLabel ?? count}
            size="small"
            sx={{ fontSize: 11, fontWeight: 600, bgcolor: 'background.neutral', color: 'text.secondary' }}
          />
        )}
      </Stack>

      {/* Body */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1.25 }}>
        {isEmpty ? (
          <Typography variant="body2" color="text.disabled" sx={{ pt: 1 }}>
            {emptyText}
          </Typography>
        ) : (
          children
        )}
      </Box>

      {/* Footer — single CTA: "Tạo mới" when empty, "Xem tất cả" otherwise.
          Per-card "+ Thêm" removed; FAB handles global quick-add. */}
      <Divider sx={{ my: 1.5 }} />
      <Stack direction="row" alignItems="center">
        {isEmpty && onAdd ? (
          <Button
            size="small"
            variant="text"
            onClick={onAdd}
            startIcon={<Iconify icon="mingcute:add-line" width={14} />}
            sx={{ fontSize: 12 }}
          >
            Tạo mới
          </Button>
        ) : (
          footerHref && (
            <Button
              size="small"
              color="inherit"
              href={footerHref}
              endIcon={<Iconify icon="eva:arrow-ios-forward-fill" width={16} />}
              sx={{ color: 'text.secondary', fontSize: 12 }}
            >
              Xem tất cả
            </Button>
          )
        )}
      </Stack>
    </Card>
  );
}
