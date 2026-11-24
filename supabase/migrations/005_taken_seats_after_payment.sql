-- Seat fulfillment: seats are held at order creation and become TAKEN only
-- after Razorpay payment is verified (client callback or webhook).

-- Allow the explicit 'taken' status requested by the UI while keeping the
-- legacy 'sold' value readable.
do $$
declare
  constraint_row record;
begin
  for constraint_row in
    select conname
    from pg_constraint
    where conrelid = 'public.seats'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%status%'
  loop
    execute format('alter table public.seats drop constraint %I', constraint_row.conname);
  end loop;
end $$;

alter table public.seats
  add constraint seats_status_check
  check (status in ('available', 'reserved', 'sold', 'taken'));

-- Public, read-only seat mapping. Security definer lets the service role read
-- seats even where direct table grants are missing.
create or replace function public.get_seat_map()
returns table (id uuid, public_id text, status text)
language sql
security definer
stable
as $$
  select
    s.id,
    'T' || lpad(((case when s.section = 'left' then s.row_no else s.row_no + 50 end))::text, 2, '0')
      || '-' || chr(64 + s.col_no),
    s.status
  from public.seats s;
$$;

revoke all on function public.get_seat_map() from public, anon, authenticated;
grant execute on function public.get_seat_map() to service_role;

-- Expired PENDING orders must also release their held seats.
create or replace function public.release_expired_reservations()
returns integer
language plpgsql
security definer
as $$
declare
  v_count integer := 0;
  r record;
begin
  for r in
    select id from public.orders
    where status = 'PENDING' and created_at < now() - interval '15 minutes'
    for update skip locked
  loop
    update public.seats
      set status = 'available', reserved_until = null, order_id = null
      where order_id = r.id and status in ('reserved', 'sold', 'taken');

    update public.ticket_tiers tt
      set sold_count = greatest(0, tt.sold_count - oi.qty)
      from (
        select tier_id, sum(quantity)::int as qty
        from public.order_items where order_id = r.id
        group by tier_id
      ) oi
      where tt.id = oi.tier_id;

    update public.orders set status = 'EXPIRED' where id = r.id and status = 'PENDING';
    if found then v_count := v_count + 1; end if;
  end loop;
  return v_count;
end;
$$;

revoke all on function public.release_expired_reservations() from public, anon, authenticated;
grant execute on function public.release_expired_reservations() to service_role;

-- Atomic payment fulfillment. Every successful path marks the order's seats TAKEN.
create or replace function public.fulfill_razorpay_payment(
  p_event_id text,
  p_order_id uuid,
  p_payment_id text,
  p_amount_paise integer,
  p_currency text
) returns jsonb
language plpgsql
security definer
as $$
declare
  v_order public.orders%rowtype;
  v_item record;
  v_i integer;
  v_ticket jsonb;
  v_tickets jsonb := '[]'::jsonb;
begin
  -- A unique violation means this event was already processed.
  insert into public.processed_webhook_events (event_id, event_type, order_id, payment_id)
  values (p_event_id, 'payment.captured', p_order_id, p_payment_id);

  select * into v_order from public.orders where id = p_order_id for update;
  if not found then raise exception 'order_not_found'; end if;

  if v_order.status = 'PAID' then
    update public.seats
      set status = 'taken', reserved_until = null
      where order_id = p_order_id and status in ('reserved', 'sold', 'taken');
    return jsonb_build_object('ok', true, 'duplicate', true, 'tickets', '[]'::jsonb);
  end if;

  if v_order.status <> 'PENDING' then
    raise exception 'order_not_pending (%)', v_order.status;
  end if;

  if upper(coalesce(p_currency, '')) <> 'INR' then
    raise exception 'currency_mismatch';
  end if;

  if p_amount_paise is null or p_amount_paise <> v_order.total_amount * 100 then
    raise exception 'amount_mismatch';
  end if;

  update public.orders
    set status = 'PAID',
        paid_at = now(),
        razorpay_payment_id = p_payment_id,
        payment_amount_paise = p_amount_paise
    where id = p_order_id;

  update public.seats
    set status = 'taken', reserved_until = null
    where order_id = p_order_id and status in ('reserved', 'sold', 'taken');

  for v_item in select tier_id, quantity from public.order_items where order_id = p_order_id loop
    for v_i in 1..v_item.quantity loop
      insert into public.tickets (order_id, tier_id) values (p_order_id, v_item.tier_id)
      returning jsonb_build_object('id', id, 'qr_token', qr_token, 'tier_id', tier_id) into v_ticket;
      v_tickets := v_tickets || jsonb_build_array(v_ticket);
    end loop;
  end loop;

  return jsonb_build_object('ok', true, 'duplicate', false, 'tickets', v_tickets);
end;
$$;

revoke all on function public.fulfill_razorpay_payment(text, uuid, text, integer, text) from public, anon, authenticated;
grant execute on function public.fulfill_razorpay_payment(text, uuid, text, integer, text) to service_role;
