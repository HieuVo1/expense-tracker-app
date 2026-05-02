'use client';

import { useState, useTransition } from 'react';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';

import { toast } from 'src/components/snackbar';

import { setUserRiskProfile } from '../actions/risk-profile-actions';
import { RISK_PROFILE_LABELS, type RiskProfile } from '../constants/risk-profiles';

type Props = {
  suggested: RiskProfile;
  onOpenPicker: () => void;
};

export function RiskProfileSuggestBanner({ suggested, onOpenPicker }: Props) {
  const [dismissed, setDismissed] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleAccept = () => {
    startTransition(async () => {
      try {
        await setUserRiskProfile(suggested);
        toast.success(`Đã chọn hồ sơ ${RISK_PROFILE_LABELS[suggested]}`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Cập nhật thất bại');
      }
    });
  };

  if (dismissed) return null;

  return (
    <Alert
      severity="info"
      onClose={() => setDismissed(true)}
      sx={{ alignItems: 'center' }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <Box sx={{ flex: 1, minWidth: 200 }}>
          Tỷ trọng tài sản của bạn giống hồ sơ{' '}
          <strong>{RISK_PROFILE_LABELS[suggested]}</strong> — chọn hồ sơ này?
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
          <Button size="small" variant="outlined" onClick={onOpenPicker}>
            Xem hồ sơ khác
          </Button>
          <Button size="small" variant="contained" onClick={handleAccept} loading={isPending}>
            Chọn ngay
          </Button>
        </Box>
      </Box>
    </Alert>
  );
}
