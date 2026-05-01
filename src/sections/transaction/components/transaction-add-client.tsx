'use client';

import { useId, useRef, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

import { TransactionForm } from './transaction-form';
import { TransactionScanPreview } from './transaction-scan-preview';

import type { PreviewItem } from './transaction-scan-preview';

type Category = {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'expense' | 'income';
};

type Mode = 'manual' | 'preview';

type Props = {
  categories: Category[];
};

// Strip Vietnamese diacritics + lowercase + collapse whitespace so OCR
// variants of the same merchant ("Thuỳ" vs "Thùy", "Thi" vs "Thị") collapse
// into the same canonical form for dedup.
function normalizeMerchant(s: string | null | undefined) {
  if (!s) return '';
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

// Dedup key = date + type + amount + normalized merchant.
// Including merchant prevents collapsing two distinct transactions on the same
// day with identical amount but different recipients (e.g., 40k to Quách Thị
// Hiền AND 40k to Nguyễn Thùy Linh). Diacritic-stripping handles OCR variants
// of the same name. When merchant is missing on both rows, the key still
// dedupes them via empty-string match.
function dedupKey(t: {
  date: string;
  type: string;
  amount: number;
  merchant?: string | null;
}) {
  return `${t.date}|${t.type}|${t.amount}|${normalizeMerchant(t.merchant)}`;
}

// Orchestrates the Add Transaction page:
//  - Scan card on top — accepts 1 or many images.
//  - 0 transactions detected → toast, stay in manual.
//  - 1 transaction (single image) → pre-fill manual form.
//  - >1 transactions → preview list with dedup applied across all images.
export function TransactionAddClient({ categories }: Props) {
  const formKey = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<Mode>('manual');
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanProgress, setScanProgress] = useState<{ done: number; total: number } | null>(null);

  // Bumping this counter remounts TransactionForm so RHF picks up new initialValues.
  const [formVersion, setFormVersion] = useState(0);
  const [formInitial, setFormInitial] = useState<Record<string, string> | undefined>(undefined);

  const [previewItems, setPreviewItems] = useState<PreviewItem[]>([]);

  // Map AI-suggested category name → user's actual category row, restricted to
  // the transaction's type so an income row never resolves to an expense bucket.
  // Falls back to the type's "Khác" / "Thu nhập khác" when name doesn't match.
  const resolveCategoryId = (
    suggestedName: string,
    txnType: 'expense' | 'income',
    merchantHit?: string
  ) => {
    if (merchantHit) {
      const cat = categories.find((c) => c.id === merchantHit);
      if (cat && cat.type === txnType) return merchantHit;
    }
    const sameType = categories.filter((c) => c.type === txnType);
    const exact = sameType.find((c) => c.name === suggestedName);
    if (exact) return exact.id;
    // Fallback to the catch-all bucket of the right type.
    const fallbackName = txnType === 'income' ? 'Thu nhập khác' : 'Khác';
    return sameType.find((c) => c.name === fallbackName)?.id ?? sameType[0]?.id ?? '';
  };

  // Scan one or many images in ONE OCR request — Gemini accepts multiple
  // inline image parts per call, saving the network roundtrip for each image
  // and letting the model dedupe overlapping screenshots itself. We still
  // run a final client-side dedup pass as defence in depth.
  const handleScan = async (files: File[]) => {
    if (files.length === 0) return;

    setScanError(null);
    setIsScanning(true);
    setScanProgress({ done: 0, total: files.length });

    type ScanItem = {
      amount: number;
      type: 'expense' | 'income';
      date: string;
      description: string;
      merchant?: string;
      suggestedCategory: string;
    };

    try {
      const fd = new FormData();
      files.forEach((f) => fd.append('file', f));
      const res = await fetch('/api/ocr', { method: 'POST', body: fd });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error ?? `OCR failed (${res.status})`);
      }
      const data = (await res.json()) as {
        transactions: ScanItem[];
        merchantHits: Record<string, string>;
        latencyMs: number;
      };
      const aggregated: ScanItem[] = data.transactions;
      const merchantHits: Record<string, string> = data.merchantHits;
      const totalLatency = data.latencyMs;
      setScanProgress({ done: files.length, total: files.length });

      if (aggregated.length === 0) {
        toast.info('Không phát hiện giao dịch nào trong ảnh');
        return;
      }

      // ─── Dedup ─────────────────────────────────────────────────────
      // Merge by key, keeping the "best" version when duplicates collide.
      // Better = longer description (more detail) and merchant present
      // (helps Merchant Memory next time).
      const merged = new Map<string, ScanItem>();
      let dropped = 0;
      const score = (t: ScanItem) =>
        (t.description?.length ?? 0) + (t.merchant ? 50 : 0);
      for (const t of aggregated) {
        const k = dedupKey(t);
        const prev = merged.get(k);
        if (!prev) {
          merged.set(k, t);
          continue;
        }
        dropped += 1;
        if (score(t) > score(prev)) {
          merged.set(k, t);
        }
      }
      const unique: ScanItem[] = Array.from(merged.values());

      // Single transaction across single image → pre-fill manual form.
      if (files.length === 1 && unique.length === 1) {
        const t = unique[0];
        const merchantKey = t.merchant?.trim().toLowerCase();
        setFormInitial({
          type: t.type ?? 'expense',
          amount: String(t.amount ?? ''),
          date: t.date,
          categoryId: resolveCategoryId(
            t.suggestedCategory,
            t.type ?? 'expense',
            merchantKey ? merchantHits[merchantKey] : undefined
          ),
          description: t.description ?? '',
          merchant: t.merchant ?? '',
        });
        setFormVersion((v) => v + 1);
        setMode('manual');
        toast.success(`Đã quét hoá đơn (${totalLatency}ms)`);
        return;
      }

      // Multi → preview list.
      const items: PreviewItem[] = unique.map((t, idx) => {
        const merchantKey = t.merchant?.trim().toLowerCase();
        return {
          uid: `${Date.now()}-${idx}`,
          amount: t.amount,
          type: t.type ?? 'expense',
          date: t.date,
          description: t.description,
          merchant: t.merchant,
          categoryId: resolveCategoryId(
            t.suggestedCategory,
            t.type ?? 'expense',
            merchantKey ? merchantHits[merchantKey] : undefined
          ),
        };
      });
      setPreviewItems(items);
      setMode('preview');

      const dropMsg = dropped > 0 ? `, bỏ trùng ${dropped}` : '';
      toast.success(
        `${files.length} ảnh → ${unique.length} giao dịch${dropMsg} (${totalLatency}ms)`
      );
    } catch (err) {
      setScanError(err instanceof Error ? err.message : 'Quét hoá đơn thất bại');
    } finally {
      setIsScanning(false);
      setScanProgress(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <Stack spacing={3}>
      {!!scanError && <Alert severity="error">{scanError}</Alert>}

      {/* Mobile: vertical stack with full-width CTA. Desktop: horizontal row.
          The card's vibe should read as "this is the main shortcut" — manual
          form is the fallback below. */}
      <Card
        sx={{
          p: { xs: 2.5, md: 3 },
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { xs: 'stretch', md: 'center' },
          gap: { xs: 2, md: 3 },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            flex: 1,
            minWidth: 0,
          }}
        >
          <Box
            sx={{
              width: 48,
              height: 48,
              display: 'grid',
              placeItems: 'center',
              borderRadius: 1.5,
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              flexShrink: 0,
            }}
          >
            <Iconify icon="solar:camera-add-bold" width={24} />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle1">Quét hoá đơn / lịch sử ngân hàng</Typography>
            <Typography variant="body2" color="text.secondary">
              Chọn nhiều ảnh — AI đọc và tự bỏ giao dịch trùng.
            </Typography>
          </Box>
        </Box>

        {scanProgress && scanProgress.total > 1 && (
          <Box sx={{ width: { xs: '100%', md: 200 } }}>
            <Typography variant="caption" color="text.secondary">
              Đang quét {scanProgress.done}/{scanProgress.total} ảnh…
            </Typography>
            <LinearProgress
              variant="determinate"
              value={(scanProgress.done / scanProgress.total) * 100}
              sx={{ mt: 0.5, height: 4, borderRadius: 2 }}
            />
          </Box>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => {
            const list = Array.from(e.target.files ?? []);
            if (list.length > 0) handleScan(list);
          }}
        />
        <Button
          variant="contained"
          size="large"
          fullWidth
          onClick={() => fileInputRef.current?.click()}
          loading={isScanning}
          startIcon={!isScanning ? <Iconify icon="solar:gallery-add-bold" /> : undefined}
          sx={{
            height: 48,
            flexShrink: 0,
            width: { xs: '100%', md: 'auto' },
            minWidth: { md: 160 },
          }}
        >
          {isScanning ? 'Đang quét…' : 'Chọn ảnh'}
        </Button>
      </Card>

      {mode === 'preview' ? (
        <TransactionScanPreview
          items={previewItems}
          categories={categories}
          onCancel={() => {
            setPreviewItems([]);
            setMode('manual');
          }}
        />
      ) : (
        <TransactionForm
          key={`${formKey}-${formVersion}`}
          categories={categories}
          initialValues={formInitial}
        />
      )}
    </Stack>
  );
}
