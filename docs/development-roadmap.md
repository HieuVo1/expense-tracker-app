# Development Roadmap

> Tài liệu sống — cập nhật mỗi khi feature đổi trạng thái hoặc roadmap dịch chuyển.

**Cập nhật gần nhất:** 2026-05-31

## Trạng thái tổng

| Phase | Mô tả | Trạng thái |
|---|---|---|
| 0 | Off-code prep (Supabase project, RLS, triggers SQL) | ✅ DONE |
| 1 | Cleanup template (deps prune, demo folders xoá) | ✅ DONE |
| 2 | Foundation (Prisma migrate, Supabase clients, theme, OCR Gemini) | ✅ DONE |
| 3 | Auth (Supabase email/password, middleware guard, VN forms, category seed) | ✅ DONE |
| 4 | Categories CRUD + Budgets per-category-month | ✅ DONE |
| 5 | Add Transaction (manual + OCR scan + Merchant Memory) | ✅ DONE |
| 6 | Transaction History (group, filter, search, delete) | ✅ DONE |
| 7 | Dashboard (donut + budget bars + month delta) | ✅ DONE |
| 7.6 | Reports & CSV (trend chart, top rankings, export, import) | ✅ DONE |
| A | Asset Management (snapshot tài sản, P/L, donut, risk profile + drift) | ✅ DONE |
| B | Personal Notes & Plans (journaling + weekly/monthly goals + Eisenhower matrix) | ✅ DONE |
| B.1 | Plan rollover (copy incomplete tasks to next period) | ✅ DONE |
| B.2 | Dashboard reminders (overdue/today tasks + expired plans) | ✅ DONE |
| C | About me module (7 entry types: GOAL/THOUGHT/LESSON/SIGNAL/PRINCIPLE/TRAIT/ACTION) | ✅ DONE |
| D | Gratitude + AI Companion corpus + Note images + Gallery | ✅ DONE |
| E | Bible Study Tracker (import .md lesson + bible.com fetch + themes + SM-2 review) | ✅ DONE |
| 7.5 | Receipt cleanup cron (60-day auto-delete) | ⏳ PENDING |
| 8 | Vercel deploy (region `sin1`) | ✅ DONE |

## Tính năng đã ship (theo source code)

### Auth & Routing
- Supabase email/password (sign-up, sign-in, verify, reset-password, update-password)
- `middleware.ts` refresh session cookie + guard `/dashboard/*` và guest-only `/auth/sign-in|sign-up`
- Server-side helper `requireUser()` cho server components / actions

### Dashboard (`/dashboard`)
- `SummaryCard` — tổng chi/thu tháng + delta % so tháng trước
- `MonthlyTrendChart` — 6 tháng cuối, expense vs income (ApexCharts)
- `CategoryDonut` — breakdown chi theo category + tab thu nhập
- `BudgetProgress` — progress bar per-category với % limit
- `TopTransactionsCard` + `TopMerchantsCard` — ranking
- `MonthPicker` đồng bộ cả overview + reports qua `?month=YYYY-MM`

### Transactions (`/dashboard/transactions`)
- Group theo ngày (Hôm nay / Hôm qua / DD thg M)
- Filter: type, category, month, day, amount range, free-text search trên description
- Add manual (`/dashboard/transactions/new`) — form RHF + Zod, quick category chips, type toggle
- OCR scan multi-image (max 10 ảnh, 5MB/ảnh) qua `/api/ocr` → preview list → bulk confirm
- Edit dialog inline, delete với confirm
- CSV export (`/api/reports/export?…filter`) — UTF-8 BOM, mirror filter trang
- CSV import (`importTransactionsCsv` server action) — round-trip với export, partial success, max 5,000 dòng

### Budgets (`/dashboard/budgets`)
- Per-category × tháng (`@@unique([userId, categoryId, month])`)
- Form set/unset limit cho từng category trong tháng đang chọn

### Categories (`/dashboard/categories`)
- 6 expense + 4 income seed qua DB trigger khi user signup
- Edit name, icon (Iconify), color, order
- Reorder UI (drag/drop), validate unique tên trong user

### Assets (`/dashboard/assets`)
- 6 type: `CASH`, `STOCK`, `FUND`, `SAVINGS`, `CRYPTO`, `OTHER`
- Snapshot fields: `capital`, `currentValue` → P/L computed
- SAVINGS extras: `interestRate` (%), `maturityDate`
- Stat cards (Tổng TS / Tổng vốn / Lời-Lỗ / Risk profile)
- Donut allocation, bar P/L per asset
- Risk profile (LOW / MEDIUM / HIGH) lưu Supabase `user_metadata.risk_profile`
- Auto-suggest profile (Euclidean distance), drift warning ngưỡng 10%, rebalance hints
- Cash sync banner: gợi ý thêm CASH asset từ tổng số dư transactions

### OCR
- Provider abstraction (`OcrProvider` interface) trong `src/lib/ocr/`
- Gemini implementation only (`@google/genai`)
- Multi-image single-call (Gemini Flash xử lý nhiều ảnh trong 1 prompt)
- Detect cả expense + income, parse `YYYY-MM-DDTHH:mm` (naive UTC)
- `OcrLog` table track latency, tokens, success / error per scan
- Merchant memory: bulk lookup → override AI suggestion bằng category đã pick trước

### Settings (`/dashboard/settings`)
- Avatar + email + ngày join + tổng giao dịch + tổng chi
- Link nhanh sang Categories, Budgets, đổi password
- Sign out button

### About me (`/dashboard/about-me`) — Phase C ✅
- 7 entry types: GOAL, THOUGHT, LESSON, SIGNAL, PRINCIPLE, TRAIT, ACTION
- Hub page bento grid (7 cards) + stats strip (total entries, weekly new, streak)
- Per-type list pages `/dashboard/about-me/[type]` with type-specific layouts
- GOAL: grouped by kind (Ngắn hạn / Dài hạn / Ước vọng), status filter chips, progress bar
- SIGNAL: pattern board (emotion × trigger frequency aggregation, current month)
- ACTION: grouped by status (doing → planned → done → skipped) with checkbox optimistic toggle
- TRAIT: 2-col strength / weakness split (tabs on mobile)
- THOUGHT / LESSON / PRINCIPLE: flat time-ordered list + inline search
- `AboutMeEditDialog` — bottom drawer on mobile, centered dialog on desktop
- `AboutMeDetailDialog` — full metadata display + inline edit/delete
- `toggleActionStatus` server action for both ACTION and GOAL
- Bidirectional links: Notes ↔ About me header buttons
- Sidebar nav "Hiểu mình" with `deepMatch: true`

## Strategic Direction

Personal Notes & Plans (Phase B) marks shift toward **personal productivity AI assistant**. Notes (journaling with 4 fixed types) serve as training context for future Gemini-based task priority suggestions — without notes, the AI has no signal about user values/patterns. Plan rollover + dashboard reminders add operational support. Out of scope in v1: AI-suggested priority, recurring plans, sharing, attachments.

## Backlog (từ V2 roadmap, vẫn open)

**High value / low effort 🟢**
- Merchant memory smarter (fuzzy match Levenshtein < 3, confidence hint)
- Smart budget suggest v2 (outlier detect, range thay vì single number)
- Quick-fill chips trên Add (3 nút "100k / 200k / 500k" personalized)

**High value / medium effort 🟡**
- Recurring transactions + Vercel Cron
- PWA + Offline mode (manifest + service worker + IndexedDB queue)
- Wallet / ví riêng biệt (Tiền mặt / MoMo / ZaloPay / banks)
- Tags free-form
- Voice input (Web Speech API tiếng Việt)

**Medium value / medium effort 🟡**
- Dark mode
- Heatmap calendar
- Spending forecast + AI insights (Gemini cache 24h)
- Bulk edit transactions

**Low priority 🟢🟢**
- Demo mode (localStorage)
- Email weekly summary (Resend free tier)
- Receipt photo gallery
- Telegram bot
- SMS parser

**V3 / Stretch**
- Family sharing (multi-user trên 1 ngân sách)
- iOS/Android wrapper (Capacitor)
- Multi-currency (USD/JPY → VND theo tỷ giá lịch sử)
- Asset price API (TCBS/SSI/VNDirect)
- Asset snapshot history (line chart total over time)
- Asset maturity reminder

## Tech debt cần track

- Migrate Anthropic Claude OCR khi có model mới (4.7+) — provider abstraction đã sẵn sàng plug
- Audit bundle size định kỳ (`@next/bundle-analyzer`) — target <500KB initial
- Migrate Prisma → Drizzle nếu thấy bundle lớn (Drizzle nhẹ hơn ~200KB)
- Setup E2E tests (Playwright) khi user >10
- Setup error monitoring (Sentry free tier 5K errors/tháng)
- `Transaction` chưa có cột `merchant` riêng — đang dùng `description` làm proxy cho `topMerchants` ranking

## Success metrics (target)

| Metric | Target | Đo bằng |
|---|---|---|
| Time-to-log một giao dịch (manual) | < 15s | Manual test |
| Time-to-log một giao dịch (scan) | < 8s | Manual test |
| OCR accuracy (Gemini) | ≥ 85% trường đúng hoàn toàn | OcrLog table sau ≥ 50 sample |
| Lighthouse Performance | ≥ 90 | Lighthouse CI |
| Bundle size client | < 500 KB initial JS | Next build report |
| Cost / tháng | $0 | Vercel + Supabase + Gemini free tier |

## Plans liên quan

- [`plans/260501-1137-mvp-expense-tracker/`](../plans/260501-1137-mvp-expense-tracker/) — MVP gốc
- [`plans/260502-0634-asset-management/`](../plans/260502-0634-asset-management/) — Asset Management (DONE)
- [`plans/260503-1448-reports-and-csv-import/`](../plans/260503-1448-reports-and-csv-import/) — Reports & CSV (DONE, retro plan)
