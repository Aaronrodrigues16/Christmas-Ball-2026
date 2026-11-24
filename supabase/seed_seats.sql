-- Seed 800 seats: 400 left + 400 right, 50 rows x 8 seats.
-- Assign tiers by row bands (adjust tier ids via subquery on name).
do $$
declare
  t_regular uuid; t_couple uuid;
  sec text; r int; c int;
begin
  select id into t_regular from public.ticket_tiers where name ilike '%regular%' limit 1;
  select id into t_couple from public.ticket_tiers where name ilike '%couple%' limit 1;
  foreach sec in array array['left','right'] loop
    for r in 1..50 loop
      for c in 1..8 loop
        insert into public.seats (section, row_no, col_no, tier_id, status)
        values (sec, r, c,
          case when r <= 10 then t_couple else t_regular end,
          'available')
        on conflict (section,row_no,col_no) do nothing;
      end loop;
    end loop;
  end loop;
end $$;