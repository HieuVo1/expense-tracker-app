import type { NextRequest } from 'next/server';

import { getTransactionsForExport } from 'src/sections/report/actions/report-actions';

// Excel-compatible CSV escaping: wrap fields with quote / comma / newline in
// double quotes; double-up any embedded quotes per RFC 4180.
function csvField(v: string) {
  if (v.includes(',') || v.includes('"') || v.includes('\n')) {
    return `"${v.replace(/"/g, '""')}"`;
  }
  return v;
}

export async function GET(req: NextRequest) {
  // `month` query param mirrors the dashboard's MonthPicker so the CSV
  // contains exactly what the user sees on screen.
  const month = req.nextUrl.searchParams.get('month') ?? undefined;
  const rows = await getTransactionsForExport(month);

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

  // Filename includes the exported month so the user can tell files apart.
  const monthSlug = month && /^\d{4}-\d{2}$/.test(month)
    ? month
    : new Date().toISOString().slice(0, 7);
  const filename = `expense-tracker-${monthSlug}.csv`;
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
