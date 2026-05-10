'use client';

import type { AboutMeRow } from '../types';

import { toast } from 'sonner';
import { useState } from 'react';

import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

import { deleteAboutMe } from '../actions/about-me-actions';
import { ABOUT_ME_TYPE_LABELS } from '../constants/about-me-types';

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  row: AboutMeRow;
  onClose: () => void;
  onDeleted: () => void;
};

export function AboutMeDeleteConfirm({ open, row, onClose, onDeleted }: Props) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      await deleteAboutMe(row.id);
      toast.success('Đã xoá');
      onDeleted();
      onClose();
    } catch (err) {
      toast.error('Có lỗi xảy ra. Vui lòng thử lại.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Xác nhận xoá</DialogTitle>
      <Divider />
      <DialogContent sx={{ pt: 2 }}>
        <Typography variant="body2">
          Bạn có chắc muốn xoá{' '}
          <strong>{ABOUT_ME_TYPE_LABELS[row.type]}</strong>:{' '}
          <em>&ldquo;{row.title}&rdquo;</em>? Hành động này không thể hoàn tác.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button color="inherit" onClick={onClose} disabled={loading}>
          Huỷ
        </Button>
        <LoadingButton color="error" variant="contained" loading={loading} onClick={handleDelete}>
          Xoá
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}
