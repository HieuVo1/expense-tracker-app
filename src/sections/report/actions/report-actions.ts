'use server';

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';

import { paths } from 'src/routes/paths';

import { prisma } from 'src/lib/prisma';
import { requireUser } from 'src/lib/auth-helpers';

// Server actions don't go through the client-side localization provider, so
// extend the utc plugin here. Idempotent.
dayjs.extend(utc);

// First day of given month (UTC).
function firstOfMonth(d: dayjs.Dayjs) {
  return new Date(Date.UTC(d.year(), d.month(), 1));
}

export type ReportData = {
  // Last 6 months including current — oldest first so the chart reads left → right.
  monthlyTrend: Array<{ monthKey: string; label: string; expense: number; income: number }>;
  topTransactions: Array<{
    id: string;
    amount: number;
    date: string;
    description: string | null;
    category: { name: string; icon: string; color: string };
  }>;
  topMerchants: Array<{
    merchant: string;
    total: number;
    count: number;
    /** Most-used category for this merchant (best-effort label only). */
    primaryCategory: { name: string; color: string } | null;
  }>;
};

// YYYY-MM string from URL → dayjs anchor month. Falls back to current month
// for any malformed input — navigation param, not a security boundary.
function parseMonthParam(month: string | undefined): dayjs.Dayjs {
  if (month && /^\d{4}-\d{2}$/.test(month)) {
    const parsed = dayjs(`${month}-01`);
    if (parsed.isValid()) return parsed;
  }
  return dayjs();
}

export async function getReportData(monthParam?: string): Promise<ReportData> {
  const user = await requireUser();
  const now = parseMonthParam(monthParam);
  // 6-month window ending at the selected month (inclusive).
  const sixMonthsAgoStart = firstOfMonth(now.subtract(5, 'month'));
  const nextMonthStart = firstOfMonth(now.add(1, 'month'));
  const currentMonthStart = firstOfMonth(now);

  const [windowRows, topTxs] = await Promise.all([
    // Aggregate set: 6 months of all transactions for the trend chart + merchant ranking.
    prisma.transaction.findMany({
      where: { userId: user.id, date: { gte: sixMonthsAgoStart, lt: nextMonthStart } },
      select: {
        amount: true,
        type: true,
        date: true,
        description: true,
        category: { select: { name: true, color: true } },
      },
    }),
    // Top 5 expense transactions in the current month — informational, not aggregate.
    prisma.transaction.findMany({
      where: {
        userId: user.id,
        type: 'expense',
        date: { gte: currentMonthStart, lt: nextMonthStart },
      },
      orderBy: { amount: 'desc' },
      take: 5,
      include: {
        category: { select: { name: true, icon: true, color: true } },
      },
    }),
  ]);

  // ─── monthlyTrend: bucket by YYYY-MM ────────────────────────────────
  const buckets = new Map<string, { expense: number; income: number }>();
  for (let i = 0; i < 6; i++) {
    const m = now.subtract(5 - i, 'month');
    buckets.set(m.format('YYYY-MM'), { expense: 0, income: 0 });
  }
  for (const r of windowRows) {
    const key = dayjs(r.date).format('YYYY-MM');
    const b = buckets.get(key);
    if (!b) continue;
    const amt = Number(r.amount);
    if (r.type === 'expense') b.expense += amt;
    else b.income += amt;
  }
  const monthlyTrend = Array.from(buckets.entries()).map(([monthKey, v]) => ({
    monthKey,
    label: dayjs(monthKey + '-01').format('MM/YYYY'),
    expense: v.expense,
    income: v.income,
  }));

  // ─── topMerchants: rank by total spend over 6 months ─────────────────
  // Merchant info lives only on the description field for OCR'd rows that
  // didn't capture a merchant — we group by description text in those cases
  // for a usable approximation. Pure aggregation by description is good
  // enough for a personal tracker.
  const merchantMap = new Map<
    string,
    { total: number; count: number; categoryCounts: Map<string, { color: string; n: number }> }
  >();
  for (const r of windowRows) {
    if (r.type !== 'expense') continue;
    const key = (r.description ?? '').trim();
    if (!key) continue;
    const slot = merchantMap.get(key) ?? {
      total: 0,
      count: 0,
      categoryCounts: new Map(),
    };
    slot.total += Number(r.amount);
    slot.count += 1;
    const cat = r.category;
    const cur = slot.categoryCounts.get(cat.name) ?? { color: cat.color, n: 0 };
    cur.n += 1;
    slot.categoryCounts.set(cat.name, cur);
    merchantMap.set(key, slot);
  }
  const topMerchants = Array.from(merchantMap.entries())
    .map(([merchant, v]) => {
      // Pick the dominant category for this merchant by frequency.
      let primaryCategory: { name: string; color: string } | null = null;
      let bestN = 0;
      for (const [name, info] of v.categoryCounts) {
        if (info.n > bestN) {
          bestN = info.n;
          primaryCategory = { name, color: info.color };
        }
      }
      return { merchant, total: v.total, count: v.count, primaryCategory };
    })
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  return {
    monthlyTrend,
    topTransactions: topTxs.map((r) => ({
      id: r.id,
      amount: Number(r.amount),
      // Full ISO datetime — `top-transactions-card` parses with dayjs which
      // accepts either format, so no display change needed there.
      date: r.date.toISOString(),
      description: r.description,
      category: r.category,
    })),
    topMerchants,
  };
}

// CSV row shape for the export endpoint. Kept here so the type stays close to
// the Prisma model — when fields change they're updated in one place.
export type CsvRow = {
  date: string;
  type: string;
  amount: string;
  category: string;
  description: string;
  merchant: string;
};

export async function getTransactionsForExport(monthParam?: string): Promise<CsvRow[]> {
  const user = await requireUser();
  // Match the dashboard's resolution: missing/invalid month defaults to current.
  // Export then mirrors what the user sees on screen instead of the entire ledger.
  const anchor = parseMonthParam(monthParam);
  const start = firstOfMonth(anchor);
  const end = firstOfMonth(anchor.add(1, 'month'));
  const rows = await prisma.transaction.findMany({
    where: { userId: user.id, date: { gte: start, lt: end } },
    orderBy: { date: 'desc' },
    include: { category: { select: { name: true } } },
  });

  // No merchant column in the schema — best-effort lookup via merchant memory:
  // we don't denormalise merchant onto Transaction, so this column stays empty
  // for now. A future migration could store merchant text on each row.
  return rows.map((r) => ({
    date: r.date.toISOString().slice(0, 10),
    type: r.type === 'expense' ? 'Chi' : 'Thu',
    amount: new Prisma.Decimal(r.amount).toString(),
    category: r.category.name,
    description: r.description ?? '',
    merchant: '',
  }));
}

// ────────────────────────────────────────────────────────────────────
// CSV import — accepts the same shape `getTransactionsForExport` produces,
// so users can round-trip. Designed for partial success: invalid rows are
// reported back instead of failing the whole import.
// ────────────────────────────────────────────────────────────────────

const IMPORT_MAX_ROWS = 5000;

export type ImportResult = {
  imported: number;
  skipped: number;
  errors: Array<{ row: number; reason: string }>;
};

// Minimal RFC 4180-ish CSV parser. Handles BOM, quoted fields with commas /
// newlines / doubled quotes, and CRLF or LF line endings. Returns one array
// per row; trailing empty row from a final newline is dropped.
function parseCsv(text: string): string[][] {
  // Strip UTF-8 BOM if present — Excel adds it on save.
  const s = text.replace(/^\uFEFF/, '');
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inQuotes) {
      if (c === '"') {
        if (s[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else if (c !== '\r') {
      field += c;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((cell) => cell.trim().length > 0));
}

// Accepts both YYYY-MM-DD (export format) and DD/MM/YYYY (Vietnamese display).
// Stores at noon UTC to match the manual-create default and stay timezone-safe.
function parseImportDate(raw: string): Date | null {
  const s = raw.trim();
  if (!s) return null;
  let parsed: dayjs.Dayjs | null = null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) parsed = dayjs.utc(`${s}T12:00:00.000Z`);
  else if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) {
    const [d, m, y] = s.split('/');
    parsed = dayjs.utc(`${y}-${m}-${d}T12:00:00.000Z`);
  }
  return parsed && parsed.isValid() ? parsed.toDate() : null;
}

function parseImportType(raw: string): 'expense' | 'income' | null {
  const s = raw.trim().toLowerCase();
  if (s === 'chi' || s === 'expense') return 'expense';
  if (s === 'thu' || s === 'income') return 'income';
  return null;
}

function parseImportAmount(raw: string): number | null {
  // Accept "150000", "150.000", "150,000" — strip thousands separators.
  const cleaned = raw.trim().replace(/[.,\s]/g, '');
  if (!/^\d+$/.test(cleaned)) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export async function importTransactionsCsv(csvText: string): Promise<ImportResult> {
  const user = await requireUser();

  const parsed = parseCsv(csvText);
  if (parsed.length < 2) {
    return { imported: 0, skipped: 0, errors: [{ row: 0, reason: 'File trống hoặc thiếu header' }] };
  }
  if (parsed.length - 1 > IMPORT_MAX_ROWS) {
    return {
      imported: 0,
      skipped: 0,
      errors: [{ row: 0, reason: `Vượt quá giới hạn ${IMPORT_MAX_ROWS} dòng` }],
    };
  }

  const [headerRow, ...dataRows] = parsed;
  const headers = headerRow.map((h) => h.trim().toLowerCase());
  const idx = {
    date: headers.findIndex((h) => h === 'ngày' || h === 'date'),
    type: headers.findIndex((h) => h === 'loại' || h === 'type'),
    amount: headers.findIndex((h) => h.startsWith('số tiền') || h === 'amount'),
    category: headers.findIndex((h) => h === 'danh mục' || h === 'category'),
    description: headers.findIndex((h) => h === 'mô tả' || h === 'description'),
    merchant: headers.findIndex((h) => h === 'cửa hàng' || h === 'merchant'),
  };
  const missing = (['date', 'type', 'amount', 'category'] as const).filter(
    (k) => idx[k] < 0,
  );
  if (missing.length > 0) {
    return {
      imported: 0,
      skipped: 0,
      errors: [{ row: 0, reason: `Thiếu cột bắt buộc: ${missing.join(', ')}` }],
    };
  }

  // Pre-load the user's categories so we can resolve names → ids without
  // round-tripping the DB per row.
  const categories = await prisma.category.findMany({
    where: { userId: user.id },
    select: { id: true, name: true, type: true },
  });
  const categoryByName = new Map(
    categories.map((c) => [c.name.trim().toLowerCase(), c]),
  );

  type ValidRow = {
    userId: string;
    categoryId: string;
    amount: Prisma.Decimal;
    type: 'expense' | 'income';
    date: Date;
    description: string | null;
  };
  const valid: ValidRow[] = [];
  const merchantMap = new Map<string, string>(); // merchant → categoryId
  const errors: ImportResult['errors'] = [];

  dataRows.forEach((cells, i) => {
    // +2 = +1 for 1-based, +1 to skip header row → matches what user sees in Excel.
    const rowNum = i + 2;
    const date = parseImportDate(cells[idx.date] ?? '');
    if (!date) {
      errors.push({ row: rowNum, reason: 'Ngày không hợp lệ' });
      return;
    }
    const type = parseImportType(cells[idx.type] ?? '');
    if (!type) {
      errors.push({ row: rowNum, reason: 'Loại phải là "Chi" hoặc "Thu"' });
      return;
    }
    const amount = parseImportAmount(cells[idx.amount] ?? '');
    if (!amount) {
      errors.push({ row: rowNum, reason: 'Số tiền không hợp lệ' });
      return;
    }
    const catName = (cells[idx.category] ?? '').trim().toLowerCase();
    const cat = categoryByName.get(catName);
    if (!cat) {
      errors.push({ row: rowNum, reason: `Không tìm thấy danh mục "${cells[idx.category]}"` });
      return;
    }
    if (cat.type !== type) {
      errors.push({
        row: rowNum,
        reason: `Danh mục "${cat.name}" không khớp loại ${type === 'expense' ? 'Chi' : 'Thu'}`,
      });
      return;
    }

    const description =
      idx.description >= 0 ? (cells[idx.description] ?? '').trim() || null : null;

    valid.push({
      userId: user.id,
      categoryId: cat.id,
      amount: new Prisma.Decimal(amount),
      type,
      date,
      description,
    });

    if (idx.merchant >= 0) {
      const merchant = (cells[idx.merchant] ?? '').trim().toLowerCase();
      if (merchant) merchantMap.set(merchant, cat.id);
    }
  });

  if (valid.length > 0) {
    await prisma.transaction.createMany({ data: valid });
    // Best-effort merchant memory upserts; failures here don't fail the import.
    for (const [merchant, categoryId] of merchantMap) {
      await prisma.merchantMemory
        .upsert({
          where: { userId_merchant: { userId: user.id, merchant } },
          update: { categoryId },
          create: { userId: user.id, merchant, categoryId },
        })
        .catch(() => undefined);
    }
    revalidatePath(paths.dashboard.transactions);
    revalidatePath(paths.dashboard.root);
  }

  return { imported: valid.length, skipped: errors.length, errors };
}
