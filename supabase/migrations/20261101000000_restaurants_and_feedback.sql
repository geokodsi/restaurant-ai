-- RepAI: restaurants + feedback, with Row Level Security.
--
-- Phone numbers are stored normalized as E.164 ("+15551234567"): no
-- "whatsapp:" prefix, no spaces or dashes. The webhook normalizes Twilio's
-- "To" field the same way before looking a restaurant up.

create or replace function public.normalize_phone(raw text)
returns text
language sql
immutable
set search_path = ''
as $$
  select nullif(
    regexp_replace(replace(coalesce(raw, ''), 'whatsapp:', ''), '[^0-9+]', '', 'g'),
    ''
  );
$$;

-- ---------------------------------------------------------------------------
-- Tables
--
-- Written to be additive and idempotent: this project already had earlier
-- `restaurants` / `feedback` tables (referenced by guests, reviews and
-- campaigns), so existing tables are extended rather than recreated. On a
-- fresh database the CREATE TABLE statements build them from scratch.
-- ---------------------------------------------------------------------------

create table if not exists public.restaurants (
  id uuid primary key default gen_random_uuid(),
  name text not null default '',
  created_at timestamptz not null default now()
);

alter table public.restaurants
  add column if not exists user_id uuid references auth.users (id) on delete cascade,
  add column if not exists google_review_link text,
  add column if not exists twilio_number text;

create unique index if not exists restaurants_user_id_key
  on public.restaurants (user_id);
create unique index if not exists restaurants_twilio_number_key
  on public.restaurants (twilio_number);

create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid references public.restaurants (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.feedback
  add column if not exists customer_phone text,
  add column if not exists customer_message text,
  add column if not exists sentiment text,
  add column if not exists ai_reply text,
  add column if not exists review_link_sent boolean not null default false;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'feedback_sentiment_check'
  ) then
    alter table public.feedback
      add constraint feedback_sentiment_check
      check (sentiment in ('positive', 'negative'));
  end if;
end;
$$;

create index if not exists feedback_restaurant_created_idx
  on public.feedback (restaurant_id, created_at desc);

-- Keep stored numbers normalized no matter who writes them.
create or replace function public.restaurants_normalize_number()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.twilio_number := public.normalize_phone(new.twilio_number);
  return new;
end;
$$;

drop trigger if exists restaurants_normalize_number on public.restaurants;
create trigger restaurants_normalize_number
  before insert or update of twilio_number on public.restaurants
  for each row execute function public.restaurants_normalize_number();

-- ---------------------------------------------------------------------------
-- Row Level Security: a user only sees their own restaurant and its feedback.
-- The Twilio webhook writes feedback with the service-role key (bypasses RLS).
-- ---------------------------------------------------------------------------

alter table public.restaurants enable row level security;
alter table public.feedback enable row level security;

drop policy if exists "Users can view their restaurant" on public.restaurants;
create policy "Users can view their restaurant"
  on public.restaurants for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "Users can create their restaurant" on public.restaurants;
create policy "Users can create their restaurant"
  on public.restaurants for insert to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists "Users can update their restaurant" on public.restaurants;
create policy "Users can update their restaurant"
  on public.restaurants for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "Users can delete their restaurant" on public.restaurants;
create policy "Users can delete their restaurant"
  on public.restaurants for delete to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "Users can view their feedback" on public.feedback;
create policy "Users can view their feedback"
  on public.feedback for select to authenticated
  using (restaurant_id in (
    select id from public.restaurants where user_id = (select auth.uid())
  ));

drop policy if exists "Users can create their feedback" on public.feedback;
create policy "Users can create their feedback"
  on public.feedback for insert to authenticated
  with check (restaurant_id in (
    select id from public.restaurants where user_id = (select auth.uid())
  ));

drop policy if exists "Users can update their feedback" on public.feedback;
create policy "Users can update their feedback"
  on public.feedback for update to authenticated
  using (restaurant_id in (
    select id from public.restaurants where user_id = (select auth.uid())
  ))
  with check (restaurant_id in (
    select id from public.restaurants where user_id = (select auth.uid())
  ));

drop policy if exists "Users can delete their feedback" on public.feedback;
create policy "Users can delete their feedback"
  on public.feedback for delete to authenticated
  using (restaurant_id in (
    select id from public.restaurants where user_id = (select auth.uid())
  ));

revoke all on public.restaurants, public.feedback from anon;
grant select, insert, update, delete on public.restaurants, public.feedback to authenticated;
grant all on public.restaurants, public.feedback to service_role;

-- ---------------------------------------------------------------------------
-- Signup: create the restaurant row from the metadata passed to
-- supabase.auth.signUp(). Runs in the database, so it works whether or not
-- email confirmation is enabled (there may be no session yet at signup).
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
begin
  if coalesce(meta ->> 'restaurant_name', '') = '' then
    return new;
  end if;

  begin
    insert into public.restaurants (user_id, name, google_review_link, twilio_number)
    values (
      new.id,
      meta ->> 'restaurant_name',
      nullif(meta ->> 'google_review_link', ''),
      meta ->> 'twilio_number'
    );
  exception when unique_violation then
    -- Number already claimed: still create the account; the owner can set
    -- the number later in Settings.
    insert into public.restaurants (user_id, name, google_review_link)
    values (
      new.id,
      meta ->> 'restaurant_name',
      nullif(meta ->> 'google_review_link', '')
    )
    on conflict (user_id) do nothing;
  end;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Lets the signup and settings forms check a number before saving, without
-- exposing other restaurants' rows.
create or replace function public.is_twilio_number_available(number text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select not exists (
    select 1 from public.restaurants r
    where r.twilio_number = public.normalize_phone(number)
      and r.user_id is distinct from auth.uid()
  );
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.is_twilio_number_available(text) from public;
grant execute on function public.is_twilio_number_available(text) to anon, authenticated;
