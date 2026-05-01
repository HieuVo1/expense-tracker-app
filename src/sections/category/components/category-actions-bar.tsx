'use client';

import { useState } from 'react';

import Button from '@mui/material/Button';

import { Iconify } from 'src/components/iconify';

import { CategoryEditDialog } from './category-edit-dialog';

// Top-bar button that opens the edit dialog in "create" mode (category=null).
// Lives in its own client component so the parent view can stay an RSC.
export function CategoryActions() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="contained"
        onClick={() => setOpen(true)}
        startIcon={<Iconify icon="solar:add-circle-bold" />}
      >
        Tạo danh mục
      </Button>
      <CategoryEditDialog open={open} onClose={() => setOpen(false)} category={null} />
    </>
  );
}
