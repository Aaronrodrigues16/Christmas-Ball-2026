-- Normalize ticket tiers for the checkout flow
update public.ticket_tiers set active = false;

insert into public.ticket_tiers (name, price_inr, total_quota, sold_count, active) values
  ('Kids Below 3', 0, 200, 0, true),
  ('Children Below 10', 1000, 200, 0, true),
  ('Adult', 3500, 300, 0, true);

-- Ensure RLS policy exists
drop policy if exists anon_select_active_tiers on public.ticket_tiers;
create policy anon_select_active_tiers on public.ticket_tiers
  for select to anon using (active = true);

grant execute on function public.reserve_seats(uuid[], int) to service_role;
grant select on public.seats to service_role;