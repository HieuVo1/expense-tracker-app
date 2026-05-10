'use client';

import type { z } from 'zod';
import type { AboutMeRow, AboutMeType } from '../types';

import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Drawer from '@mui/material/Drawer';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import useMediaQuery from '@mui/material/useMediaQuery';
import DialogContent from '@mui/material/DialogContent';

import { Form } from 'src/components/hook-form';

import { aboutMeFormSchema } from '../schemas';
import { AboutMeFormGoal } from './forms/about-me-form-goal';
import { AboutMeFormTags } from './forms/about-me-form-tags';
import { AboutMeFormTrait } from './forms/about-me-form-trait';
import { AboutMeFormLesson } from './forms/about-me-form-lesson';
import { AboutMeFormSignal } from './forms/about-me-form-signal';
import { AboutMeFormAction } from './forms/about-me-form-action';
import { AboutMeDeleteConfirm } from './about-me-delete-confirm';
import { AboutMeFormThought } from './forms/about-me-form-thought';
import { AboutMeFormPrinciple } from './forms/about-me-form-principle';
import { listAboutMe , createAboutMe, updateAboutMe } from '../actions/about-me-actions';
import { ABOUT_ME_TYPE_LABELS, ABOUT_ME_TYPE_COLORS } from '../constants/about-me-types';

// ----------------------------------------------------------------------

type FormValues = z.infer<typeof aboutMeFormSchema>;

function buildDefaults(type: AboutMeType, row?: AboutMeRow): FormValues {
  const base = {
    title: row?.title ?? '',
    content: row?.content ?? '',
    tags: row?.tags ?? [],
  };

  const meta = row?.metadata ?? {};

  switch (type) {
    case 'GOAL':
      return {
        type,
        ...base,
        metadata: {
          kind: (meta as Record<string, unknown>).kind as 'short' | 'long' | 'dream' ?? 'short',
          status: (meta as Record<string, unknown>).status as 'active' | 'achieved' | 'paused' | 'abandoned' ?? 'active',
          targetDate: (meta as Record<string, unknown>).targetDate as string | undefined,
          progress: (meta as Record<string, unknown>).progress as number | undefined,
        },
      };
    case 'THOUGHT':
      return { type, ...base, metadata: {} };
    case 'LESSON':
      return {
        type,
        ...base,
        metadata: { source: (meta as Record<string, unknown>).source as 'course' | 'experience' | 'book' | 'reflection' ?? 'experience' },
      };
    case 'SIGNAL':
      return {
        type,
        ...base,
        metadata: {
          kind: (meta as Record<string, unknown>).kind as 'positive' | 'negative' ?? 'positive',
          trigger: (meta as Record<string, unknown>).trigger as string ?? '',
          emotion: (meta as Record<string, unknown>).emotion as string ?? '',
          meaning: (meta as Record<string, unknown>).meaning as string | undefined,
          action: (meta as Record<string, unknown>).action as string | undefined,
        },
      };
    case 'PRINCIPLE':
      return { type, ...base, metadata: {} };
    case 'TRAIT':
      return {
        type,
        ...base,
        metadata: {
          kind: (meta as Record<string, unknown>).kind as 'strength' | 'weakness' ?? 'strength',
          context: (meta as Record<string, unknown>).context as string | undefined,
        },
      };
    case 'ACTION':
      return {
        type,
        ...base,
        metadata: {
          status: (meta as Record<string, unknown>).status as 'planned' | 'doing' | 'done' | 'skipped' ?? 'planned',
          dueDate: (meta as Record<string, unknown>).dueDate as string | undefined,
        },
      };
    default:
      return { type, ...base, metadata: {} } as FormValues;
  }
}

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  type: AboutMeType;
  row?: AboutMeRow;
  onClose: () => void;
};

export function AboutMeEditDialog({ open, type, row, onClose }: Props) {
  const isEdit = !!row;
  const isMobile = useMediaQuery('(max-width:600px)');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [lessonRows, setLessonRows] = useState<AboutMeRow[]>([]);

  const methods = useForm<FormValues>({
     
    resolver: zodResolver(aboutMeFormSchema) as any,
    defaultValues: buildDefaults(type, row),
  });

  const { handleSubmit, reset, formState: { isSubmitting } } = methods;

  // Sync form when dialog opens or row/type changes
  useEffect(() => {
    if (open) {
      reset(buildDefaults(type, row));
    }
  }, [open, type, row, reset]);

  // Prefetch LESSON rows for PRINCIPLE form autocomplete
  useEffect(() => {
    if (open && type === 'PRINCIPLE') {
      listAboutMe('LESSON').then(setLessonRows).catch(() => {});
    }
  }, [open, type]);

  const onSubmit = handleSubmit(async (data) => {
    try {
      if (isEdit && row) {
        await updateAboutMe({ id: row.id, ...data });
        toast.success('Đã lưu');
      } else {
        await createAboutMe(data);
        toast.success('Đã tạo');
      }
      onClose();
    } catch (err) {
      toast.error('Có lỗi xảy ra. Vui lòng thử lại.');
      console.error(err);
    }
  });

  const formContent = (
    <Form methods={methods} onSubmit={onSubmit}>
      {/* Type chip header */}
      <Stack direction="row" alignItems="center" gap={1} sx={{ mb: 2.5 }}>
        <Chip
          label={ABOUT_ME_TYPE_LABELS[type]}
          size="small"
          sx={{ bgcolor: ABOUT_ME_TYPE_COLORS[type], fontWeight: 600, fontSize: 12 }}
        />
        {isEdit && (
          <Typography variant="caption" color="text.secondary">
            Đang chỉnh sửa
          </Typography>
        )}
      </Stack>

      {/* Type-specific fields */}
      {type === 'GOAL' && <AboutMeFormGoal />}
      {type === 'THOUGHT' && <AboutMeFormThought />}
      {type === 'LESSON' && <AboutMeFormLesson />}
      {type === 'SIGNAL' && <AboutMeFormSignal />}
      {type === 'PRINCIPLE' && <AboutMeFormPrinciple lessonOptions={lessonRows} />}
      {type === 'TRAIT' && <AboutMeFormTrait />}
      {type === 'ACTION' && <AboutMeFormAction />}

      {/* Shared tags input — applies to all 7 types */}
      <AboutMeFormTags />

      <Divider sx={{ mt: 3, mb: 2 }} />

      <Stack direction="row" justifyContent="space-between" alignItems="center">
        {isEdit ? (
          <Button
            color="error"
            variant="outlined"
            size="small"
            onClick={() => setDeleteOpen(true)}
            disabled={isSubmitting}
          >
            Xoá
          </Button>
        ) : (
          <Box />
        )}
        <Stack direction="row" gap={1}>
          <Button color="inherit" onClick={onClose} disabled={isSubmitting}>
            Huỷ
          </Button>
          <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
            {isEdit ? 'Lưu thay đổi' : 'Tạo mới'}
          </LoadingButton>
        </Stack>
      </Stack>
    </Form>
  );

  // Mobile: bottom drawer
  if (isMobile) {
    return (
      <>
        <Drawer
          anchor="bottom"
          open={open}
          onClose={onClose}
          PaperProps={{
            sx: {
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              maxHeight: '90vh',
              overflowY: 'auto',
              px: 2.5,
              pt: 2,
              pb: 3,
            },
          }}
        >
          <Box sx={{ width: 40, height: 4, bgcolor: 'divider', borderRadius: 2, mx: 'auto', mb: 2 }} />
          <Typography variant="h6" sx={{ mb: 0.5 }}>
            {isEdit ? 'Chỉnh sửa' : 'Tạo mới'} — {ABOUT_ME_TYPE_LABELS[type]}
          </Typography>
          {formContent}
        </Drawer>

        {row && (
          <AboutMeDeleteConfirm
            open={deleteOpen}
            row={row}
            onClose={() => setDeleteOpen(false)}
            onDeleted={onClose}
          />
        )}
      </>
    );
  }

  // Desktop: centered dialog
  return (
    <>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" scroll="paper">
        <DialogTitle>
          {isEdit ? 'Chỉnh sửa' : 'Tạo mới'} — {ABOUT_ME_TYPE_LABELS[type]}
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ px: 3, py: 2.5 }}>
          {formContent}
        </DialogContent>
      </Dialog>

      {row && (
        <AboutMeDeleteConfirm
          open={deleteOpen}
          row={row}
          onClose={() => setDeleteOpen(false)}
          onDeleted={onClose}
        />
      )}
    </>
  );
}
