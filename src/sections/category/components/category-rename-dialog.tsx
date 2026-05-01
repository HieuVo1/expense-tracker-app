'use client';

import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { useState, useTransition } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';

import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';

import { renameCategory } from '../actions/category-actions';

const schema = z.object({
  name: z.string().min(1, { error: 'Vui lòng nhập tên' }).max(50, { error: 'Tối đa 50 ký tự' }),
});

type Props = {
  open: boolean;
  onClose: () => void;
  category: { id: string; name: string };
};

export function CategoryRenameDialog({ open, onClose, category }: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const methods = useForm<{ name: string }>({
    resolver: zodResolver(schema),
    defaultValues: { name: category.name },
    values: { name: category.name },
  });

  const onSubmit = methods.handleSubmit((data) => {
    setError(null);
    startTransition(async () => {
      try {
        await renameCategory({ id: category.id, name: data.name });
        toast.success('Đã đổi tên danh mục');
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Có lỗi xảy ra');
      }
    });
  });

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <Form methods={methods} onSubmit={onSubmit}>
        <DialogTitle>Đổi tên danh mục</DialogTitle>
        <DialogContent>
          <Field.Text
            name="name"
            label="Tên danh mục"
            slotProps={{ inputLabel: { shrink: true } }}
            helperText={error}
            error={!!error}
            autoFocus
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="inherit">
            Huỷ
          </Button>
          <Button type="submit" variant="contained" loading={isPending}>
            Lưu
          </Button>
        </DialogActions>
      </Form>
    </Dialog>
  );
}
