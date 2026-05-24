'use client';

import { toast } from 'sonner';
import { useRef, useState } from 'react';
import { useWatch, useFormContext } from 'react-hook-form';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import { alpha } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { createClient } from 'src/lib/supabase/client';
import {
  NOTE_IMAGE_MAX,
  NOTE_IMAGES_BUCKET,
  NOTE_IMAGE_MAX_BYTES,
  NOTE_IMAGE_SIGNED_TTL,
} from 'src/lib/storage/note-images';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

// Shared image-attachment field. Drives an RHF `images` field (array of Storage
// PATHS). Uploads go to the private `note-images` bucket; previews use signed
// URLs (seeded from the server for existing images, minted client-side for
// newly uploaded ones). Used by both About-me entries and daily journal notes.
type Props = { name?: string; initialSignedUrls?: Record<string, string> };

export function NoteImagesField({ name = 'images', initialSignedUrls = {} }: Props) {
  const { control, setValue, getValues } = useFormContext();
  const images = (useWatch({ control, name }) as string[] | undefined) ?? [];
  const [urls, setUrls] = useState<Record<string, string>>(initialSignedUrls);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const remaining = NOTE_IMAGE_MAX - images.length;

  const handleFiles = async (files: File[]) => {
    if (files.length === 0) return;
    if (files.length > remaining) {
      toast.warning(`Chỉ thêm được tối đa ${NOTE_IMAGE_MAX} ảnh`);
    }
    const slice = files.slice(0, remaining);

    setUploading(true);
    try {
      const supabase = createClient();
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) {
        toast.error('Phiên đăng nhập đã hết hạn');
        return;
      }

      const added: string[] = [];
      for (const file of slice) {
        if (!file.type.startsWith('image/')) {
          toast.error(`"${file.name}" không phải ảnh`);
          continue;
        }
        if (file.size > NOTE_IMAGE_MAX_BYTES) {
          toast.error(`"${file.name}" vượt quá 5MB`);
          continue;
        }
        const ext = (file.name.split('.').pop() ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
        const path = `${uid}/${crypto.randomUUID()}.${ext || 'jpg'}`;

        const { error } = await supabase.storage
          .from(NOTE_IMAGES_BUCKET)
          .upload(path, file, { contentType: file.type, upsert: false });
        if (error) {
          toast.error(`Tải "${file.name}" thất bại`);
          continue;
        }

        const { data: signed } = await supabase.storage
          .from(NOTE_IMAGES_BUCKET)
          .createSignedUrl(path, NOTE_IMAGE_SIGNED_TTL);
        setUrls((prev) => ({ ...prev, [path]: signed?.signedUrl ?? '' }));
        added.push(path);
      }

      if (added.length > 0) {
        const current = (getValues(name) as string[] | undefined) ?? [];
        setValue(name, [...current, ...added], { shouldDirty: true });
      }
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const removeAt = (index: number) => {
    setValue(
      name,
      images.filter((_, i) => i !== index),
      { shouldDirty: true }
    );
  };

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        Hình ảnh
      </Typography>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {images.map((path, index) => (
          <Box
            key={path}
            sx={{
              position: 'relative',
              width: 88,
              height: 88,
              borderRadius: 1,
              overflow: 'hidden',
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'action.hover',
            }}
          >
            {urls[path] ? (
              <Box
                component="img"
                src={urls[path]}
                alt=""
                sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            ) : (
              <Box sx={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center' }}>
                <CircularProgress size={18} />
              </Box>
            )}
            <IconButton
              size="small"
              aria-label="Xoá ảnh"
              onClick={() => removeAt(index)}
              sx={{
                position: 'absolute',
                top: 2,
                right: 2,
                p: 0.25,
                color: 'common.white',
                bgcolor: (t) => alpha(t.palette.common.black, 0.55),
                '&:hover': { bgcolor: (t) => alpha(t.palette.common.black, 0.75) },
              }}
            >
              <Iconify icon="solar:close-circle-bold" width={18} />
            </IconButton>
          </Box>
        ))}

        {remaining > 0 && (
          <Box
            component="button"
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            sx={{
              width: 88,
              height: 88,
              borderRadius: 1,
              border: '1px dashed',
              borderColor: 'divider',
              bgcolor: 'transparent',
              color: 'text.secondary',
              cursor: 'pointer',
              display: 'grid',
              placeItems: 'center',
              '&:hover': { bgcolor: 'action.hover' },
              '&:disabled': { cursor: 'default', opacity: 0.6 },
            }}
          >
            {uploading ? (
              <CircularProgress size={20} />
            ) : (
              <Stack alignItems="center" spacing={0.5}>
                <Iconify icon="solar:gallery-add-bold" width={22} />
                <Typography variant="caption">Thêm ảnh</Typography>
              </Stack>
            )}
          </Box>
        )}
      </Box>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          const list = Array.from(e.target.files ?? []);
          if (list.length > 0) handleFiles(list);
        }}
      />
    </Box>
  );
}
