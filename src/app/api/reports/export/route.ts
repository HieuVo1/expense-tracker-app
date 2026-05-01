import { getTransactionsForExport } from 'src/sections/report/actions/report-actions';

// Excel-compatible CSV escaping: wrap fields with quote / comma / newline in
// double quotes; double-up any embedded quotes per RFC 4180.
function csvField(v: string) {
  if (v.includes(',') || v.includes('"') || v.includes('\n')) {
    return `"${v.replace(/"/g, '""')}"`;
  }
  return v;
}

export async function GET() {
  const rows = await getTransactionsForExport();

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

  const filename = `expense-tracker-${new Date().toISOString().slice(0, 10)}.csv`;
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
