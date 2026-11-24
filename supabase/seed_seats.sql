-- Seed 800 seats: 400 left + 400 right, 50 rows x 8 seats.
-- Tier assignment follows the canonical checkout catalog introduced in 004.
do $$
declare
  t_adult uuid;
  t_child uuid;
  sec text;
  r int;
  c int;
begin
  select id into t_adult from public.ticket_tiers where lower(btrim(name)) = 'adult' limit 1;
  select id into t_child from public.ticket_tiers where lower(btrim(name)) = 'children below 10' limit 1;

  foreach sec in array array['left', 'right'] loop
    for r in 1..50 loop
      for c in 1..8 loop
        insert into public.seats (section, row_no, col_no, tier_id, status)
        values (sec, r, c, case when r <= 10 then t_child else t_adult end, 'available')
        on conflict (section, row_no, col_no) do nothing;
      end loop;
    end loop;
  end loop;
end $$;
