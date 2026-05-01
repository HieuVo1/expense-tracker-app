-- Auto-provisioning trigger: when Supabase Auth creates a new user, mirror the
-- row into public.users and seed 6 default Vietnamese categories.
--
-- Run this in Supabase Dashboard → SQL Editor → New query → paste → Run.
-- Idempotent: safe to re-run (drop trigger / replace function).

-- ─── Function ─────────────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Mirror auth.users row into public.users so app queries work.
  insert into public.users (id, email, created_at)
  values (new.id, new.email, now())
  on conflict (id) do nothing;

  -- Seed default categories — 6 expense + 4 income.
  -- ID format: UUID-as-text (Prisma reads either cuid or uuid strings from @id).
  insert into public.categories (id, user_id, name, icon, color, "order", type)
  values
    -- ── Expense (order 0-5) ──
    (gen_random_uuid()::text, new.id, 'Ăn uống',        'solar:tea-cup-bold',             '#4a7c59',  0, 'expense'),
    (gen_random_uuid()::text, new.id, 'Mua sắm',        'solar:cart-plus-bold',           '#a3593e',  1, 'expense'),
    (gen_random_uuid()::text, new.id, 'Di chuyển',      'solar:electric-refueling-bold',  '#3d5a80',  2, 'expense'),
    (gen_random_uuid()::text, new.id, 'Giải trí',       'solar:gamepad-bold',             '#8b5a8c',  3, 'expense'),
    (gen_random_uuid()::text, new.id, 'Hoá đơn',        'solar:bill-list-bold-duotone',   '#7a7445',  4, 'expense'),
    (gen_random_uuid()::text, new.id, 'Khác',           'solar:menu-dots-bold-duotone',   '#747878',  5, 'expense'),
    -- ── Income (order 10-13) ──
    (gen_random_uuid()::text, new.id, 'Lương',          'solar:wad-of-money-bold',        '#2e7d32', 10, 'income'),
    (gen_random_uuid()::text, new.id, 'Thưởng',         'solar:cup-star-bold',            '#f57c00', 11, 'income'),
    (gen_random_uuid()::text, new.id, 'Lãi tiền gửi',   'solar:download-bold',            '#0288d1', 12, 'income'),
    (gen_random_uuid()::text, new.id, 'Thu nhập khác',  'solar:tag-horizontal-bold-duotone', '#6a6a6a', 13, 'income')
  on conflict (user_id, name) do nothing;

  return new;
end;
$$;

-- ─── Trigger on auth.users ────────────────────────────────────────
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
