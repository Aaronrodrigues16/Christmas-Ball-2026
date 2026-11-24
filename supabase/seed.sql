-- Seed canonical ticket tiers and scanner PIN for Orlem Christmas Ball 2026.
-- Run this AFTER applying 001_ticketing.sql; migration 004 also normalises tiers.

insert into public.ticket_tiers (name, price_inr, total_quota, sold_count, active)
select canonical.name, canonical.price, canonical.quota, 0, true
from (
  values
    ('Kids Below 3', 0, 200),
    ('Children Below 10', 1000, 200),
    ('Adult', 3500, 300)
) as canonical(name, price, quota)
where not exists (
  select 1 from public.ticket_tiers t where lower(btrim(t.name)) = lower(canonical.name)
);

-- Scanner PIN (change to your secure PIN)
insert into public.app_settings (key, value) values
  ('scanner_pin', 'CHANGE_THIS_PIN')
on conflict (key) do update set value = excluded.value;
