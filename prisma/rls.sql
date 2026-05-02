-- Row Level Security for Expense Tracker
-- Run this in Supabase Dashboard → SQL Editor → New query → paste → Run.
-- Idempotent: safe to re-run.
--
-- Strategy: each row scoped by user_id (uuid). auth.uid() returns the JWT subject.
-- Server-side queries via service role key bypass RLS (use sparingly).

-- ─── Enable RLS on all app tables ─────────────────────────────
alter table public.users           enable row level security;
alter table public.categories      enable row level security;
alter table public.transactions    enable row level security;
alter table public.budgets         enable row level security;
alter table public.merchant_memory enable row level security;
alter table public.ocr_logs        enable row level security;
alter table public.assets          enable row level security;

-- ─── users ────────────────────────────────────────────────────
-- Users can only see / modify their own profile row.
drop policy if exists "users_self_select" on public.users;
create policy "users_self_select" on public.users
  for select using (auth.uid() = id);

drop policy if exists "users_self_insert" on public.users;
create policy "users_self_insert" on public.users
  for insert with check (auth.uid() = id);

drop policy if exists "users_self_update" on public.users;
create policy "users_self_update" on public.users
  for update using (auth.uid() = id);

-- ─── categories ───────────────────────────────────────────────
drop policy if exists "categories_owner_all" on public.categories;
create policy "categories_owner_all" on public.categories
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─── transactions ─────────────────────────────────────────────
drop policy if exists "transactions_owner_all" on public.transactions;
create policy "transactions_owner_all" on public.transactions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─── budgets ──────────────────────────────────────────────────
drop policy if exists "budgets_owner_all" on public.budgets;
create policy "budgets_owner_all" on public.budgets
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─── merchant_memory ──────────────────────────────────────────
drop policy if exists "merchant_owner_all" on public.merchant_memory;
create policy "merchant_owner_all" on public.merchant_memory
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─── ocr_logs ─────────────────────────────────────────────────
-- user_id may be null (e.g., logged before auth checked).
-- Authenticated users see only their own logs; nulls visible to no one.
drop policy if exists "ocr_logs_owner_select" on public.ocr_logs;
create policy "ocr_logs_owner_select" on public.ocr_logs
  for select using (auth.uid() = user_id);

drop policy if exists "ocr_logs_owner_insert" on public.ocr_logs;
create policy "ocr_logs_owner_insert" on public.ocr_logs
  for insert with check (auth.uid() = user_id or user_id is null);

-- ─── assets ───────────────────────────────────────────────────
drop policy if exists "assets_owner_all" on public.assets;
create policy "assets_owner_all" on public.assets
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
