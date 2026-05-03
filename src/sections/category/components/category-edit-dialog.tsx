'use client';

import * as z from 'zod';
import { useForm, Controller } from 'react-hook-form';
import { useState, useTransition } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';

import { TypeToggle } from 'src/sections/transaction/components/type-toggle';

import { createCategory, updateCategory } from '../actions/category-actions';
import { ICON_GROUPS, DEFAULT_CATEGORY_ICON } from './category-icon-groups';

// Paired warm/earthy/muted hues so user-created categories don't clash with
// the seeded six.
const COLORS = [
  '#4a7c59', '#a3593e', '#3d5a80', '#8b5a8c',
  '#7a7445', '#747878', '#2e7d32', '#f57c00',
  '#0288d1', '#6a6a6a', '#c2410c', '#9333ea',
];

const schema = z.object({
  name: z.string().min(1, 'Vui lòng nhập tên').max(50, 'Tối đa 50 ký tự'),
  icon: z.string().min(1, 'Chọn icon'),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Mã màu không hợp lệ'),
  type: z.enum(['expense', 'income']),
});

type FormValues = z.infer<typeof schema>;

type Category = {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'expense' | 'income';
};

type Props = {
  open: boolean;
  onClose: () => void;
  // null = create mode; passing a category = edit mode. Type is locked when editing
  // to prevent orphaning transactions whose type/category combo would no longer match.
  category: Category | null;
};

export function CategoryEditDialog({ open, onClose, category }: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const isEdit = category !== null;

  const methods = useForm<FormValues>({
    resolver: zodResolver(schema),
    // values + key remount in parent ensures defaults reset cleanly when the
    // user opens the dialog for a different category.
    defaultValues: {
      name: category?.name ?? '',
      icon: category?.icon ?? DEFAULT_CATEGORY_ICON,
      color: category?.color ?? COLORS[0],
      type: category?.type ?? 'expense',
    },
  });

  const onSubmit = methods.handleSubmit((data) => {
    setError(null);
    startTransition(async () => {
      try {
        if (isEdit) {
          await updateCategory({ id: category!.id, name: data.name, icon: data.icon, color: data.color });
          toast.success('Đã cập nhật danh mục');
        } else {
          await createCategory(data);
          toast.success('Đã tạo danh mục');
        }
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Có lỗi xảy ra');
      }
    });
  });

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <Form methods={methods} onSubmit={onSubmit}>
        <DialogTitle>{isEdit ? 'Sửa danh mục' : 'Tạo danh mục'}</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            {!!error && <Alert severity="error">{error}</Alert>}

            {!isEdit && (
              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mb: 1, display: 'block' }}
                >
                  Loại
                </Typography>
                <TypeToggle name="type" />
              </Box>
            )}

            <Field.Text
              name="name"
              label="Tên danh mục"
              autoFocus
              slotProps={{ inputLabel: { shrink: true } }}
            />

            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mb: 1, display: 'block' }}
              >
                Icon
              </Typography>
              <Controller
                name="icon"
                control={methods.control}
                render={({ field }) => (
                  <Stack spacing={1.5}>
                    {ICON_GROUPS.map((group) => (
                      <Box key={group.label}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: 'block', mb: 0.75, opacity: 0.8 }}
                        >
                          {group.label}
                        </Typography>
                        <Box
                          sx={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(8, 1fr)',
                            gap: 1,
                          }}
                        >
                          {group.icons.map((icon) => {
                            const selected = field.value === icon;
                            return (
                              <Box
                                key={icon}
                                role="button"
                                tabIndex={0}
                                onClick={() => field.onChange(icon)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    field.onChange(icon);
                                  }
                                }}
                                sx={{
                                  width: 36,
                                  height: 36,
                                  display: 'grid',
                                  placeItems: 'center',
                                  borderRadius: 1,
                                  cursor: 'pointer',
                                  border: '0.5px solid',
                                  borderColor: selected ? 'text.primary' : 'divider',
                                  bgcolor: selected ? 'action.selected' : 'transparent',
                                }}
                              >
                                <Iconify icon={icon} width={20} />
                              </Box>
                            );
                          })}
                        </Box>
                      </Box>
                    ))}
                  </Stack>
                )}
              />
            </Box>

            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mb: 1, display: 'block' }}
              >
                Màu
              </Typography>
              <Controller
                name="color"
                control={methods.control}
                render={({ field }) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {COLORS.map((color) => {
                      const selected = field.value === color;
                      return (
                        <Box
                          key={color}
                          role="button"
                          aria-label={color}
                          tabIndex={0}
                          onClick={() => field.onChange(color)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              field.onChange(color);
                            }
                          }}
                          sx={{
                            width: 28,
                            height: 28,
                            borderRadius: '50%',
                            cursor: 'pointer',
                            bgcolor: color,
                            outline: selected ? '2px solid' : 'none',
                            outlineColor: 'text.primary',
                            outlineOffset: 2,
                          }}
                        />
                      );
                    })}
                  </Box>
                )}
              />
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="inherit">
            Huỷ
          </Button>
          <Button type="submit" variant="contained" loading={isPending}>
            {isEdit ? 'Lưu' : 'Tạo'}
          </Button>
        </DialogActions>
      </Form>
    </Dialog>
  );
}
