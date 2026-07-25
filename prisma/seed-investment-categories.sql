-- Backfill: give every existing user the 4 default investment categories.
-- New signups get them from the handle_new_user trigger (triggers.sql); this
-- script covers accounts created before the `investment` type existed.
-- Idempotent — safe to re-run.
--
-- Run in Supabase Dashboard → SQL Editor → New query → paste → Run.
-- Requires the `add_investment_transaction_type` migration to be applied first.

insert into public.categories (id, user_id, name, icon, color, "order", type)
select gen_random_uuid()::text, u.id, c.name, c.icon, c.color, c."order", 'investment'::"TransactionType"
from public.users u
cross join (values
  ('Cổ phiếu',    'solar:graph-up-bold',  '#9333ea', 20),
  ('Quỹ mở',      'solar:money-bag-bold', '#3d5a80', 21),
  ('Tiết kiệm',   'solar:safe-2-bold',    '#0288d1', 22),
  ('Đầu tư khác', 'solar:banknote-bold',  '#6a6a6a', 23)
) as c(name, icon, color, "order")
on conflict (user_id, name) do nothing;
