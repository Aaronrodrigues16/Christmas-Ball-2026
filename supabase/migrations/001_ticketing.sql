-- Hardened ticketing schema for OCB (Supabase/Postgres)
create extension if not exists pgcrypto;

create table if not exists public.ticket_tiers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price_inr integer not null check (price_inr >= 0),
  total_quota integer not null check (total_quota >= 0),
  sold_count integer not null default 0 check (sold_count >= 0 and sold_count <= total_quota),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  dietary_pref text,
  total_amount integer not null check (total_amount >= 0),
  cashfree_order_id text unique,
  status text not null default 'PENDING' check (status in ('PENDING','PAID','FAILED','CANCELLED','EXPIRED')),
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  tier_id uuid not null references public.ticket_tiers(id),
  quantity integer not null check (quantity > 0),
  unit_price integer not null check (unit_price >= 0)
);

create table if not exists public.tickets (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  tier_id uuid not null references public.ticket_tiers(id),
  qr_token uuid not null unique default gen_random_uuid(),
  checked_in boolean not null default false,
  checked_in_at timestamptz
);

create table if not exists public.app_settings (
  key text primary key,
  value text not null
);

create index if not exists idx_orders_cashfree_order_id on public.orders(cashfree_order_id);
create index if not exists idx_orders_status_created on public.orders(status, created_at);
create index if not exists idx_tickets_qr_token on public.tickets(qr_token);
create index if not exists idx_tickets_order_id on public.tickets(order_id);

-- Auto-release PENDING orders older than 15 min: mark EXPIRED and decrement tier sold_count.
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

-- Atomic stock reservation (releases expired first), locks tiers, validates, creates PENDING order+items, increments sold_count.
-- items jsonb: [{"tier_id":"<uuid>","quantity":2}, ...]
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

  update public.orders set total_amount = v_total where id = v_order_id;
  return jsonb_build_object('order_id', v_order_id, 'total_amount', v_total);
end;
$$;

create or replace function public.verify_scanner_pin(p_pin text)
returns boolean
language sql
security definer
stable
as $$
  select exists(select 1 from public.app_settings where key = 'scanner_pin' and value = p_pin);
$$;

-- Scanner RPC: validates PIN, checks ticket, marks checked-in atomically, returns attendee/tier/dietary.
create or replace function public.scan_ticket(p_pin text, p_qr_token text)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_ticket record;
  v_name text;
  v_dietary text;
  v_tier text;
begin
  if not public.verify_scanner_pin(p_pin) then
    return jsonb_build_object('ok', false, 'error', 'invalid_pin');
  end if;

  select t.id, t.checked_in, t.checked_in_at, t.order_id, t.tier_id
    into v_ticket
  from public.tickets t
  where t.qr_token = p_qr_token::uuid
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'not_found');
  end if;
  if v_ticket.checked_in then
    return jsonb_build_object('ok', false, 'error', 'already_checked_in', 'checked_in_at', v_ticket.checked_in_at);
  end if;

  update public.tickets
    set checked_in = true, checked_in_at = now()
    where id = v_ticket.id and checked_in = false;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'already_checked_in');
  end if;

  select o.customer_name, o.dietary_pref, tt.name
    into v_name, v_dietary, v_tier
  from public.orders o
  join public.ticket_tiers tt on tt.id = v_ticket.tier_id
  where o.id = v_ticket.order_id;

  return jsonb_build_object('ok', true, 'name', v_name, 'tier', v_tier, 'dietary', v_dietary, 'checked_in_at', now());
exception when others then
  return jsonb_build_object('ok', false, 'error', 'invalid_token');
end;
$$;

-- RLS hardening
alter table public.ticket_tiers enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.tickets enable row level security;
alter table public.app_settings enable row level security;

drop policy if exists anon_select_active_tiers on public.ticket_tiers;
create policy anon_select_active_tiers on public.ticket_tiers
  for select to anon using (active = true);

grant usage on schema public to anon, authenticated;
grant execute on function public.reserve_tickets(text,text,text,text,jsonb) to anon, authenticated;
grant execute on function public.verify_scanner_pin(text) to anon, authenticated;
grant execute on function public.scan_ticket(text,text) to anon, authenticated;
grant execute on function public.release_expired_reservations() to anon, authenticated;

-- Optional seed (edit/remove in prod)
-- insert into public.ticket_tiers (name, price_inr, total_quota) values ('Regular Ticket',1500,200),('Reduced Ticket',1000,50);
-- insert into public.app_settings (key,value) values ('scanner_pin','YOUR_PIN') on conflict (key) do update set value=excluded.value;
