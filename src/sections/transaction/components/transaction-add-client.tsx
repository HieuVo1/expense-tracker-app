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

// Dedup key = date + type + amount only.
// Description-based keys break when OCR reads the same transaction
// differently between two screenshots (e.g., "Chuyển khoản cho..." vs
// "Chuyển tới...", or different amounts of trailing text). Same goes for
// merchant — diacritic variants ("Thuỳ" vs "Thùy") would split keys.
//
// Trade-off: two genuinely distinct transactions with identical date+type+
// amount get merged (rare in practice — same amount twice/day same type).
// User can spot and recreate manually in preview if needed.
function dedupKey(t: { date: string; type: string; amount: number }) {
  return `${t.date}|${t.type}|${t.amount}`;
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

  // Scan one or many images. Each image is sent to /api/ocr sequentially so we
  // can show progress; parallel would race the model's free-tier rate limit.
  // Results from all images are merged + deduplicated before showing preview.
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

    const aggregated: ScanItem[] = [];
    const merchantHits: Record<string, string> = {};
    let totalLatency = 0;

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fd = new FormData();
        fd.append('file', file);
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
        aggregated.push(...data.transactions);
        Object.assign(merchantHits, data.merchantHits);
        totalLatency += data.latencyMs;
        setScanProgress({ done: i + 1, total: files.length });
      }

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

      <Card sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box
          sx={{
            width: 44,
            height: 44,
            display: 'grid',
            placeItems: 'center',
            borderRadius: 1,
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            flexShrink: 0,
          }}
        >
          <Iconify icon="solar:camera-add-bold" width={22} />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle2">Quét hoá đơn / lịch sử ngân hàng</Typography>
          <Typography variant="caption" color="text.secondary">
            Chọn nhiều ảnh cùng lúc — AI đọc và tự bỏ giao dịch trùng giữa các screenshot.
          </Typography>
          {scanProgress && scanProgress.total > 1 && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Đang quét {scanProgress.done}/{scanProgress.total} ảnh...
              </Typography>
              <LinearProgress
                variant="determinate"
                value={(scanProgress.done / scanProgress.total) * 100}
                sx={{ mt: 0.5, height: 4, borderRadius: 2 }}
              />
            </Box>
          )}
        </Box>
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
          onClick={() => fileInputRef.current?.click()}
          loading={isScanning}
        >
          Chọn ảnh
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
