-- Seed ticket tiers and scanner PIN for Orlem Christmas Ball 2026
-- Run this AFTER applying supabase/migrations/001_ticketing.sql

-- Ticket tiers (adjust prices/quotas as needed)
insert into public.ticket_tiers (name, price_inr, total_quota) values
  ('Regular Pass', 1500, 200),
  ('Couple Pass', 2800, 50),
  ('Student Pass', 1000, 50)
on conflict do nothing;

-- Scanner PIN (change to your secure PIN)
insert into public.app_settings (key, value) values
  ('scanner_pin', 'CHANGE_THIS_PIN')
on conflict (key) do update set value = excluded.value;