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

-- Extend reserve_tickets to accept optional seat_ids and reserve them atomically.
create or replace function public.reserve_tickets(
  p_name text,
  p_email text,
  p_phone text,
  p_dietary text,
  p_items jsonb,
  p_seat_ids uuid[] default '{}'
) returns jsonb
language plpgsql
security definer
as $$
declare
  v_order_id uuid;
  v_total integer := 0;
  v_item jsonb;
  v_tier_id uuid;
  v_qty integer;
  v_price integer;
  v_tier_name text;
  v_seat_id uuid;
begin
  perform public.release_expired_reservations();

  if p_name is null or btrim(p_name) = '' then raise exception 'name required'; end if;
  if p_email is null or position('@' in p_email) = 0 then raise exception 'valid email required'; end if;
  if p_phone is null or p_phone !~ '^(\+91)?[6-9][0-9]{9}$' then raise exception 'valid +91 phone required'; end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'items required';
  end if;

  -- Reserve seats first (lock rows)
  if array_length(p_seat_ids, 1) is not null then
    for v_seat_id in select unnest(p_seat_ids) loop
      update public.seats set status = 'taken' where id = v_seat_id and status = 'available';
      if not found then raise exception 'seat unavailable: %', v_seat_id; end if;
    end loop;
  end if;

  insert into public.orders (customer_name, customer_email, customer_phone, dietary_pref, total_amount, status)
  values (btrim(p_name), lower(btrim(p_email)), regexp_replace(p_phone, '\s+', '', 'g'), nullif(btrim(coalesce(p_dietary,'')),''), 0, 'PENDING')
  returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_tier_id := (v_item->>'tier_id')::uuid;
    v_qty := (v_item->>'quantity')::integer;
    if v_qty is null or v_qty <= 0 then raise exception 'invalid quantity'; end if;

    select price_inr, name into v_price, v_tier_name
    from public.ticket_tiers
    where id = v_tier_id and active = true
    for update;

    if not found then raise exception 'tier not found'; end if;

    update public.ticket_tiers
      set sold_count = sold_count + v_qty
      where id = v_tier_id and sold_count + v_qty <= total_quota;

    if not found then raise exception 'insufficient stock for %', v_tier_name; end if;

    insert into public.order_items (order_id, tier_id, quantity, unit_price)
    values (v_order_id, v_tier_id, v_qty, v_price);

    v_total := v_total + (v_price * v_qty);
  end loop;

  -- Link seats to order
  if array_length(p_seat_ids, 1) is not null then
    update public.seats set status = 'taken' where id = any(p_seat_ids);
  end if;

  update public.orders set total_amount = v_total where id = v_order_id;
  return jsonb_build_object('order_id', v_order_id, 'total_amount', v_total, 'status_token', v_order_id::text);
end;
$$;

grant execute on function public.reserve_tickets(text,text,text,text,jsonb,uuid[]) to service_role;