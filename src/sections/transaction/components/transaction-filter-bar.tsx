'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';

import { Iconify } from 'src/components/iconify';

type Category = { id: string; name: string };

type Props = {
  categories: Category[];
};

// Filter bar pushes selections into the URL searchParams so the server
// re-fetches with the new filter on the next render. Search input is
// debounced locally so each keystroke doesn't fire a new SSR request.
export function TransactionFilterBar({ categories }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const currentCategory = params.get('categoryId') ?? '';
  const currentQ = params.get('q') ?? '';

  const [q, setQ] = useState(currentQ);

  // Debounced commit of the search query — avoids one network round-trip per
  // keystroke. 300ms feels responsive without thrashing the server.
  useEffect(() => {
    const trimmed = q.trim();
    if (trimmed === currentQ) return;
    const t = setTimeout(() => {
      const next = new URLSearchParams(params.toString());
      if (trimmed) next.set('q', trimmed);
      else next.delete('q');
      router.replace(`${pathname}?${next.toString()}`);
    }, 300);
    return () => clearTimeout(t);
  }, [q, currentQ, params, pathname, router]);

  const setCategory = (categoryId: string) => {
    const next = new URLSearchParams(params.toString());
    if (categoryId) next.set('categoryId', categoryId);
    else next.delete('categoryId');
    router.replace(`${pathname}?${next.toString()}`);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
      <TextField
        size="small"
        fullWidth
        placeholder="Tìm kiếm giao dịch…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <Iconify icon="eva:search-fill" width={18} />
              </InputAdornment>
            ),
          },
        }}
      />

      {/* Outer wrapper carries the width constraint so the inner scroller can
          actually overflow. Without this, the inner Box just stretches to fit
          its content inside flex/stack parents and there's nothing to scroll.
          Mouse-wheel → horizontal-scroll handled below for desktop. */}
      <Box sx={{ width: '100%', minWidth: 0 }}>
        <Box
          onWheel={(e) => {
            // Convert vertical wheel to horizontal scroll so desktop users
            // without a trackpad can still pan the chip row.
            const target = e.currentTarget;
            if (target.scrollWidth <= target.clientWidth) return;
            if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
              target.scrollLeft += e.deltaY;
            }
          }}
          sx={{
            display: 'flex',
            gap: 1,
            overflowX: 'auto',
            overflowY: 'hidden',
            pb: 0.5,
            touchAction: 'pan-x',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
            '&::-webkit-scrollbar': { display: 'none' },
          }}
        >
          <FilterChip
            label="Tất cả"
            selected={!currentCategory}
            onClick={() => setCategory('')}
          />
          {categories.map((c) => (
            <FilterChip
              key={c.id}
              label={c.name}
              selected={currentCategory === c.id}
              onClick={() => setCategory(c.id)}
            />
          ))}
        </Box>
      </Box>
    </Box>
  );
}

function FilterChip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <Chip
      label={label}
      onClick={onClick}
      sx={{
        flexShrink: 0,
        height: 36,
        px: 0.5,
        borderRadius: 999,
        fontSize: 14,
        fontWeight: selected ? 500 : 400,
        // Dark pill matches the design mockup. Pure white text (common.white)
        // beats background.paper (#fdf8f8) which reads as faintly cream on
        // dark, and beats primary.contrastText which depends on Minimal Kit's
        // green primary scheme.
        bgcolor: selected ? '#1a1a1a' : 'background.paper',
        color: selected ? '#1a1a1a' : 'text.primary',
        border: '0.5px solid',
        borderColor: selected ? '#1a1a1a' : 'divider',
        // MUI Chip's label is a span — force it to inherit the parent color
        // so the rule above actually paints the text.
        '& .MuiChip-label': { color: 'inherit' },
        '&:hover': {
          bgcolor: selected ? '#000000' : 'action.hover',
        },
      }}
    />
  );
}
