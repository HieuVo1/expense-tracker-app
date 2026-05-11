'use client';

import type { IconifyName } from 'src/components/iconify';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import { alpha } from '@mui/material/styles';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type Props = {
  /** Destination URL when card is clicked. */
  href: string;
  /** Iconify icon (must be registered in icon-sets). */
  icon: IconifyName;
  /** Hex / theme color for icon tile background. */
  iconColor: string;
  /** Domain label, e.g. "Bản thân". */
  label: string;
  /** Headline value, e.g. "12 entry" or "5.420.000 ₫". */
  value: string;
  /** Optional secondary line under value. */
  hint?: string;
  /** Optional trend annotation (positive/negative tint). */
  trend?: { text: string; positive: boolean };
};

/**
 * Compact stat card for the dashboard hub — one per domain.
 * Mobile-first: 1 col on xs, 2 on sm, 3+ on md → fills the row.
 */
export function HubDomainCard({ href, icon, iconColor, label, value, hint, trend }: Props) {
  return (
    <Card
      component="a"
      href={href}
      sx={{
        display: 'block',
        textDecoration: 'none',
        color: 'inherit',
        p: 2,
        position: 'relative',
        overflow: 'hidden',
        transition: (theme) => theme.transitions.create(['transform', 'box-shadow']),
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: (theme) => theme.customShadows?.z12 ?? 6,
        },
      }}
    >
      {/* Decorative tinted blob behind the icon tile for visual depth */}
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          top: -20,
          right: -20,
          width: 90,
          height: 90,
          borderRadius: '50%',
          bgcolor: (theme) => alpha(iconColor, 0.18),
          pointerEvents: 'none',
        }}
      />

      <Stack direction="row" alignItems="center" gap={1.5} sx={{ mb: 1.5 }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 1.25,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: iconColor,
            flexShrink: 0,
          }}
        >
          <Iconify icon={icon} width={22} sx={{ color: 'common.white' }} />
        </Box>
        <Typography
          variant="overline"
          sx={{
            color: 'text.secondary',
            fontWeight: 700,
            fontSize: 11,
            letterSpacing: 0.6,
            lineHeight: 1.2,
          }}
        >
          {label}
        </Typography>
      </Stack>

      <Typography
        variant="h5"
        sx={{ fontWeight: 700, lineHeight: 1.2, mb: hint || trend ? 0.5 : 0 }}
        className="tabular"
      >
        {value}
      </Typography>

      {hint && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
          {hint}
        </Typography>
      )}

      {trend && (
        <Stack direction="row" alignItems="center" gap={0.5} sx={{ mt: 0.5 }}>
          <Iconify
            icon={trend.positive ? 'eva:trending-up-fill' : 'eva:trending-down-fill'}
            width={14}
            sx={{ color: trend.positive ? 'success.main' : 'error.main' }}
          />
          <Typography
            variant="caption"
            sx={{
              color: trend.positive ? 'success.main' : 'error.main',
              fontWeight: 600,
            }}
          >
            {trend.text}
          </Typography>
        </Stack>
      )}
    </Card>
  );
}
