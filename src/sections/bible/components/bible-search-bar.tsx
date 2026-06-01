'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';

import { paths } from 'src/routes/paths';

import { Iconify } from 'src/components/iconify';

// ---------------------------------------------------------------------------
// BibleSearchBar — shared search input used on both the hub and the results
// page.  Submit-on-Enter (no live search) to keep the hub lightweight.
// ---------------------------------------------------------------------------

type Props = {
  defaultValue?: string;
  /** Override max-width for the desktop variant. Defaults to 480px. */
  maxWidth?: number | string;
};

export function BibleSearchBar({ defaultValue = '', maxWidth = 480 }: Props) {
  const router = useRouter();
  const [q, setQ] = useState(defaultValue);

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = q.trim();
    if (trimmed.length < 2) return;
    router.push(`${paths.dashboard.bible.search}?q=${encodeURIComponent(trimmed)}`);
  };

  return (
    <Box
      component="form"
      onSubmit={submit}
      sx={{ width: '100%', maxWidth: { xs: '100%', sm: maxWidth } }}
    >
      <TextField
        fullWidth
        size="small"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Tìm bài học, câu kinh…"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
            </InputAdornment>
          ),
          endAdornment: q ? (
            <InputAdornment position="end">
              <IconButton size="small" onClick={() => setQ('')} edge="end">
                <Iconify icon="mingcute:close-line" />
              </IconButton>
            </InputAdornment>
          ) : null,
        }}
      />
    </Box>
  );
}
