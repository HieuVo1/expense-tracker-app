# Code Standards

> Quy ước code áp dụng cho toàn `expense-tracker-app/`. Áp dụng cả khi viết mới và refactor.

## Nguyên tắc cốt lõi

- **YAGNI / KISS / DRY** — không xây cho tương lai giả định, không over-engineer, không lặp logic
- **Composition over inheritance** cho components phức tạp
- **Modularize khi tự nhiên** — function / class / concern boundaries có ý nghĩa, không phải artificial split
- **File ≤ 200 dòng** lý tưởng; nếu vượt → tách. Markdown / SQL / config không áp ngưỡng này

## File naming

- **Kebab-case** cho JS/TS/Python/shell — `transaction-edit-dialog.tsx`, `report-actions.ts`, `db-latency.ts`
- Tên mô tả mục đích, dài cũng được — LLM (Grep/Glob) đọc tên là biết file làm gì, không cần mở file
- Không dùng generic names (`utils.ts`, `helpers.ts`, `index.tsx` cho component) — luôn prefix domain
- Barrel `index.ts` chỉ trong `view/` để re-export view component

## TypeScript

- `strict: true`, `strictNullChecks: true` — không có `any` shortcut trong code mới
- `unknown` → narrow trước khi dùng
- Prefer `type` cho object shapes, `interface` cho contracts kế thừa (e.g. `OcrProvider`)
- Decimal từ Prisma: convert qua `Number(value)` ngay trong server action trước khi return về client (hydration mismatch nếu giữ Decimal)
- Imports: absolute từ `src/` — `import { CONFIG } from 'src/global-config';` không dùng `../../`
- Sort imports: `eslint-plugin-perfectionist` tự động — `pnpm lint:fix`

## React / Next

- **Server Components mặc định.** Chỉ thêm `'use client'` khi cần state, effects, hoặc browser-only API
- View component (`<feature>-list-view.tsx`) là server; client wrapper (`<feature>-list-client.tsx`) đặt cạnh khi cần state
- Page (`src/app/.../page.tsx`) là thin wrapper:
  ```tsx
  import { TransactionListView } from 'src/sections/transaction/view';
  export default function Page() { return <TransactionListView />; }
  ```
- **Server Actions over API routes** — mutation colocate trong `src/sections/<feature>/actions/`. API routes chỉ khi cần multipart upload, stream, hoặc external caller
- Mỗi server action: `'use server'` ở top, `requireUser()` đầu tiên, validate Zod, query Prisma, `revalidatePath()` sau mutation
- `revalidatePath()` cho route bị ảnh hưởng — không lười qua refetch SWR
- Form: React Hook Form + Zod, dùng `Field.*` wrappers trong `src/components/hook-form/`. For markdown content (Notes), use `Field.Editor` (RHF adapter for TipTap) — see `src/sections/note/` for example.
- **Lazy-load heavy components**: editors, charts wrapped with `dynamic({ ssr: false })` to avoid bundle bloat in page SSR. Example: `const Editor = dynamic(() => import('...'), { ssr: false })`.
- Toast feedback: `toast.success` / `toast.error` từ `src/components/snackbar`

## Sections pattern

```
src/sections/<feature>/
├── view/
│   ├── index.ts                   # barrel export
│   └── <feature>-list-view.tsx    # server component (page-level container)
├── components/                    # forms, dialogs, list items, sub-components
├── actions/
│   └── <feature>-actions.ts       # 'use server' mutations + queries
├── lib/                           # pure helpers (filter builders, etc.) — optional
├── utils/                         # pure functions — optional
├── constants/                     # static data (labels, colors) — optional
├── schemas.ts                     # Zod schemas — optional
└── types.ts                       # types riêng cho feature — optional
```

Không tạo subfolder rỗng. Chỉ thêm khi có ≥ 2 file cùng category.

## Imports & paths

- **Path constants** luôn từ `src/routes/paths.ts` — không hardcode `/dashboard/transactions` trong component
- **Env vars** đọc qua `src/global-config.ts` `CONFIG.*` — không scatter `process.env.*` khắp nơi
- **Auth** dùng `requireUser()` (server) hoặc `useAuthContext()` (client)
- **Prisma client** import từ `src/lib/prisma` (singleton)
- **Supabase** dùng đúng split: `src/lib/supabase/client` (browser), `server` (server components / actions), `middleware` (edge)

## Comments

Mặc định **không viết comment**. Tên biến / hàm / file đã document. Chỉ thêm khi:
- Có constraint / invariant không obvious từ code
- Workaround cho bug cụ thể (kèm reference hoặc một câu giải thích)
- Behavior surprising mà reader sẽ hỏi "tại sao"
- KHÔNG comment kiểu "Used by X", "Added for issue #123", "TODO: improve later"
- KHÔNG narrate code (`// fetch data`, `// loop through items`)

Ví dụ tốt (lifted from `src/lib/ocr/index.ts`):
```ts
// OCR_PROVIDER env switch:
//   - "gemini"  → Gemini only (MVP default)
//   - "claude"  → Claude only (not implemented yet — falls back to Gemini)
//   - "compare" → run both in parallel for A/B (not implemented yet)
```
Lý do: behavior 3 mode khác nhau, env var có thể set sai → cần biết fallback ra sao.

## Currency & dates

- **VND amounts:** `Decimal(15, 0)` ở DB; UI render qua `fCurrency(value)` từ `src/utils/format-number.ts` (locale `vi-VN`, no decimals)
- **Dates:** lưu `TIMESTAMP(3)` hoặc `Date` ở DB; render qua `fDate(value, 'DD/MM/YYYY')` từ `src/utils/format-time.ts`
- **Tabular figures:** `className="tabular"` trên mọi typography hiển thị tiền hoặc count để dọc thẳng cột
- **+/- prefix bắt buộc** cho expense / income — không chỉ dựa màu (accessibility)

## Security

- Mọi server action / route handler bắt đầu với `requireUser()` hoặc explicit auth check
- Prisma queries luôn `where: { userId: user.id }` defense-in-depth (RLS đã có ở DB)
- Không trust client input — Zod validate mọi server action
- File upload: check size (`MAX_FILE_BYTES`) + count (`MAX_FILES`) + type
- Không log secrets / PII; OcrLog chỉ giữ provider, latency, tokens, image bytes — không lưu raw response
- `CRON_SECRET` guard cho cron endpoints (Authorization: Bearer)
- Tránh OWASP Top 10: command injection, XSS, SQL injection — Prisma + React mặc định safe nếu không dùng `dangerouslySetInnerHTML` / `$queryRawUnsafe`

## Vietnamese language

- UI strings hardcode trực tiếp trong component, không setup i18n
- Dùng đúng dấu / tone: `Hoá đơn` (không `Hóa đơn`), `Lãi tiền gửi`, `Cài đặt`
- Thousands separator: `.` (vd `1.500.000`) — đã handle trong `fCurrency`
- Date format: `DD/MM/YYYY` cho display, `YYYY-MM-DD` cho URL params

## Pre-commit / push

- `pnpm lint` không error mới
- `pnpm tsc --noEmit` pass
- `pnpm build` pass nếu touch nhiều file
- Commit message conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`, `chore:`, `test:`
- Tránh commit secrets (`.env*`, API keys, DB creds)
- Không skip git hooks (`--no-verify`) trừ khi user yêu cầu rõ

## Anti-patterns cụ thể

- **KHÔNG** tạo file enhanced (`<feature>-v2.tsx`, `<feature>-new.tsx`) — sửa thẳng file gốc
- **KHÔNG** dùng `any` để bypass type error — narrow type hoặc fix root cause
- **KHÔNG** thêm error handling cho case không thể xảy ra (trust internal code)
- **KHÔNG** viết feature flag / backwards-compat shim khi có thể đổi thẳng code
- **KHÔNG** thêm dep mới mà chưa confirm với user (đặc biệt big libraries)
- **KHÔNG** dùng mock / fake data để pass build — implement thật
- **KHÔNG** export type wildcard (`export *`) — chỉ named export
- **KHÔNG** wildcard import từ MUI (`import * as MUI`) — bundle bloat

## Performance

- Bundle size target: < 500KB initial JS (Next build report)
- Tree-shake friendly imports: `import Box from '@mui/material/Box'`, không `import { Box } from '@mui/material'`
- Server-side render mặc định để giảm client JS
- ApexCharts lazy-load trong `Chart` wrapper (đã có sẵn trong template)
- Prisma queries: parallel `Promise.all` thay vì sequential khi không có dependency
- Avoid waterfalls: dùng `select` Prisma, không over-fetch

## Tools / scripts

- `pnpm tsx scripts/db-latency.ts` — đo latency DB từ local; reference RTT trong file output
- `pnpm fix:all` — lint + prettier auto-fix
- `pnpm tsc:dev` — dev server + tsc watch parallel; dùng khi sửa nhiều file refactor

## Reviews

- Sau implementation feature: pass `code-reviewer` agent (theo `.claude/rules/development-rules.md`)
- Manual smoke test trên browser cho UI changes — không claim "done" nếu chưa load thử
- Type-check và lint pass không phải bằng chứng feature đúng — vẫn cần test bằng tay
