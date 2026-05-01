'use client';

import { useState } from 'react';

import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import type { IconifyName } from 'src/components/iconify';

import { Iconify } from 'src/components/iconify';

import { CategoryRenameDialog } from './category-rename-dialog';

type Props = {
  category: { id: string; name: string; icon: string; color: string };
};

export function CategoryListItem({ category }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Box
        sx={{
          py: 2,
          px: 2.5,
          gap: 2,
          display: 'flex',
          alignItems: 'center',
          borderBottom: '0.5px solid',
          borderColor: 'divider',
          '&:last-of-type': { borderBottom: 'none' },
        }}
      >
        <Box
          sx={{
            width: 40,
            height: 40,
            display: 'grid',
            placeItems: 'center',
            borderRadius: 1,
            bgcolor: `${category.color}1a`,
            color: category.color,
          }}
        >
          <Iconify icon={category.icon as IconifyName} width={22} />
        </Box>

        <Typography variant="body1" sx={{ flex: 1 }}>
          {category.name}
        </Typography>

        <IconButton onClick={() => setOpen(true)} aria-label="Đổi tên">
          <Iconify icon="solar:pen-bold" width={18} />
        </IconButton>
      </Box>

      <CategoryRenameDialog open={open} onClose={() => setOpen(false)} category={category} />
    </>
  );
}
