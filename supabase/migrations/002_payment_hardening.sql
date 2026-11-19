-- Payment hardening for Razorpay.
-- Apply this AFTER 001_ticketing.sql. Runs in Supabase SQL editor.
-- It is safe to re-run.

alter table public.orders
  add column if not exists razorpay_payment_id text unique,
  add column if not exists payment_amount_paise integer,
  add column if not exists status_token text unique default encode(gen_random_bytes(24), 'hex'),
  add column if not exists tickets_email_sent_at timestamptz;

update public.orders set status_token = encode(gen_random_bytes(24), 'hex') where status_token is null;

create index if not exists idx_orders_razorpay_order_id on public.orders(razorpay_order_id);
create index if not exists idx_orders_status_token on public.orders(status_token);

-- 2) Idempotency ledger. One row per Razorpay webhook event ID.
create table if not exists public.processed_webhook_events (
  event_id text primary key,
  event_type text not null,
  order_id uuid,
  payment_id text,
  processed_at timestamptz not null default now()
);

alter table public.processed_webhook_events enable row level security;

-- 3) Atomic fulfilment: claim the event, lock the order, verify amount/currency,
--    mark PAID and issue tickets in a single transaction. No anon access.
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
  -- A unique violation here means this event was already processed.
  insert into public.processed_webhook_events (event_id, event_type, order_id, payment_id)
  values (p_event_id, 'payment.captured', p_order_id, p_payment_id);

  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'order_not_found';
  end if;

  if v_order.status = 'PAID' then
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

-- 4) Server-side per-tier cap (frontend cap is not a security control).
create or replace function public.reserve_tickets(
  p_name text,
  p_email text,
  p_phone text,
  p_dietary text,
  p_items jsonb
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
begin
  perform public.release_expired_reservations();

  if p_name is null or btrim(p_name) = '' then raise exception 'name required'; end if;
  if p_email is null or position('@' in p_email) = 0 then raise exception 'valid email required'; end if;
  if p_phone is null or p_phone !~ '^(\+91)?[6-9][0-9]{9}$' then raise exception 'valid +91 phone required'; end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'items required';
  end if;
  if jsonb_array_length(p_items) > 10 then raise exception 'too many items'; end if;

  insert into public.orders (customer_name, customer_email, customer_phone, dietary_pref, total_amount, status)
  values (btrim(p_name), lower(btrim(p_email)), regexp_replace(p_phone, '\s+', '', 'g'), nullif(btrim(coalesce(p_dietary,'')),''), 0, 'PENDING')
  returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_tier_id := (v_item->>'tier_id')::uuid;
    v_qty := (v_item->>'quantity')::integer;
    if v_qty is null or v_qty <= 0 or v_qty > 4 then raise exception 'quantity must be between 1 and 4'; end if;

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

  if v_total <= 0 then raise exception 'invalid order amount'; end if;

  update public.orders set total_amount = v_total where id = v_order_id;
  return jsonb_build_object('order_id', v_order_id, 'total_amount', v_total, 'status_token',
    (select status_token from public.orders where id = v_order_id));
end;
$$;

-- 5) Anon callers should not be able to expire other people's reservations.
--    reserve_tickets calls it with definer rights, so normal checkout still works.
revoke execute on function public.release_expired_reservations() from anon, authenticated;

-- 6) The service role needs direct table access for the serverless API.
--    Some Supabase projects (notably ones created with sb_secret_ API keys)
--    do not get default grants on tables created by migrations. Without this,
--    every .from() call in /api/* fails with 42501 "permission denied".
grant usage on schema public to service_role;
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant execute on all functions in schema public to service_role;
