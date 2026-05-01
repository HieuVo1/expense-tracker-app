-- Backfill / repair: ensure all users have correct icon, color, AND type
-- on their expense categories, plus the 4 default income categories.
-- Idempotent — safe to re-run.
--
-- Run in Supabase Dashboard → SQL Editor → New query → paste → Run.

-- ─── Fix existing expense categories ───────────────────────────────
update public.categories set icon = 'solar:tea-cup-bold',            color = '#4a7c59', type = 'expense' where name = 'Ăn uống';
update public.categories set icon = 'solar:cart-plus-bold',          color = '#a3593e', type = 'expense' where name = 'Mua sắm';
update public.categories set icon = 'solar:electric-refueling-bold', color = '#3d5a80', type = 'expense' where name = 'Di chuyển';
update public.categories set icon = 'solar:gamepad-bold',            color = '#8b5a8c', type = 'expense' where name = 'Giải trí';
update public.categories set icon = 'solar:bill-list-bold-duotone',  color = '#7a7445', type = 'expense' where name = 'Hoá đơn';
update public.categories set icon = 'solar:menu-dots-bold-duotone',  color = '#747878', type = 'expense' where name = 'Khác';

-- ─── Backfill income categories for users missing them ─────────────
-- Insert one row per (user_id, income_category) where it doesn't already exist.
insert into public.categories (id, user_id, name, icon, color, "order", type)
select gen_random_uuid()::text, u.id, c.name, c.icon, c.color, c."order", 'income'::"TransactionType"
from public.users u
cross join (values
  ('Lương',         'solar:wad-of-money-bold',           '#2e7d32', 10),
  ('Thưởng',        'solar:cup-star-bold',               '#f57c00', 11),
  ('Lãi tiền gửi',  'solar:download-bold',               '#0288d1', 12),
  ('Thu nhập khác', 'solar:tag-horizontal-bold-duotone', '#6a6a6a', 13)
) as c(name, icon, color, "order")
on conflict (user_id, name) do nothing;
