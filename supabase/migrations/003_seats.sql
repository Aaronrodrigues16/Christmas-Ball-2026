create table if not exists public.seats (
  id uuid primary key default gen_random_uuid(),
  section text not null check (section in ('left','right')),
  row_no int not null,
  col_no int not null check (col_no between 1 and 8),
  tier_id uuid references public.ticket_tiers(id),
  status text not null default 'available' check (status in ('available','reserved','sold')),
  reserved_until timestamptz,
  order_id uuid references public.orders(id),
  unique (section, row_no, col_no)
);
create index if not exists idx_seats_status on public.seats(status);
create index if not exists idx_seats_tier on public.seats(tier_id);

create or replace function public.reserve_seats(p_seat_ids uuid[], p_lock_minutes int default 5)
returns jsonb language plpgsql security definer as $$
declare
  v_conflicts uuid[] := '{}';
  v_id uuid;
  v_row public.seats%rowtype;
begin
  -- release expired
  update public.seats set status='available', reserved_until=null, order_id=null
    where status='reserved' and reserved_until < now();
  foreach v_id in array p_seat_ids loop
    select * into v_row from public.seats where id=v_id for update;
    if not found then v_conflicts := array_append(v_conflicts, v_id); continue; end if;
    if v_row.status <> 'available' then v_conflicts := array_append(v_conflicts, v_id); continue; end if;
    update public.seats set status='reserved', reserved_until=now() + (p_lock_minutes||' minutes')::interval
      where id=v_id;
  end loop;
  return jsonb_build_object('reserved', (select coalesce(jsonb_agg(id), '[]'::jsonb) from public.seats where id = any(p_seat_ids) and status='reserved'),
                            'conflicts', to_jsonb(v_conflicts));
end; $$;
grant execute on function public.reserve_seats(uuid[], int) to anon, authenticated;