'use client';

import { toast } from 'sonner';
import { useState, useTransition } from 'react';

import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import TextField from '@mui/material/TextField';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { updateChallengePrompt } from '../actions/bible-challenge-actions';

const MAX_LEN = 200;

type Props = {
  open: boolean;
  verseId: string;
  themeId: string;
  currentPrompt: string | null;
  onClose: () => void;
  onSaved: (newPrompt: string | null) => void;
};

export function ChallengePromptEditDialog({
  open,
  verseId,
  themeId,
  currentPrompt,
  onClose,
  onSaved,
}: Props) {
  const [value, setValue] = useState(currentPrompt ?? '');
  const [pending, startTransition] = useTransition();

  // Reset local value when dialog opens with new card data.
  const handleEntered = () => setValue(currentPrompt ?? '');

  const handleSave = () => {
    startTransition(async () => {
      try {
        const trimmed = value.trim() || null;
        await updateChallengePrompt({ verseId, themeId, prompt: trimmed });
        toast.success('Đã lưu lời nhắc');
        onSaved(trimmed);
        onClose();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Lỗi khi lưu');
      }
    });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      TransitionProps={{ onEntered: handleEntered }}
    >
      <DialogTitle>Sửa lời nhắc</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          multiline
          minRows={3}
          fullWidth
          label="Lời nhắc thử thách"
          placeholder="Để trống → dùng tên chủ đề"
          value={value}
          onChange={(e) => setValue(e.target.value.slice(0, MAX_LEN))}
          helperText={`${value.length} / ${MAX_LEN} ký tự tối đa`}
          sx={{ mt: 1 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={pending}>
          Huỷ
        </Button>
        <Button variant="contained" onClick={handleSave} disabled={pending}>
          Lưu
        </Button>
      </DialogActions>
    </Dialog>
  );
}
