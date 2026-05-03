'use client';

import type { AssetType } from '@prisma/client';

import { useMemo, useState, useTransition } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';

import type { AssetRow, CashDelta } from '../types';
import { AssetList } from '../components/asset-list';
import { AssetPLBar } from '../components/asset-pl-bar';
import { computeTotals } from '../utils/compute-totals';
import { deleteAsset } from '../actions/asset-actions';
import { CashSyncBanner } from '../components/cash-sync-banner';
import { CashSyncPicker } from '../components/cash-sync-picker';
import { AssetEmptyState } from '../components/asset-empty-state';
import { ASSET_TYPE_VALUES } from '../constants/asset-types';
import { AssetFormDialog } from '../components/asset-form-dialog';
import { AssetSummaryCards } from '../components/asset-summary-cards';
import { RiskProfilePicker } from '../components/risk-profile-picker';
import { AllocationDriftRow } from '../components/allocation-drift-row';
import { AssetAllocationDonut } from '../components/asset-allocation-donut';
import { RiskProfileSuggestBanner } from '../components/risk-profile-suggest-banner';
import {
  RISK_TARGETS,
  DRIFT_WARN_THRESHOLD,
  type RiskProfile,
} from '../constants/risk-profiles';
import {
  calcDrift,
  calcAllocation,
  suggestProfile,
  rebalanceHints,
} from '../utils/derive-risk-profile';

type Props = {
  assets: AssetRow[];
  initialRiskProfile: RiskProfile | null;
  cashDelta: CashDelta | null;
};

export function AssetListClient({ assets, initialRiskProfile, cashDelta }: Props) {
  const totals = computeTotals(assets);
  const isEmpty = assets.length === 0;

  const cashAssets = useMemo(() => assets.filter((a) => a.type === 'CASH'), [assets]);
  const showCashBanner = cashDelta !== null && cashDelta.delta !== 0 && cashAssets.length > 0;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AssetRow | null>(null);

  const [riskPickerOpen, setRiskPickerOpen] = useState(false);
  const [cashPickerOpen, setCashPickerOpen] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<AssetRow | null>(null);
  const [isDeleting, startDeleteTransition] = useTransition();

  const allocation = useMemo(() => calcAllocation(totals.byType), [totals.byType]);
  const suggested = useMemo(
    () => (allocation && initialRiskProfile === null ? suggestProfile(allocation) : null),
    [allocation, initialRiskProfile],
  );
  const drift = useMemo(
    () => (allocation && initialRiskProfile ? calcDrift(allocation, initialRiskProfile) : null),
    [allocation, initialRiskProfile],
  );
  const hints = useMemo(
    () => (drift ? rebalanceHints(drift, DRIFT_WARN_THRESHOLD) : []),
    [drift],
  );

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (asset: AssetRow) => {
    setEditing(asset);
    setDialogOpen(true);
  };

  const closeDialog = () => setDialogOpen(false);

  const confirmDelete = () => {
    const target = deleteTarget;
    if (!target) return;
    startDeleteTransition(async () => {
      try {
        await deleteAsset(target.id);
        toast.success('Đã xoá tài sản');
        setDeleteTarget(null);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Xoá thất bại');
      }
    });
  };

  return (
    <Stack spacing={3}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 2,
          flexWrap: 'wrap',
        }}
      >
        <Box>
          <Typography variant="h4" sx={{ mb: 0.5 }}>
            Tài sản
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Tổng quan các khoản tiền và đầu tư
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Iconify icon="solar:add-circle-bold" />}
          onClick={openCreate}
        >
          Thêm tài sản
        </Button>
      </Box>

      {isEmpty ? (
        <AssetEmptyState />
      ) : (
        <>
          {showCashBanner && (
            <CashSyncBanner
              cashDelta={cashDelta}
              onPickerOpen={() => setCashPickerOpen(true)}
            />
          )}

          {suggested && (
            <RiskProfileSuggestBanner
              suggested={suggested}
              onOpenPicker={() => setRiskPickerOpen(true)}
            />
          )}

          {hints.length > 0 && (
            <Alert severity="warning">
              <Stack spacing={0.5}>
                {hints.map((h) => (
                  <Typography key={h} variant="body2">
                    • {h}
                  </Typography>
                ))}
              </Stack>
            </Alert>
          )}

          <AssetSummaryCards
            totals={totals}
            riskProfile={initialRiskProfile}
            onChangeRiskProfile={() => setRiskPickerOpen(true)}
          />

          <Box
            sx={{
              display: 'grid',
              gap: 3,
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
            }}
          >
            <AssetAllocationDonut byType={totals.byType} />
            <AssetPLBar assets={assets} />
          </Box>

          {initialRiskProfile && allocation && (
            <Card sx={{ p: 3 }}>
              <Typography variant="subtitle1" sx={{ mb: 1.5 }}>
                Phân bổ mục tiêu vs thực tế
              </Typography>
              {ASSET_TYPE_VALUES.map((t: AssetType) => (
                <AllocationDriftRow
                  key={t}
                  type={t}
                  actualRatio={allocation[t] ?? 0}
                  targetRatio={RISK_TARGETS[initialRiskProfile][t] ?? 0}
                  driftWarn={Math.abs((drift?.[t] ?? 0)) > DRIFT_WARN_THRESHOLD}
                />
              ))}
            </Card>
          )}

          <AssetList
            assets={assets}
            onEdit={openEdit}
            onDelete={(asset) => setDeleteTarget(asset)}
          />
        </>
      )}

      <AssetFormDialog open={dialogOpen} onClose={closeDialog} editing={editing} />

      <RiskProfilePicker
        open={riskPickerOpen}
        onClose={() => setRiskPickerOpen(false)}
        current={initialRiskProfile}
      />

      {showCashBanner && (
        <CashSyncPicker
          open={cashPickerOpen}
          onClose={() => setCashPickerOpen(false)}
          cashAssets={cashAssets}
          cashDelta={cashDelta}
        />
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Xoá tài sản?"
        content={
          deleteTarget
            ? `Hành động này sẽ xoá "${deleteTarget.name}" và không thể hoàn tác.`
            : ''
        }
        action={
          <IconButton
            disabled={isDeleting}
            onClick={confirmDelete}
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
    </Stack>
  );
}
