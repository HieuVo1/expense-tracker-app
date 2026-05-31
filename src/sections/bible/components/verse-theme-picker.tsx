'use client';

import type { ThemeRow } from '../types';

import { toast } from 'sonner';
import { useState, useTransition } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Menu from '@mui/material/Menu';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import ListItemText from '@mui/material/ListItemText';
import InputAdornment from '@mui/material/InputAdornment';
import CircularProgress from '@mui/material/CircularProgress';

import { Iconify } from 'src/components/iconify';

import {
  createTheme,
  assignVerseTheme,
  removeVerseTheme,
} from '../actions/bible-theme-actions';

type AssignedTheme = { id: string; name: string; color: string };

type Props = {
  verseId: string;
  assigned: AssignedTheme[];
  allThemes: Pick<ThemeRow, 'id' | 'name' | 'color'>[];
};

// Compact theme picker shown next to each verse. Lists current themes as
// removable chips + a button to add. Add menu lists existing themes and has
// an inline input at the top to create + assign a new theme in one go.

export function VerseThemePicker({ verseId, assigned, allThemes }: Props) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [pending, startTransition] = useTransition();

  const assignedIds = new Set(assigned.map((t) => t.id));
  const unassigned = allThemes.filter((t) => !assignedIds.has(t.id));

  const close = () => {
    setAnchorEl(null);
    setNewName('');
  };

  const doAssign = (themeId: string) => {
    startTransition(async () => {
      try {
        await assignVerseTheme({ verseId, themeId });
        toast.success('Đã gắn chủ đề');
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Lỗi gắn chủ đề');
      }
    });
    close();
  };

  const doRemove = (themeId: string) => {
    startTransition(async () => {
      try {
        await removeVerseTheme({ verseId, themeId });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Lỗi gỡ chủ đề');
      }
    });
  };

  const doCreate = async () => {
    const trimmed = newName.trim();
    if (!trimmed || creating) return;
    setCreating(true);
    try {
      const created = await createTheme({ name: trimmed });
      await assignVerseTheme({ verseId, themeId: created.id });
      toast.success(`Đã tạo & gắn "${trimmed}"`);
      close();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi tạo chủ đề');
    } finally {
      setCreating(false);
    }
  };

  return (
    <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap alignItems="center">
      {assigned.map((t) => (
        <Chip
          key={t.id}
          label={t.name}
          size="small"
          onDelete={pending ? undefined : () => doRemove(t.id)}
          sx={{ bgcolor: `${t.color}22`, color: t.color, borderColor: t.color }}
          variant="outlined"
        />
      ))}
      <Button
        size="small"
        variant="text"
        startIcon={<Iconify icon="solar:add-circle-bold" />}
        onClick={(e) => setAnchorEl(e.currentTarget)}
        disabled={pending}
      >
        Chủ đề
      </Button>
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={close}>
        <Box sx={{ px: 1.5, py: 1, minWidth: 240 }}>
          <TextField
            size="small"
            fullWidth
            autoFocus
            placeholder="Tên chủ đề mới..."
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                doCreate();
              }
            }}
            disabled={creating}
            inputProps={{ maxLength: 60 }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={doCreate}
                    disabled={!newName.trim() || creating}
                    edge="end"
                  >
                    {creating ? (
                      <CircularProgress size={14} />
                    ) : (
                      <Iconify icon="solar:add-circle-bold" width={18} />
                    )}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Box>
        {unassigned.length > 0 && <Divider />}
        {unassigned.map((t) => (
          <MenuItem key={t.id} onClick={() => doAssign(t.id)}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: t.color, mr: 1 }} />
            {t.name}
          </MenuItem>
        ))}
        {unassigned.length === 0 && (
          <MenuItem disabled>
            <ListItemText
              primary="Chưa có chủ đề trống"
              secondary="Nhập tên ở trên để tạo mới"
              primaryTypographyProps={{ variant: 'body2' }}
            />
          </MenuItem>
        )}
      </Menu>
      {pending && <CircularProgress size={14} sx={{ ml: 1 }} />}
    </Stack>
  );
}
