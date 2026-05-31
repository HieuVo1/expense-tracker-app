'use client';

import type { ThemeRow } from '../types';

import { toast } from 'sonner';
import { useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';

import { Iconify } from 'src/components/iconify';

import { deleteTheme } from '../actions/bible-theme-actions';
import { ThemeFormDialog } from '../components/theme-form-dialog';

type Props = {
  themes: ThemeRow[];
};

export function BibleThemesClient({ themes }: Props) {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ThemeRow | null>(null);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (t: ThemeRow) => {
    setEditing(t);
    setFormOpen(true);
  };
  const handleDelete = async (t: ThemeRow) => {
    if (!confirm(`Xoá chủ đề "${t.name}"? (${t.verseCount} câu kinh sẽ bị gỡ liên kết)`)) return;
    try {
      await deleteTheme({ id: t.id });
      toast.success('Đã xoá chủ đề');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi xoá');
    }
  };

  return (
    <>
      <Stack direction="row" spacing={1}>
        <Button href={paths.dashboard.bible.root} startIcon={<Iconify icon="eva:arrow-ios-back-fill" />}>
          Quay lại
        </Button>
        <Box sx={{ flex: 1 }} />
        <Button
          variant="contained"
          startIcon={<Iconify icon="solar:add-circle-bold" />}
          onClick={openCreate}
        >
          Tạo chủ đề
        </Button>
      </Stack>

      {themes.length === 0 ? (
        <Card sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Chưa có chủ đề. Tạo cái đầu tiên ở trên, hoặc dùng &ldquo;Gợi ý AI&rdquo; trong trang bài học.
          </Typography>
        </Card>
      ) : (
        <Grid container spacing={2}>
          {themes.map((t) => (
            <Grid key={t.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card sx={{ p: 2, borderLeft: '4px solid', borderColor: t.color }}>
                <Stack direction="row" alignItems="flex-start" spacing={1}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Link
                      href={paths.dashboard.bible.themeDetail(t.id)}
                      underline="hover"
                      color="text.primary"
                    >
                      <Typography variant="subtitle1" noWrap>
                        {t.name}
                      </Typography>
                    </Link>
                    <Typography variant="caption" color="text.secondary">
                      {t.verseCount} câu kinh
                    </Typography>
                    {t.description && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                      >
                        {t.description}
                      </Typography>
                    )}
                  </Box>
                  <Stack direction="row" spacing={0}>
                    <IconButton size="small" onClick={() => openEdit(t)}>
                      <Iconify icon="solar:pen-bold" width={16} />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDelete(t)}>
                      <Iconify icon="solar:trash-bin-trash-bold" width={16} />
                    </IconButton>
                  </Stack>
                </Stack>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <ThemeFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        edit={editing ?? undefined}
      />
    </>
  );
}
