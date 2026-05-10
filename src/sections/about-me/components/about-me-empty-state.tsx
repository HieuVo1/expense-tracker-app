'use client';

import type { IconifyName } from 'src/components/iconify';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type Props = {
  icon?: IconifyName;
  label: string;
  ctaLabel?: string;
  onCta?: () => void;
};

/**
 * Reusable empty state for About me cards and list pages.
 * Renders an icon (optional), label text, and an optional CTA button.
 */
export function AboutMeEmptyState({ icon, label, ctaLabel, onCta }: Props) {
  return (
    <Box
      sx={{
        py: 4,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 1.5,
        textAlign: 'center',
      }}
    >
      {icon && (
        <Iconify
          icon={icon}
          width={36}
          sx={{ color: 'text.disabled', opacity: 0.5 }}
          aria-hidden="true"
        />
      )}

      <Typography variant="body2" color="text.disabled" sx={{ maxWidth: 280 }}>
        {label}
      </Typography>

      {ctaLabel && onCta && (
        <Button
          variant="outlined"
          size="small"
          onClick={onCta}
          aria-label={ctaLabel}
        >
          {ctaLabel}
        </Button>
      )}
    </Box>
  );
}
