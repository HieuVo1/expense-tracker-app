'use client';

import type { WheelSuggestion, LifeWheelAssessmentDto } from 'src/lib/ai/wheel-types';

import dayjs from 'dayjs';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useTransition } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Collapse from '@mui/material/Collapse';
import { useTheme } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import { paths } from 'src/routes/paths';

import { Iconify } from 'src/components/iconify';

import { WheelRadarChart } from './wheel-radar-chart';
import { WheelSuggestionsGrid } from './wheel-suggestions-grid';
import { runAssessment, createTaskFromSuggestion } from '../actions/wheel-actions';

// ----------------------------------------------------------------------

const LS_KEY = 'wheel-card.collapsed';
const STALE_DAYS = 7;

type Props = {
  initial: LifeWheelAssessmentDto | null;
  history: LifeWheelAssessmentDto[];
};

export function WheelOfLifeCard({ initial, history }: Props) {
  const theme = useTheme();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [assessment, setAssessment] = useState<LifeWheelAssessmentDto | null>(initial);
  const [historyState, setHistoryState] = useState<LifeWheelAssessmentDto[]>(history);
  const [periodDays, setPeriodDays] = useState<number>(30);
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [creatingKey, setCreatingKey] = useState<string | null>(null);

  // Restore collapse preference (default: open)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LS_KEY);
      if (stored === '1') setCollapsed(true);
    } catch {
      /* ignore */
    }
  }, []);

  const toggleCollapse = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(LS_KEY, next ? '1' : '0');
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const handleRun = () => {
    startTransition(async () => {
      try {
        const result = await runAssessment(periodDays);
        setAssessment(result);
        setHistoryState((prev) => [result, ...prev].slice(0, 6));
        toast.success('Đã cập nhật vòng tròn cuộc sống');
      } catch (err) {
        console.error(err);
        toast.error('Không thể đánh giá. Vui lòng thử lại sau.');
      }
    });
  };

  const handleCreateTask = (s: WheelSuggestion, taskTitle: string) => {
    // Key scopes the loader to the exact task row the user clicked.
    const key = `${s.area}-${taskTitle}`;
    setCreatingKey(key);
    startTransition(async () => {
      try {
        const { planId } = await createTaskFromSuggestion(s, taskTitle);
        toast.success('Đã thêm task vào kế hoạch', {
          action: {
            label: 'Mở',
            onClick: () => router.push(paths.dashboard.planDetail(planId)),
          },
        });
      } catch (err) {
        console.error(err);
        toast.error('Không thể thêm task');
      } finally {
        setCreatingKey(null);
      }
    });
  };

  // Stale = no assessment OR > 7 days old
  const isStale = !assessment || dayjs().diff(dayjs(assessment.computedAt), 'day') > STALE_DAYS;

  const prevScores = historyState.length >= 2 ? historyState[1].scores : undefined;

  return (
    <Card sx={{ overflow: 'hidden' }}>
      {/* Header */}
      <Box
        sx={{
          px: 2.5,
          py: 1.75,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          borderBottom: collapsed ? 'none' : `1px solid ${theme.palette.divider}`,
        }}
      >
        <Iconify
          icon="solar:graph-up-bold"
          width={22}
          sx={{ color: 'primary.main', flexShrink: 0 }}
        />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle1">Vòng tròn cuộc sống</Typography>
          <Typography variant="caption" color="text.secondary">
            {assessment
              ? `Đánh giá lúc ${dayjs(assessment.computedAt).format('DD/MM/YYYY HH:mm')} (${assessment.periodDays} ngày)`
              : 'Chưa có đánh giá'}
          </Typography>
        </Box>

        {assessment && isStale && (
          <Chip label="Đã cũ" color="warning" size="small" sx={{ flexShrink: 0 }} />
        )}

        <IconButton size="small" onClick={toggleCollapse}>
          <Iconify
            icon="eva:chevron-down-fill"
            width={20}
            sx={{
              transition: 'transform 0.2s',
              transform: collapsed ? 'rotate(0deg)' : 'rotate(180deg)',
            }}
          />
        </IconButton>
      </Box>

      <Collapse in={!collapsed}>
        <Box sx={{ p: 2.5 }}>
          {/* Controls */}
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1.5}
            alignItems={{ xs: 'stretch', sm: 'center' }}
            sx={{ mb: 2 }}
          >
            <Box sx={{ flex: 1 }}>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: 'block', mb: 0.5 }}
              >
                Khoảng thời gian phân tích
              </Typography>
              <ToggleButtonGroup
                exclusive
                value={periodDays}
                onChange={(_, v: number | null) => v !== null && setPeriodDays(v)}
                size="small"
              >
                <ToggleButton value={30}>30 ngày</ToggleButton>
                <ToggleButton value={90}>90 ngày</ToggleButton>
                <ToggleButton value={180}>180 ngày</ToggleButton>
              </ToggleButtonGroup>
            </Box>
            <LoadingButton
              variant="contained"
              loading={isPending && !creatingKey}
              onClick={handleRun}
              startIcon={<Iconify icon="solar:restart-bold" width={18} />}
            >
              {assessment ? 'Đánh giá lại' : 'Bắt đầu đánh giá'}
            </LoadingButton>
          </Stack>

          {/* Body */}
          {!assessment ? (
            <Box sx={{ py: 6, textAlign: 'center' }}>
              <Iconify
                icon="solar:graph-up-bold"
                width={48}
                sx={{ color: 'text.disabled', mb: 1 }}
              />
              <Typography variant="subtitle1" sx={{ mb: 0.5 }}>
                Chưa có đánh giá
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 480, mx: 'auto' }}>
                Bấm <strong>Bắt đầu đánh giá</strong> để AI chấm 8 khía cạnh cuộc sống của bạn dựa
                trên task, nhật ký, biết ơn, tài chính và các dữ liệu khác trong hệ thống.
              </Typography>
            </Box>
          ) : (
            <Stack spacing={3}>
              <Box sx={{ width: '100%', maxWidth: 640, mx: 'auto' }}>
                <WheelRadarChart current={assessment.scores} prev={prevScores} />
              </Box>

              {assessment.suggestions.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
                    Khía cạnh cần chú tâm
                  </Typography>
                  <WheelSuggestionsGrid
                    suggestions={assessment.suggestions}
                    scores={assessment.scores}
                    creatingKey={creatingKey}
                    onCreateTask={handleCreateTask}
                  />
                </Box>
              )}

              {assessment.suggestions.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Tuyệt vời! AI không thấy khía cạnh nào dưới 5/10. Tiếp tục duy trì nhé.
                  </Typography>
                </Box>
              )}
            </Stack>
          )}

          {assessment && (
            <Box sx={{ mt: 2, pt: 2, borderTop: `1px dashed ${theme.palette.divider}` }}>
              <Typography variant="caption" color="text.disabled">
                AI dựa trên {assessment.inputSummary.periodDays} ngày dữ liệu:{' '}
                {Object.values(assessment.inputSummary.tasksByArea).reduce(
                  (sum, v) => sum + (v?.total ?? 0),
                  0
                )}{' '}
                task có tag,{' '}
                {Object.values(assessment.inputSummary.textMentions?.noteHits ?? {}).reduce(
                  (s, v) => s + (v ?? 0),
                  0
                )}{' '}
                lượt nhắc khía cạnh trong note, {assessment.inputSummary.gratitudeStats.entryCount}{' '}
                ngày biết ơn.
              </Typography>
            </Box>
          )}
        </Box>
      </Collapse>
    </Card>
  );
}
