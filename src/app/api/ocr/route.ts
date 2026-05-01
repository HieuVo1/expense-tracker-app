import { NextResponse } from 'next/server';

import { prisma } from 'src/lib/prisma';
import { getOcrProvider } from 'src/lib/ocr';
import { createClient } from 'src/lib/supabase/server';

// POST /api/ocr — extract every transaction from a receipt or banking screenshot.
// Body: multipart/form-data with field "file".
// Returns: { transactions: TransactionExtract[], merchantHits: { [merchant]: categoryId | null }, ... }
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get('file');
  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: 'Missing file' }, { status: 400 });
  }
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'File quá 5MB' }, { status: 413 });
  }

  const provider = getOcrProvider();

  try {
    const result = await provider.extractTransactions(file);

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

    // Audit log per scan, not per detected transaction.
    await prisma.ocrLog.create({
      data: {
        userId: user.id,
        provider: result.provider,
        latencyMs: result.latencyMs,
        inputTokens: result.inputTokens ?? null,
        outputTokens: result.outputTokens ?? null,
        imageBytes: file.size,
        success: true,
        errorMessage: null,
      },
    });

    return NextResponse.json({
      transactions: result.transactions,
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
        imageBytes: file.size,
        success: false,
        errorMessage: message.slice(0, 500),
      },
    });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
