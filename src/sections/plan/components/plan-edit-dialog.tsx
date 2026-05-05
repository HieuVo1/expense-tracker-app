'use client';

import type { PlanScope } from '@prisma/client';
import type { PlanDetail } from '../types';
import type { PlanFormValues } from '../schemas';

import { toast } from 'sonner';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

import { Form, Field } from 'src/components/hook-form';

import { planFormSchema } from '../schemas';
import { suggestRange } from '../utils/plan-dates';
import { updatePlan } from '../actions/plan-actions';
import { PLAN_SCOPE_LABELS } from '../constants/plan-meta';

// ----------------------------------------------------------------------

type PlanEditDialogProps = {
  plan: PlanDetail;
  open: boolean;
  onClose: () => void;
};

export function PlanEditDialog({ plan, open, onClose }: PlanEditDialogProps) {
  const methods = useForm<PlanFormValues>({
    resolver: zodResolver(planFormSchema),
    defaultValues: {
      scope: plan.scope,
      title: plan.title,
      description: plan.description ?? '',
      startDate: plan.startDate,
      endDate: plan.endDate,
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
      reset({
        scope: plan.scope,
        title: plan.title,
        description: plan.description ?? '',
        startDate: plan.startDate,
        endDate: plan.endDate,
      });
    }
  }, [open, plan, reset]);

  // Auto-update dates when scope changes — only if dates not manually edited
  useEffect(() => {
    const range = suggestRange(scope);
    if (!dirtyFields.startDate) setValue('startDate', range.startDate);
    if (!dirtyFields.endDate) setValue('endDate', range.endDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope]);

  const onSubmit = handleSubmit(async (data) => {
    try {
      await updatePlan(plan.id, data);
      toast.success('Đã cập nhật kế hoạch');
      onClose();
    } catch (err) {
      toast.error('Có lỗi xảy ra. Vui lòng thử lại.');
      console.error(err);
    }
  });

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" scroll="paper">
      <DialogTitle>Sửa kế hoạch</DialogTitle>
      <Divider />
      <Form methods={methods} onSubmit={onSubmit}>
        <DialogContent sx={{ px: 3, py: 2.5 }}>
          <Stack spacing={3}>
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Loại kế hoạch</Typography>
              <Tabs
                value={scope}
                onChange={(_, v: PlanScope) => setValue('scope', v, { shouldDirty: false })}
              >
                <Tab label={PLAN_SCOPE_LABELS.weekly} value="weekly" />
                <Tab label={PLAN_SCOPE_LABELS.monthly} value="monthly" />
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

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                fullWidth
                label="Ngày bắt đầu"
                type="date"
                value={watch('startDate')}
                onChange={(e) =>
                  setValue('startDate', e.target.value, { shouldDirty: true, shouldValidate: true })
                }
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <TextField
                fullWidth
                label="Ngày kết thúc"
                type="date"
                value={watch('endDate')}
                onChange={(e) =>
                  setValue('endDate', e.target.value, { shouldDirty: true, shouldValidate: true })
                }
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Stack>
          </Stack>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} color="inherit" disabled={isSubmitting}>Huỷ</Button>
          <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
            Lưu thay đổi
          </LoadingButton>
        </DialogActions>
      </Form>
    </Dialog>
  );
}
