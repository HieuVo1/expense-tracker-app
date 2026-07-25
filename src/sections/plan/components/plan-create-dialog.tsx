'use client';

import type { PlanScope } from '@prisma/client';
import type { PlanFormValues } from '../schemas';

import { toast } from 'sonner';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';

import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

import { paths } from 'src/routes/paths';

import { Form, Field } from 'src/components/hook-form';

import { planFormSchema } from '../schemas';
import { suggestRange } from '../utils/plan-dates';
import { createPlan } from '../actions/plan-actions';
import { PLAN_SCOPE_LABELS, PLAN_SCOPE_VALUES } from '../constants/plan-meta';

// ----------------------------------------------------------------------

type PlanCreateDialogProps = {
  open: boolean;
  onClose: () => void;
  defaultScope?: PlanScope;
};

export function PlanCreateDialog({
  open,
  onClose,
  defaultScope = 'weekly',
}: PlanCreateDialogProps) {
  const router = useRouter();

  const defaultRange = suggestRange(defaultScope);

  const methods = useForm<PlanFormValues>({
    resolver: zodResolver(planFormSchema),
    defaultValues: {
      scope: defaultScope,
      title: '',
      description: '',
      startDate: defaultRange.startDate,
      endDate: defaultRange.endDate,
    },
  });

  const {
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { isSubmitting, dirtyFields },
  } = methods;

  const scope = watch('scope') as PlanScope;

  useEffect(() => {
    if (open) {
      const range = suggestRange(defaultScope);
      reset({
        scope: defaultScope,
        title: '',
        description: '',
        startDate: range.startDate,
        endDate: range.endDate,
      });
    }
  }, [open, defaultScope, reset]);

  // Auto-update dates when scope changes — only if dates not manually edited.
  // Backlog scope clears dates.
  useEffect(() => {
    const range = suggestRange(scope);
    if (!dirtyFields.startDate) setValue('startDate', range.startDate);
    if (!dirtyFields.endDate) setValue('endDate', range.endDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope]);

  const onSubmit = handleSubmit(async (data) => {
    try {
      const { id } = await createPlan(data);
      onClose();
      router.push(paths.dashboard.planDetail(id));
    } catch (err) {
      toast.error('Có lỗi xảy ra. Vui lòng thử lại.');
      console.error(err);
    }
  });

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" scroll="paper">
      <DialogTitle>Tạo kế hoạch mới</DialogTitle>

      <Divider />

      <Form methods={methods} onSubmit={onSubmit}>
        <DialogContent sx={{ px: 3, py: 2.5 }}>
          <Stack spacing={3}>
            {/* Scope selector */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Loại kế hoạch
              </Typography>
              <Tabs
                value={scope}
                onChange={(_, v: PlanScope) => setValue('scope', v, { shouldDirty: false })}
                variant="scrollable"
                scrollButtons="auto"
              >
                {PLAN_SCOPE_VALUES.map((s) => (
                  <Tab key={s} label={PLAN_SCOPE_LABELS[s]} value={s} />
                ))}
              </Tabs>
            </Box>

            <Field.Text
              name="title"
              label="Tiêu đề"
              placeholder="Nhập tiêu đề kế hoạch..."
              slotProps={{ htmlInput: { maxLength: 120 } }}
            />

            <Field.Text
              name="description"
              label="Mô tả (tuỳ chọn)"
              placeholder="Ghi chú thêm về kế hoạch..."
              multiline
              rows={3}
              slotProps={{ htmlInput: { maxLength: 500 } }}
            />

            {/* Date range — hidden for backlog */}
            {scope !== 'backlog' && (
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Field.DatePicker name="startDate" label="Ngày bắt đầu" format="DD/MM/YYYY" />
                <Field.DatePicker name="endDate" label="Ngày kết thúc" format="DD/MM/YYYY" />
              </Stack>
            )}

            {scope === 'backlog' && (
              <Typography variant="caption" color="text.secondary">
                Backlog không có thời hạn. Bạn có thể chuyển task sang kế hoạch tuần / tháng / năm
                sau.
              </Typography>
            )}
          </Stack>
        </DialogContent>

        <Divider />

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} color="inherit" disabled={isSubmitting}>
            Huỷ
          </Button>
          <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
            Tạo kế hoạch
          </LoadingButton>
        </DialogActions>
      </Form>
    </Dialog>
  );
}
