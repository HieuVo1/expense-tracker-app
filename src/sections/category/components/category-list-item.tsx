'use client';

import { useState, useTransition } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import type { IconifyName } from 'src/components/iconify';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';

import { CategoryEditDialog } from './category-edit-dialog';
import { deleteCategory } from '../actions/category-actions';

type Props = {
  category: { id: string; name: string; icon: string; color: string; type: 'expense' | 'income' };
  // When true the row is wired into a parent SortableContext and shows a drag
  // handle. False (or omitted) renders a plain row — useful for read-only lists.
  sortable?: boolean;
};

export function CategoryListItem({ category, sortable = false }: Props) {
  const [editOpen, setEditOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id, disabled: !sortable });

  const handleDelete = () => {
    startTransition(async () => {
      try {
        await deleteCategory(category.id);
        toast.success('Đã xoá danh mục');
        setConfirmOpen(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Xoá thất bại');
      }
    });
  };

  return (
    <>
      <Box
        ref={sortable ? setNodeRef : undefined}
        sx={{
          py: 2,
          px: 2.5,
          gap: 2,
          display: 'flex',
          alignItems: 'center',
          borderBottom: '0.5px solid',
          borderColor: 'divider',
          '&:last-of-type': { borderBottom: 'none' },
          ...(sortable && {
            transform: CSS.Transform.toString(transform),
            transition,
            opacity: isDragging ? 0.4 : 1,
            bgcolor: isDragging ? 'action.hover' : 'transparent',
            position: 'relative',
            zIndex: isDragging ? 1 : 'auto',
          }),
        }}
      >
        {sortable && (
          <Box
            {...attributes}
            {...listeners}
            sx={{
              display: 'grid',
              placeItems: 'center',
              cursor: 'grab',
              color: 'text.disabled',
              touchAction: 'none',
              '&:active': { cursor: 'grabbing' },
              '&:hover': { color: 'text.secondary' },
            }}
            aria-label="Kéo để sắp xếp"
          >
            <Iconify icon="custom:drag-dots-fill" width={18} />
          </Box>
        )}

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

        <IconButton onClick={() => setEditOpen(true)} aria-label="Sửa">
          <Iconify icon="solar:pen-bold" width={18} />
        </IconButton>

        <IconButton onClick={() => setConfirmOpen(true)} aria-label="Xoá">
          <Iconify icon="solar:trash-bin-trash-bold" width={18} />
        </IconButton>
      </Box>

      <CategoryEditDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        category={category}
      />

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title={`Xoá danh mục "${category.name}"?`}
        content="Chỉ xoá được khi không còn giao dịch hoặc ngân sách nào dùng danh mục này."
        action={
          <IconButton
            disabled={isPending}
            onClick={handleDelete}
            sx={{
              px: 2,
              borderRadius: 1,
              color: 'error.contrastText',
              bgcolor: 'error.main',
              '&:hover': { bgcolor: 'error.dark' },
            }}
          >
            <Typography variant="button">Xoá</Typography>
          </IconButton>
        }
      />
    </>
  );
}
