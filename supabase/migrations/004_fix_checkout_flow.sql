-- Canonical ticket tiers for the checkout flow.
-- Safe to re-run: keeps one active row per canonical name and deactivates legacy tiers.
with canonical(name, price, quota) as (
  values
    ('Kids Below 3', 0, 200),
    ('Children Below 10', 1000, 200),
    ('Adult', 3500, 300)
)
insert into public.ticket_tiers (name, price_inr, total_quota, sold_count, active)
select c.name, c.price, c.quota, 0, false
from canonical c
where not exists (
  select 1 from public.ticket_tiers t where lower(btrim(t.name)) = lower(c.name)
);

update public.ticket_tiers set active = false;

with canonical(name, price, quota) as (
  values
    ('Kids Below 3', 0, 200),
    ('Children Below 10', 1000, 200),
    ('Adult', 3500, 300)
),
chosen as (
  select c.name, c.price, c.quota, min(t.id::text)::uuid as id
  from canonical c
  join public.ticket_tiers t on lower(btrim(t.name)) = lower(c.name)
  group by c.name, c.price, c.quota
)
update public.ticket_tiers tt
set active = true,
    price_inr = c.price,
    total_quota = c.quota,
    sold_count = least(tt.sold_count, c.quota)
from chosen c
where tt.id = c.id;

-- The RLS policy already exists in 001_ticketing.sql; do not recreate it.
grant execute on function public.reserve_seats(uuid[], int) to service_role;
grant select on public.seats to service_role;

-- Reserve tickets and seats atomically. Seats are only RESERVED here;
-- fulfillment marks them TAKEN after Razorpay verification succeeds.
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
  v_required_seats integer := 0;
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
  if jsonb_array_length(p_items) > 10 then raise exception 'too many items'; end if;

  if (
    select count(*)
    from (
      select distinct u.value->>'tier_id' as tier_id
      from jsonb_array_elements(p_items) AS u(value)
    ) distinct_items
  ) <> jsonb_array_length(p_items) then
    raise exception 'duplicate ticket tier';
  end if;

  if coalesce(array_length(p_seat_ids, 1), 0) > 0 then
    if (
      select count(*)
      from (select distinct id from unnest(p_seat_ids) AS u(id)) distinct_seats
    ) <> array_length(p_seat_ids, 1) then
      raise exception 'duplicate seat id';
    end if;

    if exists (
      select 1 from unnest(p_seat_ids) AS u(id)
      where not exists (select 1 from public.seats s where s.id = u.id)
    ) then
      raise exception 'unknown seat id';
    end if;
  end if;

  insert into public.orders (customer_name, customer_email, customer_phone, dietary_pref, total_amount, status)
  values (btrim(p_name), lower(btrim(p_email)), regexp_replace(p_phone, '\s+', '', 'g'), nullif(btrim(coalesce(p_dietary, '')), ''), 0, 'PENDING')
  returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_tier_id := (v_item->>'tier_id')::uuid;
    v_qty := (v_item->>'quantity')::integer;
    if v_qty is null or v_qty <= 0 or v_qty > 4 then raise exception 'invalid quantity'; end if;

    select price_inr, name into v_price, v_tier_name
    from public.ticket_tiers
    where id = v_tier_id and active = true
    for update;

    if not found then raise exception 'tier not found'; end if;

    if lower(btrim(v_tier_name)) in ('children below 10', 'adult') then
      v_required_seats := v_required_seats + v_qty;
    end if;

    update public.ticket_tiers
      set sold_count = sold_count + v_qty
      where id = v_tier_id and sold_count + v_qty <= total_quota;

    if not found then raise exception 'insufficient stock for %', v_tier_name; end if;

    insert into public.order_items (order_id, tier_id, quantity, unit_price)
    values (v_order_id, v_tier_id, v_qty, v_price);

    v_total := v_total + (v_price * v_qty);
  end loop;

  if coalesce(array_length(p_seat_ids, 1), 0) <> v_required_seats then
    raise exception 'exactly % seat(s) required', v_required_seats;
  end if;

  -- Lock requested seats in a stable order and hold them until payment is verified.
  for v_seat_id in
    select s.id
    from unnest(p_seat_ids) with ordinality as u(id, ord)
    join public.seats s on s.id = u.id
    order by u.ord
    for update of s
  loop
    update public.seats
      set status = 'reserved',
          reserved_until = now() + interval '15 minutes',
          order_id = v_order_id
      where id = v_seat_id and status = 'available';

    if not found then raise exception 'seat unavailable: %', v_seat_id; end if;
  end loop;

  update public.orders set total_amount = v_total where id = v_order_id;

  return jsonb_build_object(
    'order_id', v_order_id,
    'total_amount', v_total,
    'status_token', (select status_token from public.orders where id = v_order_id)
  );
end;
$$;

revoke execute on function public.reserve_tickets(text, text, text, text, jsonb) from public, anon, authenticated;
revoke execute on function public.reserve_tickets(text, text, text, text, jsonb, uuid[]) from public, anon, authenticated;
grant execute on function public.reserve_tickets(text, text, text, text, jsonb, uuid[]) to service_role;
