# Project Changelog

> Format: ngày + scope. Mọi phase / feature / fix lớn cập nhật vào đây.
> Không log mỗi commit — gom theo feature.

## 2026-05-31 — Bible Study Tracker + VN-tz dashboard reminder fix

**Plan:** [`plans/260531-0758-bible-study-tracker/`](../plans/260531-0758-bible-study-tracker/)

- feat: NEW module Kinh thánh (`/dashboard/bible`) — upload `.md` lesson theo template `bible-lesson-v1`, parse section "## 2. Câu kinh trong bài", fetch nội dung VIE2010 từ bible.com (chapter scrape via `__NEXT_DATA__.chapterInfo.content`), cache per (book, chapter, range) trong `BibleVerse`, Gemini fallback
- feat: User-managed themes (`BibleTheme` + `BibleVerseTheme` m2m), AI gợi ý chủ đề (Gemini, hallucinated-name whitelist) khi gắn câu kinh, manual confirm
- feat: SM-2 lite spaced-repetition review — 4 nút Quên/Khó/OK/Dễ, `BibleReviewState` row per (user, verse), nextReviewDate VN-anchored
- feat: 4 routes mới — hub (lessons list + stats + import button + "Ôn tập (N)"), lesson detail (verses inline + theme picker + TipTap read-only render), themes list + detail, review flashcard
- feat: ambiguous reference resolver — refs như "Cô-rinh-tô 4:16" (không có 1/2 prefix) tạo stub row, UI book picker để user resolve
- DB: 6 models mới + 4 User relations, migration `20260531081900_add_bible_study_models` (13 migrations total). RLS appended ở `prisma/rls.sql` (cần paste vào Supabase SQL Editor)
- Source provider abstraction tại `src/lib/bible/` (mirror OCR pattern), env `BIBLE_SOURCE`: `auto` (default, bible-com → gemini) | `bible-com` | `gemini`
- fix: dashboard reminders + gratitude date — chuyển từ `dayjs().format('YYYY-MM-DD')` (UTC server) sang `fTodayVN()` (UTC+7). Reminder + gratitude entry giờ rollover lúc 00:00 VN thay vì 07:00 VN. Helper mới `fTodayVN()` / `fTodayVNDate()` trong `src/utils/format-time.ts`. Fix 4 file server-side: `dashboard-reminders.ts`, `gratitude-actions.ts`, `gratitude-view.tsx` (RSC), `plan-dates.ts` (`isPlanCurrent`)

## 2026-05-24 — Gratitude, Note images, Gallery page

- feat: NEW module Lòng biết ơn (daily gratitude) — `GratitudeEntry` model (1/user/day, items array, unique index), `/dashboard/gratitude`, soft target 5 items, dashboard reminder when incomplete
- feat: AI Companion corpus now includes 60 most-recent gratitude days (ids prefixed `gratitude:`) with card renderer
- feat: Image attachments on notes (About-me + Daily journal) — Prisma `Note.images` field, private Supabase Storage bucket `note-images` (owner-only RLS), signed URLs (8h TTL), shared `NoteImagesField` uploader, batch sign-on-read, orphan cleanup on update/delete
- feat: NEW page Thư viện ảnh (`/dashboard/gallery`) — aggregates all Note images, responsive grid, filter chips (Tất cả/Về tôi/Nhật ký), Lightbox preview
- feat: click ảnh trong note detail (About-me + Nhật ký) mở Lightbox (zoom + vuốt qua lại) thay vì mở tab mới — tái dùng `src/components/lightbox`
- fix: mobile vertical scroll on dashboard hub — `HorizontalScrollStrip.touchAction` now `'auto'` when not overflowing (was blocking page scroll with hardcoded `'pan-x'`)
- Migrations: 10 → 12 applied (`20260524002500_add_gratitude`, `20260524074500_add_note_images_and_storage`)

## 2026-05-16 — AI Companion "Tâm sự" (About-me)

**Plan:** [`plans/260516-1017-about-me-ai-companion/`](../plans/260516-1017-about-me-ai-companion/)

- feat: AI companion — user describes a life problem in VN, Gemini reads their own self-knowledge corpus and replies with empathy + cites 1–3 past entries they overcame, plus a grounded next step
- New `src/lib/ai/` (mirrors `src/lib/ocr/`): `types.ts`, `companion-prompt.ts` (VN prompt, corpus entries fenced in `<muc>` tags + data-not-instructions guard), `companion.ts` (Gemini 2.5 Flash, `responseSchema`, hallucinated-id whitelist filter)
- Server action `getCompanionSuggestion` in `src/sections/about-me/actions/about-me-companion.ts` — `requireUser`-scoped, corpus = About-me types + `daily` notes, token-bounded (max 400 entries / 600 chars / 2000-char problem), empty-corpus short-circuit (no AI call), re-maps model-selected ids → real DB rows (model never authors entry content)
- New route `/dashboard/about-me/companion` (static segment wins over `[type]`); view + client (textarea, example chips, pending/error states via sonner) + `companion-related-entry-card.tsx`
- Entry point: "Tâm sự" button on About-me hub header; `paths.dashboard.aboutMeCompanion`
- Retrieval: direct LLM, no embeddings/pgvector (YAGNI at single-user scale)
- No new dependencies, no Prisma migration (reuses `Note` model)

## 2026-05-10 — About me module (Phase C)

**Plan:** [`plans/260510-1350-hieu-minh-module/`](../plans/260510-1350-hieu-minh-module/)

- feat: add About me self-development module (7 entry types: GOAL/THOUGHT/LESSON/SIGNAL/PRINCIPLE/TRAIT/ACTION)
- New section `src/sections/about-me/` — actions (CRUD + stats + signal-patterns + toggle-status), components (card shells × 7, dialogs, forms × 7, row components × 5, empty state), view (hub + list), constants, schemas, types
- Hub page `/dashboard/about-me` — bento grid 7 cards (1-col mobile / 2-col tablet / 3-col desktop), stats strip, quick-capture FAB, type-picker dialog
- Per-type list pages `/dashboard/about-me/[type]` — dynamic RSC route, validates param against allowlist (notFound on unknown slug)
- GOAL list: grouped by kind order (short→long→dream), status filter chips, active-first sort + targetDate asc, progress bar, optimistic status menu
- SIGNAL list: pattern board (emotion × trigger frequency, current month) above flat entry list
- ACTION list: grouped by status (doing→planned→done→skipped), optimistic checkbox toggle via `toggleActionStatus`
- TRAIT list: 2-col strength | weakness (stacked on mobile)
- THOUGHT / LESSON / PRINCIPLE: flat time-ordered list, 2-line content clamp, inline search
- `AboutMeEditDialog`: bottom drawer (mobile) / centered dialog (desktop), all 7 form variants via React Hook Form + Zod
- `AboutMeDetailDialog`: full metadata renderer + edit + delete from same dialog
- `toggleActionStatus`: shared server action for ACTION and GOAL status changes
- Sidebar nav "Hiểu mình" with `deepMatch: true` — highlights on all `/dashboard/about-me/*` routes
- Bidirectional cross-links: Notes header → "Sang Hiểu mình", About me hub header → "Sang Ghi chú"
- `about-me-empty-state.tsx` reusable component (icon + label + CTA) used in cards and list pages
- Prisma: no new migration needed — reuses `Note` model with UPPERCASE type discriminator (GOAL/THOUGHT/etc.) distinct from lowercase Notes types (daily/insight/etc.)

## 2026-05-03 — Remove Design folder & Warm Minimalist references

- Xoá toàn bộ folder `Design/` (HTML mockups + `warm_minimalist/DESIGN.md`) — giao diện hiện tại đã chốt theo theme Minimal UI Kit Pro default
- Xoá comment / mention "Warm Minimalist" trong `CLAUDE.md`, `docs/`, plans, và 3 source file (`global.css`, `category-edit-dialog.tsx`, `logo-chart.svg`)
- Plans cũ (`260501-1137-mvp-expense-tracker/{01,02,03}.md`) cập nhật để không còn tham chiếu Design folder

## 2026-05-03 — Vercel deploy (Phase 8)

- App đã deploy lên Vercel free tier, region `sin1` (Singapore) per `vercel.json`
- Env vars production: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `DATABASE_URL` (pooled), `DIRECT_URL` (Prisma migrations), `GEMINI_API_KEY`, `OCR_PROVIDER` (default `gemini`)
- Pending: receipt cleanup cron (Phase 7.5) — sẽ cần thêm `CRON_SECRET` env + cron entry trong `vercel.json`

## 2026-05-03 — Documentation refresh

- Tạo `docs/` directory với 4 file: `development-roadmap.md`, `system-architecture.md`, `code-standards.md`, `project-changelog.md`
- Cập nhật `CLAUDE.md`:
  - OCR đính chính: chỉ Gemini (không phải Gemini + Anthropic side-by-side); Anthropic SDK chưa cài
  - Prisma: từ "planned" → "fully implemented (5 migrations applied)"
  - Cleanup state: từ "mid-migration" → "complete"
  - Thêm routes table, sections list, env vars
- Thêm retro plan `plans/260503-1448-reports-and-csv-import/README.md` document feature đã ship
- Đánh dấu Reports + CSV Export khỏi V2 backlog #1 → đã ship; bonus CSV import

## 2026-05-02 — Asset Management

**Plan:** [`plans/260502-0634-asset-management/`](../plans/260502-0634-asset-management/)

- Migration `20260502001047_add_assets`: model `Asset` + enum `AssetType { CASH STOCK FUND SAVINGS OTHER }`
- Migration `20260502004630_add_crypto_asset_type`: thêm `CRYPTO` vào enum
- Migration `20260502073000_transaction_date_with_time`: `Transaction.date` từ `@db.Date` → `TIMESTAMP(3)` (date + HH:mm naive UTC)
- New section `src/sections/asset/` đầy đủ: view, components (12), actions (asset-actions, risk-profile-actions), constants, schemas, types, utils
- New route `/dashboard/assets`
- Risk profile (LOW / MEDIUM / HIGH) lưu Supabase `user_metadata.risk_profile`; auto-suggest qua Euclidean distance; drift threshold 10%
- Cash sync banner: gợi ý thêm CASH asset từ tổng số dư transactions
- Nav menu: thêm "Tài sản" group "Tổng quan"

## 2026-05-01 — MVP Expense Tracker (Phase 0–7 + 7.6)

**Plan:** [`plans/260501-1137-mvp-expense-tracker/`](../plans/260501-1137-mvp-expense-tracker/)

### Phase 0 — Off-code prep
- Supabase project tạo, bucket `receipts`, anon + service keys
- RLS policies (`prisma/rls.sql`): mọi bảng có `user_id` policy `auth.uid() = user_id`
- Trigger `on_auth_user_created` (`prisma/triggers.sql`): seed 10 categories khi user signup

### Phase 1 — Cleanup template
- Xoá demo folders: `about*`, `blog`, `calendar`, `chat`, `checkout`, `file-manager`, `invoice`, `kanban`, `mail`, `tour`, `job`, `post`, `product`, `pricing`, `payment`, `contact*`, `faqs`, `coming-soon`, `maintenance`, `_examples`, `auth-demo`, `_mock`, `analytics`, `banking`, `booking`, `course`, `ecommerce`, `file`, `order`, `params`, `permission`, `subpaths`, `user` (demo)
- Remove deps: `@auth0/auth0-react`, `aws-amplify`, `firebase`, `@fullcalendar/*`, `@tiptap/*`, `embla-carousel*`, `@atlaskit/pragmatic-drag-and-drop*`, `maplibre-gl`, `react-map-gl`, `@mui/x-tree-view`, `react-organizational-chart`, `react-phone-number-input`, `mui-one-time-password-input`, `i18next*`, `react-markdown` + rehype/remark stack, `turndown`, `@react-pdf/renderer`, `@anthropic-ai/sdk`
- `pnpm build` PASS

### Phase 2 — Foundation
- Migration `20260501050942_init`: User, Category, Transaction, Budget, MerchantMemory, OcrLog
- Migration `20260501090202_add_category_type`: Categories typed (`expense` | `income`)
- Supabase clients split: `client.ts` (browser), `server.ts` (server components / actions), `middleware.ts` (edge)
- `src/lib/prisma.ts` singleton (HMR-safe)
- `src/lib/auth-helpers.ts`: `requireUser()` + `getCurrentUser()`
- OCR provider abstraction: `src/lib/ocr/{types,prompt,gemini,index}.ts`
- Theme: Minimal UI Kit Pro default palette (xanh `#00A76F`, Inter Variable)

### Phase 3 — Auth
- Supabase email/password (5 view forms: sign-in, sign-up, verify, reset-password, update-password)
- `middleware.ts` route guard: `PROTECTED_PREFIXES = ['/dashboard']`, `GUEST_ONLY_PREFIXES = ['/auth/sign-in', '/auth/sign-up']`
- Vietnamese form copy
- Account drawer trong sidebar dashboard

### Phase 4 — Categories + Budgets
- `/dashboard/categories`: CRUD + reorder + edit name/icon/color
- `/dashboard/budgets`: per-category × month form

### Phase 5 — Add Transaction
- `/dashboard/transactions/new`: manual form RHF + Zod, quick category chips, type toggle
- OCR scan multi-image (max 10 ảnh × 5MB) qua `/api/ocr` → preview → bulk confirm
- Merchant memory: bulk lookup → override AI suggestion bằng category đã pick

### Phase 6 — Transaction History
- `/dashboard/transactions`: group theo ngày, filter type+category+month+day+amount-range+search, edit dialog inline, delete confirm

### Phase 7 — Dashboard
- `/dashboard`: SummaryCard (tháng + delta), CategoryDonut, BudgetProgress
- ApexCharts wrapper từ template

### Phase 7.6 — Reports & CSV (promoted from V2 #1)
- `MonthlyTrendChart` 6 tháng + `TopTransactionsCard` + `TopMerchantsCard` tích hợp vào `/dashboard`
- `GET /api/reports/export`: CSV với UTF-8 BOM, mirror filter trang transactions
- `importTransactionsCsv` server action: round-trip với export, parser RFC 4180-ish, partial success, max 5,000 dòng
- `import-csv-button.tsx` client component cho upload UX
- Không tạo route `/dashboard/reports` riêng — tránh thêm hop

## 2026-05-05 — Personal Notes & Plans (Phase B + follow-ons)

**Plan:** [`plans/260504-2226-personal-notes-and-plans/`](../plans/260504-2226-personal-notes-and-plans/)

### Core Feature (6 phases)
- Migration `20260504162458_add_notes_and_plans`: 3 models (`Note`, `Plan`, `PlanTask`), 4 enums (`NoteType`, `PlanScope`, `PlanStatus`, `TaskPriority`). RLS policies added.
- Routes: `/dashboard/notes`, `/dashboard/plans`, `/dashboard/plans/[id]`. Sidebar nav: "Ghi chú" + "Kế hoạch".
- **Notes section** (`src/sections/note/`): CRUD with 4 fixed types (insight/strength/weakness/idea). Markdown content via restored TipTap editor (`@tiptap/react`, `@tiptap/starter-kit`, `tiptap-markdown`). Editor trimmed of image + code-block for size.
- **Plans list** (`src/sections/plan/`): weekly/monthly tabs, 3 sections (current/past/archived). Progress computed server-side.
- **Plan detail + Eisenhower matrix**: `/dashboard/plans/[id]` with 2×2 quadrant view by `TaskPriority` (do_first/schedule/delegate/eliminate), flat list tab, task toggle + inline rename, optimistic updates.
- **Dashboard widget**: `CurrentWeekPlanCard` shows current week plan + first 3 incomplete tasks on overview.
- **Mobile polish**: bottom-nav expanded to 6 tabs; editor toolbar collapse with 3-dot "Thêm tuỳ chọn" toggle; typing-lag fixes (removed debounce, fixed echo updates); dialog padding fix; plan-task-add typing-lag fix.

### Follow-on Features
- **Rollover**: `rolloverPlan(id)` copies incomplete tasks to next period (week +7d / next calendar month). UI: 3rd kebab menu on plan detail header.
- **Dashboard reminders**: `getDashboardReminders()` server action returns overdue + today + expired plan tasks. `DashboardRemindersCard` shown above summary on `/dashboard` when pending. Each task row links to plan; expired plans have inline rollover button.

## Pending

- **Phase 7.5** — Receipt cleanup cron (60-day auto-delete) — cần thêm cron entry trong `vercel.json` + `/api/cron/cleanup-receipts` route + `CRON_SECRET` env
