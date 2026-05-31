# System Architecture

> Snapshot kiến trúc hệ thống — phản ánh state codebase tại 2026-05-31.

## Stack tóm tắt

| Layer | Choice | Phiên bản | Ghi chú |
|---|---|---|---|
| Framework | Next.js | 16 (App Router, turbopack) | port `8082` (không phải 3000) |
| Runtime | React | 19 | Server Components mặc định |
| Language | TypeScript | 5.9, `strict: true` | absolute imports từ `src/` |
| UI | MUI | 7 + Emotion | `@mui/material`, `@mui/lab`, `@mui/x-data-grid`, `@mui/x-date-pickers` |
| Auth | Supabase Auth | `@supabase/ssr` 0.10, `@supabase/supabase-js` 2.87 | email/password + cookies |
| DB | Supabase Postgres + Prisma | Prisma 6.19 | RLS bật ở DB; Prisma queries scope qua `userId` |
| Storage | Supabase Storage | buckets `receipts`, `note-images` | hoá đơn (60d TTL cron pending); note images (owner-only, 8h signed URL) |
| OCR | Google Gemini | `@google/genai` 1.51 | provider abstraction đã sẵn cho Claude |
| Charts | ApexCharts | `react-apexcharts` 1.9 | wrapper `Chart` + `useChart` từ template |
| Forms | React Hook Form + Zod | RHF 7.68, Zod 4.1 | resolvers qua `@hookform/resolvers` |
| Date | dayjs | 1.11 | utc plugin extend khi cần ở server actions |
| Toasts | sonner | 2.0 | wrapper `toast` từ `src/components/snackbar` |
| Icons | Iconify React | 6.0 | wrapper `Iconify` từ `src/components/iconify` |
| Animations | framer-motion | 12.23 | dùng cho list transitions trong nav-section |
| Data fetching | SWR | 2.3 | client-side cho realtime UI; server-side dùng Prisma trực tiếp |
| Pkg mgr | pnpm | 10.33 (enforced) | `prisma generate` chạy postinstall |
| Deploy | Vercel | region `sin1` (`vercel.json`) | min RTT từ VN tới Supabase |

## Folder structure

```
Expense Tracker/
├── CLAUDE.md                          # Repo guidance (cập nhật theo source)
├── docs/                              # Long-form docs (file này, roadmap, changelog, code-standards)
├── plans/                             # Feature plans, ordered by date (chronological PRDs)
│   ├── 260501-1137-mvp-expense-tracker/
│   ├── 260502-0634-asset-management/
│   └── 260503-1448-reports-and-csv-import/
├── .claude/                           # Claudekit config (rules, skills, hooks)
└── expense-tracker-app/               # Next.js app
    ├── middleware.ts                  # Supabase session refresh + route guards
    ├── next.config.ts                 # turbopack + svgr + trailingSlash
    ├── vercel.json                    # region pin sin1
    ├── prisma/
    │   ├── schema.prisma              # Models + RLS-friendly indexes
    │   ├── migrations/                # 12 migrations applied
    │   ├── rls.sql                    # RLS policies (paste vào Supabase SQL Editor)
    │   ├── triggers.sql               # `on_auth_user_created` seeding categories
    │   └── fix-category-icons.sql     # Hot-fix script
    ├── public/                        # Static assets
    ├── scripts/
    │   └── db-latency.ts              # `pnpm tsx scripts/db-latency.ts`
    └── src/
        ├── app/                       # Next App Router
        │   ├── (home)/                # `/` redirects → `/dashboard`
        │   ├── auth/                  # sign-in / sign-up / verify / reset-password / update-password
        │   ├── dashboard/
        │   │   ├── layout.tsx
        │   │   ├── page.tsx           # → DashboardOverviewView
        │   │   ├── transactions/      # list + new
        │   │   ├── budgets/
        │   │   ├── categories/
        │   │   ├── assets/
        │   │   └── settings/
        │   ├── api/
        │   │   ├── ocr/route.ts
        │   │   └── reports/export/route.ts
        │   ├── error/{403,404,500}/
        │   ├── layout.tsx
        │   ├── manifest.ts            # PWA manifest stub
        │   └── not-found.tsx
        ├── auth/                      # Supabase auth implementation
        │   ├── components/            # form-* shared bits (head, divider, return link, ...)
        │   ├── context/               # auth-context.tsx + supabase/
        │   ├── guard/                 # auth-guard, guest-guard
        │   ├── hooks/                 # use-auth-context
        │   ├── view/supabase/         # 5 view forms
        │   └── types.ts, utils/
        ├── components/                # Generic primitives (kept from template)
        │   ├── editor/                # Markdown editor (TipTap, restored from Minimal Kit, trimmed)
        │   └── animate, chart, hook-form, iconify, label, nav-section, snackbar, scrollbar, table, upload, ...
        ├── sections/                  # Feature-level UI
        │   ├── about-me/      ── view, components, actions, schemas, types (7 entry types + AI companion)
        │   ├── asset/         ── view, components, actions, schemas, types, constants, utils
        │   ├── budget/        ── view, components, actions
        │   ├── category/      ── view, components, actions
        │   ├── dashboard/     ── view, components, actions
        │   ├── gallery/       ── view, actions (aggregates Note images)
        │   ├── gratitude/     ── view, components, actions, schemas, types, constants
        │   ├── note/          ── view, components, actions, schemas
        │   ├── plan/          ── view, components, actions, schemas, utils
        │   ├── report/        ── components, actions  (no view — feeds dashboard)
        │   ├── settings/      ── view, components
        │   ├── subscription/  ── view, components, actions
        │   └── transaction/   ── view, components, actions, lib
        ├── lib/
        │   ├── supabase/{client,server,middleware}.ts
        │   ├── prisma.ts
        │   ├── auth-helpers.ts        # requireUser, getCurrentUser
        │   ├── ocr/{types,prompt,gemini,index}.ts
        │   ├── ai/{types,companion-prompt,companion}.ts
        │   ├── storage/note-images.ts, note-images-server.ts
        │   └── axios.ts
        ├── theme/                     # MUI theme (template default palette)
        ├── layouts/
        │   ├── dashboard/             # sidebar + topbar
        │   ├── auth-centered/
        │   ├── components/            # account-drawer, sign-out-button, ...
        │   ├── core/
        │   └── nav-config-dashboard.tsx
        ├── routes/paths.ts
        ├── utils/{format-number,format-time}.ts
        ├── global-config.ts           # CONFIG.{appName, supabase.{url,anonKey}, auth.{skip,redirectPath}}
        ├── global.css
        └── types/
```

## Database schema

```
User (id ↔ Supabase auth.uid, uuid)
 ├─ Category[]            (6 expense + 4 income seed; @@unique(userId, name))
 ├─ Transaction[]         (Decimal(15,0) amount; type expense|income; date TIMESTAMP(3))
 ├─ Budget[]              (per category × month; @@unique(userId, categoryId, month))
 ├─ MerchantMemory[]      (lowercase merchant → categoryId; @@unique(userId, merchant))
 ├─ Asset[]               (6 types incl. CRYPTO; capital + currentValue + savings extras)
 ├─ Note[]                (types: about-me (7 types) + daily journal; content markdown; images[] Storage paths; @@index(userId, createdAt desc))
 ├─ GratitudeEntry[]      (items array; @@unique(userId, date); @@index(userId, date desc))
 ├─ Plan[]                (scope weekly|monthly; status active|completed|archived)
 │   └─ PlanTask[]        (priority do_first|schedule|delegate|eliminate; isDone boolean)
 ├─ Subscription[]        (recurring bills; cycle monthly|quarterly|yearly; nextDueDate; active)
 ├─ BibleLesson[]         (uploaded .md study notes; rawMarkdown + parsedSections JSON; @@index(userId, date desc))
 │   └─ BibleLessonVerse[] (m2m link to BibleVerse with `order`)
 ├─ BibleVerse[]          (per-(book,chapter,range,version) verse cache; @@unique(userId, bookCode, chapter, startVerse, endVerse, version); fetchStatus: ok|failed|ambiguous)
 │   ├─ BibleVerseTheme[] (m2m link to BibleTheme)
 │   └─ BibleReviewState? (SM-2 lite per verse; lazy-created on first review)
 ├─ BibleTheme[]          (user-created topics; @@unique(userId, name); @@index(userId, order))
 └─ BibleReviewState[]    (easiness 1.3..n, interval days, repetitions, nextReviewDate; @@index(userId, nextReviewDate))

OcrLog (no userId FK — orphan-tolerant logs)
```

**Notes:**
- RLS: mọi bảng có `user_id` policy `auth.uid() = user_id`. Prisma queries luôn `where: { userId: user.id }` defense-in-depth.
- VND amounts: `Decimal(15, 0)` đủ tới 999,999,999,999,999 ₫.
- `Transaction.date` lưu wall-clock UTC (naive) — không có timezone math anywhere; UI render `DD/MM/YYYY HH:mm` qua dayjs.
- Categories typed (`expense` | `income`) để picker chỉ show options đúng loại trong form.
- Assets không link với Transactions — snapshot manual entry, no auto-create "Chi" khi nạp tiền.
- Note.images: array of Storage paths (bucket `note-images`, prefixed `<userId>/<uuid>.<ext>`). Signed URLs (8h TTL) generated on read. Orphan cleanup (best-effort) on update/delete.
- GratitudeEntry: 1 per user per day. `items` array (min 1, soft target 5). Unique index prevents duplicates. Re-date action: can update today's entry date to earlier day if that date unoccupied. Dashboard reminder: gratitudePending until day reaches target.
- Note.images + AboutMeImages: shared `NoteImagesField` uploader. Gallery aggregates all Note images newest-first (excluding gratitude).
- AI Companion corpus: About-me entries (7 types) + Notes (daily journal) + GratitudeEntry (last 60, prefixed `gratitude:`). Retrieval no embeddings — direct LLM. Related card can surface a gratitude day.
- Plans: weekly/monthly scope, active/completed/archived status. Tasks classified by Eisenhower priority (Q1: do first / Q2: schedule / Q3: delegate / Q4: eliminate). Progress = % tasks isDone, computed server-side. Rollover action copies incomplete tasks to next period.
- Dashboard reminders: fetched server-side on `/dashboard` load via `getDashboardReminders()` — returns gratitudePending, overdue tasks, today's tasks, and expired plans with incomplete tasks. Card shown above summary when any pending. "Today" anchored to VN wall-clock via `fTodayVN()` (UTC+7) so rollover happens at 00:00 VN, not 07:00 VN (when server UTC ticks).
- Bible verses: cache per `(userId, bookCode, chapter, startVerse, endVerse, version)` row in `BibleVerse`. Provider abstraction at `src/lib/bible/` (mirror OCR): bible.com chapter scrape primary (parses `__NEXT_DATA__.chapterInfo.content` then slices verse range), Gemini fallback. `fetchStatus`: `ok` | `failed` (network/parse error, "Tải lại" button) | `ambiguous` (book name like "Cô-rinh-tô" matches 1CO+2CO, user resolves via book picker). Per-process LRU cap 32 chapters reduces same-chapter re-fetches during a single import.
- Bible review SM-2 lite: 4 quality levels (0=Quên/1=Khó/2=OK/3=Dễ) update `easiness` (1.3 floor) + `interval` + `repetitions`. `nextReviewDate` = VN today + interval days. New verses with no review row are eligible immediately (shown after due verses up to 50/session cap).

## Auth flow

1. **Sign-up** (`/auth/sign-up`): email + password → Supabase tạo user → email verify link → user click → `/auth/verify` confirm
2. **First sign-in:** DB trigger `on_auth_user_created` seed 10 categories cho user (6 expense + 4 income)
3. **Session:** Supabase set httpOnly cookies; `middleware.ts` refresh trên mỗi request đụng cookie
4. **Guard:** `PROTECTED_PREFIXES = ['/dashboard']` redirect → sign-in nếu chưa auth; `GUEST_ONLY_PREFIXES = ['/auth/sign-in', '/auth/sign-up']` redirect → `/dashboard` nếu đã auth
5. **Server-side:** `requireUser()` trong `src/lib/auth-helpers.ts` — gọi từ server components / actions / route handlers

## Data flow điển hình (Add Transaction qua OCR)

```
User chụp ảnh hoá đơn (mobile)
  ↓
TransactionAddClient (client component) — react-dropzone
  ↓ POST /api/ocr (multipart, tới 10 ảnh ≤5MB)
Route handler /api/ocr (Next route)
  ├─ requireUser via cookies
  ├─ getOcrProvider() → geminiProvider (env OCR_PROVIDER)
  ├─ provider.extractTransactions(images) → Gemini Flash structured output
  ├─ Bulk merchantMemory lookup (override AI suggestion)
  ├─ Insert OcrLog row (latency, tokens, success)
  └─ Return { transactions[], merchantHits, latencyMs, provider }
  ↓
TransactionScanPreview component — list từng giao dịch detect
  ├─ User edit từng row qua TransactionScanEditDialog
  └─ Bấm "Xác nhận tất cả"
  ↓
createTransactionsBulk server action
  ├─ Validate Zod
  ├─ prisma.transaction.createMany
  ├─ Upsert merchantMemory cho merchants user pick category mới
  └─ revalidatePath('/dashboard/transactions')
```

## Routing matrix

| Path | Server / Client | Auth | Mô tả |
|---|---|---|---|
| `/` | redirect | guest | → `/dashboard` |
| `/auth/sign-in` | server | guest-only | Supabase email/password |
| `/auth/sign-up` | server | guest-only | + email verify flow |
| `/auth/verify` | server | any | confirm token từ email |
| `/auth/reset-password` | server | any | gửi email reset link |
| `/auth/update-password` | server | auth | đổi password (cũng dùng cho user đang login) |
| `/dashboard` | server | required | Overview (summary + trend + donut + budget + top tx + top merchants) |
| `/dashboard/transactions` | server | required | List + filter + CSV import button |
| `/dashboard/transactions/new` | server + client | required | Form add manual + OCR scan |
| `/dashboard/budgets` | server | required | Per-category × month |
| `/dashboard/categories` | server | required | CRUD + reorder |
| `/dashboard/assets` | server + client | required | List + dialog form + risk picker |
| `/dashboard/notes` | server + client | required | List notes + create/edit dialogs (markdown editor, images) |
| `/dashboard/gratitude` | server + client | required | Today's form + history list + edit/redate dialogs |
| `/dashboard/gallery` | server + client | required | Aggregated Note images grid (filter: all/about-me/journal) + Lightbox |
| `/dashboard/plans` | server + client | required | List plans (weekly/monthly tabs, 3 sections) + create dialog |
| `/dashboard/plans/[id]` | server + client | required | Plan detail + Eisenhower matrix + flat task list |
| `/dashboard/about-me` | server + client | required | Hub (7 cards) + type-specific list pages + stats + AI companion |
| `/dashboard/settings` | server | required | Account info + nav links |
| `/api/ocr` | route handler | required | POST images → TransactionExtract[] |
| `/api/reports/export` | route handler | required | GET CSV (filter qua querystring) |

## Cross-cutting

### Theme
Uses **Minimal UI Kit Pro default palette** (primary green `#00A76F`, Inter Variable). Theme tokens trong `src/theme/theme-config.ts`; component overrides trong `src/theme/theme-overrides.ts`.

### Imports & lint
Absolute paths từ `src/`. `eslint-plugin-perfectionist` enforces import sort order — `pnpm lint:fix` để auto-sort. `eslint-plugin-unused-imports` xoá unused imports.

### Server Actions vs API Routes
- **Server actions** (`'use server'` trong `src/sections/<feature>/actions/`): mọi mutation đi qua đây — colocated, type-safe, revalidate dễ.
- **API routes** (`src/app/api/`): chỉ khi cần shape khác hoặc external caller — `/api/ocr` (multipart upload), `/api/reports/export` (CSV stream với Content-Disposition).

### Currency display
`fCurrency(value)` từ `src/utils/format-number.ts` (locale `vi-VN`, no decimals). CSS `font-feature-settings: 'tnum'` qua class `.tabular` cho list/table alignment.

### Date display
`fDate(value, 'DD/MM/YYYY')` hoặc `fDateTime(value)` từ `src/utils/format-time.ts`. Form input dùng `RHFDatePicker` với format VN.

## Performance & cost

- Vercel free tier (100GB bandwidth/tháng, 100h serverless function/tháng)
- Supabase free tier (500MB DB, 1GB storage, 50K MAU)
- Gemini free tier (15 RPM, 1M tokens/day Flash)
- Region pin `sin1` minimum RTT tới Supabase (Asia Pacific)
- Receipt cleanup cron (60-day) — pending; sẽ chạy `0 3 * * *` UTC

## Open questions / risks

- Prisma + Supabase pooler tương thích Prisma 6+ — verify pooler mode sau deploy
- Token cost của Gemini multi-image (10 ảnh / call) — monitor `OcrLog.inputTokens` sau khi user thực sự dùng
- `MerchantMemory` không có TTL — có thể bloat sau vài năm; chưa pri
- Không có rate limit ở app layer cho `/api/ocr` (chỉ rely Gemini quota) — rủi ro nếu key leak
