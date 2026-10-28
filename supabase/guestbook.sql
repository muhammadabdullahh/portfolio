-- Guestbook table for the portfolio chat. Run once in the Supabase SQL editor (free tier is enough).
create table if not exists public.guestbook (
  id bigint generated always as identity primary key,
  name text not null default 'Visitor' check (char_length(name) between 1 and 24),
  message text not null check (char_length(message) between 1 and 160),
  created_at timestamptz not null default now()
);

alter table public.guestbook enable row level security;

-- Anyone can read messages.
create policy "guestbook read" on public.guestbook for select using (true);

-- Anyone can add a message, but cannot edit or delete (moderate from the dashboard).
create policy "guestbook insert" on public.guestbook for insert with check (
  char_length(message) between 1 and 160
  and message !~* '(https?://|www\.)'   -- no links, keeps spam out
);

-- Simple flood control: at most 20 messages per minute across the whole table.
create or replace function public.guestbook_rate_limit() returns trigger language plpgsql as $$
begin
  if (select count(*) from public.guestbook where created_at > now() - interval '1 minute') >= 20 then
    raise exception 'rate limited' using errcode = 'P0001';
  end if;
  return new;
end $$;

drop trigger if exists guestbook_rate_limit on public.guestbook;
create trigger guestbook_rate_limit before insert on public.guestbook
  for each row execute function public.guestbook_rate_limit();
