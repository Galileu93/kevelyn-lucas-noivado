begin;
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
create table private.admin_users(user_id uuid primary key references auth.users(id) on delete cascade);
create function public.is_admin() returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from private.admin_users where user_id=auth.uid());
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

create table public.gifts(
 id text primary key,
 title text not null check(char_length(title) between 1 and 1000),
 image_url text,
 shop_url text not null check(shop_url like 'https://shop.tiktok.com/br/pdp/%'),
 status text not null default 'available' check(status in ('available','claimed')),
 created_at timestamptz not null default now()
);
create table public.gift_claims(
 id uuid primary key default gen_random_uuid(),
 gift_id text not null unique references public.gifts(id),
 request_id uuid not null unique,
 guest_name text not null check(char_length(trim(guest_name)) between 3 and 150),
 guest_family text not null default '' check(char_length(guest_family)<=200),
 created_at timestamptz not null default now()
);
create table public.rsvps(
 id uuid primary key default gen_random_uuid(),
 request_id uuid not null unique,
 full_name text not null check(char_length(trim(full_name)) between 3 and 150),
 family text not null default '' check(char_length(family)<=200),
 guest_count integer not null check(guest_count between 1 and 30),
 attendance boolean not null,
 message text not null default '' check(char_length(message)<=1000),
 created_at timestamptz not null default now()
);
alter table public.gifts enable row level security;
alter table public.gift_claims enable row level security;
alter table public.rsvps enable row level security;
revoke all on public.gifts,public.gift_claims,public.rsvps from public,anon,authenticated;
grant select on public.gifts to anon,authenticated;
grant select on public.gift_claims,public.rsvps to authenticated;
create policy gifts_read on public.gifts for select to anon,authenticated using(true);
create policy claims_admin on public.gift_claims for select to authenticated using((select public.is_admin()));
create policy rsvp_admin on public.rsvps for select to authenticated using((select public.is_admin()));

create function public.reserve_gift(p_gift_id text,p_guest_name text,p_guest_family text,p_request_id uuid)
returns text language plpgsql security definer set search_path='' as $$
declare v_status text;
begin
 if p_request_id is null or p_guest_name is null or char_length(trim(p_guest_name)) not between 3 and 150 or char_length(coalesce(p_guest_family,''))>200 then raise exception 'INVALID_INPUT'; end if;
 -- Serializes all reservations and releases for this gift; UNIQUE is the second guard.
 select status into v_status from public.gifts where id=p_gift_id for update;
 if not found then raise exception 'GIFT_NOT_FOUND'; end if;
 if exists(select 1 from public.gift_claims where gift_id=p_gift_id and request_id=p_request_id) then return 'reserved'; end if;
 if v_status='claimed' then return 'already_claimed'; end if;
 insert into public.gift_claims(gift_id,request_id,guest_name,guest_family) values(p_gift_id,p_request_id,trim(p_guest_name),trim(coalesce(p_guest_family,'')));
 update public.gifts set status='claimed' where id=p_gift_id;
 return 'reserved';
end; $$;
revoke all on function public.reserve_gift(text,text,text,uuid) from public;
grant execute on function public.reserve_gift(text,text,text,uuid) to anon,authenticated;

create function public.submit_rsvp(p_full_name text,p_family text,p_guest_count integer,p_attendance boolean,p_message text,p_request_id uuid)
returns text language plpgsql security definer set search_path='' as $$
begin
 if p_request_id is null or p_full_name is null or char_length(trim(p_full_name)) not between 3 and 150 or char_length(coalesce(p_family,''))>200 or p_guest_count is null or p_guest_count not between 1 and 30 or p_attendance is null or char_length(coalesce(p_message,''))>1000 then raise exception 'INVALID_INPUT'; end if;
 insert into public.rsvps(request_id,full_name,family,guest_count,attendance,message)
 values(p_request_id,trim(p_full_name),trim(coalesce(p_family,'')),p_guest_count,p_attendance,trim(coalesce(p_message,''))) on conflict(request_id) do nothing;
 return 'received';
end; $$;
revoke all on function public.submit_rsvp(text,text,integer,boolean,text,uuid) from public;
grant execute on function public.submit_rsvp(text,text,integer,boolean,text,uuid) to anon,authenticated;

create function public.release_gift(p_gift_id text) returns void language plpgsql security definer set search_path='' as $$
begin
 if not public.is_admin() then raise exception 'FORBIDDEN' using errcode='42501'; end if;
 perform 1 from public.gifts where id=p_gift_id for update;
 if not found then raise exception 'GIFT_NOT_FOUND'; end if;
 delete from public.gift_claims where gift_id=p_gift_id;
 update public.gifts set status='available' where id=p_gift_id;
end; $$;
revoke all on function public.release_gift(text) from public;
grant execute on function public.release_gift(text) to authenticated;
commit;
