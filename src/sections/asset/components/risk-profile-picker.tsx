'use client';

import type { AssetType } from '@prisma/client';

import { useState, useTransition } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

import { toast } from 'src/components/snackbar';

import { setUserRiskProfile } from '../actions/risk-profile-actions';
import { ASSET_TYPE_VALUES, ASSET_TYPE_LABELS } from '../constants/asset-types';
import {
  RISK_TARGETS,
  RISK_PROFILE_HEX,
  type RiskProfile,
  RISK_PROFILE_COLORS,
  RISK_PROFILE_LABELS,
  RISK_PROFILE_VALUES,
  RISK_PROFILE_DESCRIPTIONS,
} from '../constants/risk-profiles';

type Props = {
  open: boolean;
  onClose: () => void;
  current: RiskProfile | null;
};

export function RiskProfilePicker({ open, onClose, current }: Props) {
  const [selected, setSelected] = useState<RiskProfile | null>(current);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleConfirm = () => {
    if (!selected) return;
    setError(null);
    startTransition(async () => {
      try {
        await setUserRiskProfile(selected);
        toast.success(`Đã chọn hồ sơ ${RISK_PROFILE_LABELS[selected]}`);
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Cập nhật thất bại');
      }
    });
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Chọn hồ sơ rủi ro</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {!!error && <Alert severity="error">{error}</Alert>}

          <Typography variant="body2" color="text.secondary">
            Chọn hồ sơ phù hợp với mục tiêu và khẩu vị rủi ro của bạn. Mỗi hồ sơ có tỷ trọng
            phân bổ mục tiêu cho từng loại tài sản.
          </Typography>

          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
            }}
          >
            {RISK_PROFILE_VALUES.map((p) => {
              const isSelected = selected === p;
              const paletteColor = RISK_PROFILE_COLORS[p];
              const hex = RISK_PROFILE_HEX[p];
              return (
                <Box
                  key={p}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelected(p)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelected(p);
                    }
                  }}
                  sx={{
                    p: 2.5,
                    borderRadius: 1.5,
                    border: '0.5px solid',
                    borderColor: isSelected ? hex : 'divider',
                    bgcolor: isSelected ? `${hex}1a` : 'transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1.5,
                    transition: 'all 120ms ease',
                    '&:hover': { borderColor: hex },
                  }}
                >
                  <Typography variant="subtitle1" sx={{ color: paletteColor }}>
                    {RISK_PROFILE_LABELS[p]}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ minHeight: 60 }}>
                    {RISK_PROFILE_DESCRIPTIONS[p]}
                  </Typography>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                      Phân bổ mục tiêu
                    </Typography>
                    {ASSET_TYPE_VALUES.map((t: AssetType) => {
                      const pct = (RISK_TARGETS[p][t] ?? 0) * 100;
                      if (pct === 0) return null;
                      return (
                        <Box
                          key={t}
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            py: 0.25,
                          }}
                        >
                          <Typography variant="caption">{ASSET_TYPE_LABELS[t]}</Typography>
                          <Typography variant="caption" className="tabular">
                            {pct.toFixed(0)}%
                          </Typography>
                        </Box>
                      );
                    })}
                  </Box>
                </Box>
              );
            })}
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Huỷ
        </Button>
        <Button
          variant="contained"
          onClick={handleConfirm}
          disabled={!selected || selected === current}
          loading={isPending}
        >
          Lưu
        </Button>
      </DialogActions>
    </Dialog>
  );
}
