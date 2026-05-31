'use client';

import type { ThemeRow } from '../types';

import { toast } from 'sonner';
import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { ColorPicker } from 'src/components/color-utils';

import { createTheme, updateTheme } from '../actions/bible-theme-actions';

type Props = {
  open: boolean;
  onClose: () => void;
  // If supplied, opens in edit mode; otherwise create.
  edit?: Pick<ThemeRow, 'id' | 'name' | 'color' | 'description'>;
};

const DEFAULT_COLOR = '#00A76F';

// Minimal Kit palette main hues — keeps tags visually consistent with the rest of the app.
const THEME_COLOR_OPTIONS = [
  '#00A76F', // primary
  '#8E33FF', // secondary
  '#00B8D9', // info
  '#22C55E', // success
  '#FFAB00', // warning
  '#FF5630', // error
  '#1877F2', // blue
  '#637381', // neutral
];

export function ThemeFormDialog({ open, onClose, edit }: Props) {
  const [name, setName] = useState('');
  const [color, setColor] = useState(DEFAULT_COLOR);
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setName(edit?.name ?? '');
      setColor(edit?.color ?? DEFAULT_COLOR);
      setDescription(edit?.description ?? '');
    }
  }, [open, edit]);

  const handleSave = async () => {
    setBusy(true);
    try {
      if (edit) {
        await updateTheme({ id: edit.id, name, color, description: description || null });
        toast.success('Đã cập nhật chủ đề');
      } else {
        await createTheme({ name, color, description: description || null });
        toast.success('Đã tạo chủ đề');
      }
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi lưu chủ đề');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{edit ? 'Sửa chủ đề' : 'Tạo chủ đề mới'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField
            label="Tên"
            value={name}
            onChange={(e) => setName(e.target.value)}
            size="small"
            fullWidth
            autoFocus
            inputProps={{ maxLength: 60 }}
          />
          <Box>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>
              Màu
            </Typography>
            <ColorPicker
              value={color}
              onChange={(next) => setColor(next as string)}
              options={
                THEME_COLOR_OPTIONS.includes(color)
                  ? THEME_COLOR_OPTIONS
                  : [color, ...THEME_COLOR_OPTIONS]
              }
            />
          </Box>
          <TextField
            label="Mô tả (tuỳ chọn)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            size="small"
            fullWidth
            multiline
            rows={2}
            inputProps={{ maxLength: 500 }}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={busy}>
          Huỷ
        </Button>
        <Button variant="contained" onClick={handleSave} disabled={!name.trim() || busy}>
          {busy ? 'Đang lưu...' : 'Lưu'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
