'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';

import Box from '@mui/material/Box';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';

type Category = { id: string; name: string };

type Props = {
  categories: Category[];
};

// Filter bar pushes selections into the URL searchParams so the server
// re-fetches with the new filter on the next render. No client state needed.
export function TransactionFilterBar({ categories }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params.toString());
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    router.replace(`${pathname}?${next.toString()}`);
  };

  return (
    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
      <TextField
        select
        size="small"
        label="Loại"
        value={params.get('type') ?? ''}
        onChange={(e) => setParam('type', e.target.value)}
        sx={{ minWidth: 140 }}
      >
        <MenuItem value="">Tất cả</MenuItem>
        <MenuItem value="expense">Chi</MenuItem>
        <MenuItem value="income">Thu</MenuItem>
      </TextField>

      <TextField
        select
        size="small"
        label="Danh mục"
        value={params.get('categoryId') ?? ''}
        onChange={(e) => setParam('categoryId', e.target.value)}
        sx={{ minWidth: 180 }}
      >
        <MenuItem value="">Tất cả</MenuItem>
        {categories.map((c) => (
          <MenuItem key={c.id} value={c.id}>
            {c.name}
          </MenuItem>
        ))}
      </TextField>
    </Box>
  );
}
