import { NextResponse } from 'next/server';

import { prisma } from 'src/lib/prisma';
import { getOcrProvider } from 'src/lib/ocr';
import { createClient } from 'src/lib/supabase/server';

// POST /api/ocr — extract every transaction from one OR many images in a
// single round-trip. Body: multipart/form-data with one or more "file" fields.
// Returns: { transactions: TransactionExtract[], merchantHits: { [merchant]: categoryId | null }, ... }
const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB per image
const MAX_FILES = 10; // Gemini Flash handles many images, but keep cost bounded

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await request.formData();
  // FormDataEntryValue = File | string. File extends Blob so the OCR provider
  // (which accepts Buffer | Blob) is happy with these directly.
  const files = formData.getAll('file').filter((f): f is File => f instanceof File);

  if (files.length === 0) {
    return NextResponse.json({ error: 'Missing file' }, { status: 400 });
  }
  if (files.length > MAX_FILES) {
    return NextResponse.json(
      { error: `Tối đa ${MAX_FILES} ảnh / lần quét` },
      { status: 413 }
    );
  }
  for (const f of files) {
    if (f.size > MAX_FILE_BYTES) {
      return NextResponse.json({ error: 'Có ảnh > 5MB' }, { status: 413 });
    }
  }

  const provider = getOcrProvider();
  const totalBytes = files.reduce((s, f) => s + f.size, 0);

  try {
    const result = await provider.extractTransactions(files);

    // Bulk merchant memory lookup — past user choices override AI suggestion.
    const merchants = Array.from(
      new Set(
        result.transactions
          .map((t) => t.merchant?.trim().toLowerCase())
          .filter((m): m is string => !!m)
      )
    );
    const memories = merchants.length
      ? await prisma.merchantMemory.findMany({
          where: { userId: user.id, merchant: { in: merchants } },
        })
      : [];
    const merchantHits: Record<string, string> = {};
    for (const m of memories) {
      merchantHits[m.merchant] = m.categoryId;
    }

    // Audit log per scan (1 row per OCR call regardless of image count).
    await prisma.ocrLog.create({
      data: {
        userId: user.id,
        provider: result.provider,
        latencyMs: result.latencyMs,
        inputTokens: result.inputTokens ?? null,
        outputTokens: result.outputTokens ?? null,
        imageBytes: totalBytes,
        success: true,
        errorMessage: null,
      },
    });

    // Sort newest-first so the client renders the same chronological order as
    // every other transaction list in the app. Tie-break by amount desc so
    // bigger transactions on the same day surface above smaller ones.
    const sortedTransactions = [...result.transactions].sort((a, b) => {
      if (a.date !== b.date) return a.date < b.date ? 1 : -1;
      return b.amount - a.amount;
    });

    return NextResponse.json({
      transactions: sortedTransactions,
      merchantHits,
      provider: result.provider,
      latencyMs: result.latencyMs,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'OCR failed';
    await prisma.ocrLog.create({
      data: {
        userId: user.id,
        provider: 'gemini',
        latencyMs: 0,
        imageBytes: totalBytes,
        success: false,
        errorMessage: message.slice(0, 500),
      },
    });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
