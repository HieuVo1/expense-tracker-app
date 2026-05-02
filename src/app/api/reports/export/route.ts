import type { NextRequest } from 'next/server';
import type { TransactionType } from '@prisma/client';

import { getTransactionsForExport } from 'src/sections/report/actions/report-actions';

// Excel-compatible CSV escaping: wrap fields with quote / comma / newline in
// double quotes; double-up any embedded quotes per RFC 4180.
function csvField(v: string) {
  if (v.includes(',') || v.includes('"') || v.includes('\n')) {
    return `"${v.replace(/"/g, '""')}"`;
  }
  return v;
}

// Coerce a string param to a positive integer for the amount bounds. Returns
// undefined when missing or unparseable so the filter falls back to "no bound".
function parseAmount(raw: string | null): number | undefined {
  if (!raw) return undefined;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : undefined;
}

export async function GET(req: NextRequest) {
  // Mirror every filter param the transactions page supports so the CSV
  // reflects exactly what the user has on screen.
  const sp = req.nextUrl.searchParams;
  const typeRaw = sp.get('type');
  const type: TransactionType | undefined =
    typeRaw === 'expense' || typeRaw === 'income' ? (typeRaw as TransactionType) : undefined;

  const filter = {
    type,
    categoryId: sp.get('categoryId') ?? undefined,
    q: sp.get('q') ?? undefined,
    month: sp.get('month') ?? undefined,
    day: sp.get('day') ?? undefined,
    minAmount: parseAmount(sp.get('min')),
    maxAmount: parseAmount(sp.get('max')),
  };

  const rows = await getTransactionsForExport(filter);

  const headers = ['Ngày', 'Loại', 'Số tiền (VND)', 'Danh mục', 'Mô tả', 'Cửa hàng'];
  const lines = [
    headers.join(','),
    ...rows.map((r) =>
      [r.date, r.type, r.amount, r.category, r.description, r.merchant]
        .map((v) => csvField(String(v)))
        .join(',')
    ),
  ];
  // Excel needs a UTF-8 BOM to render Vietnamese diacritics correctly when the
  // file is opened locally on Windows.
  const csv = '﻿' + lines.join('\n');

  // Filename slug picks the most specific filter that's set so files are
  // distinguishable in Downloads. Falls back to today's date when the export
  // is unfiltered.
  const slug = filter.day || filter.month || new Date().toISOString().slice(0, 10);
  const filename = `expense-tracker-${slug}.csv`;
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
