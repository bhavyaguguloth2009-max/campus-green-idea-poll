-- Campus Green Ideas Board
-- Run this entire file in the Supabase Dashboard -> SQL Editor.
create extension if not exists pgcrypto;

create table if not exists public.ideas (
  id uuid primary key default gen_random_uuid(),
  title varchar(90) not null check (char_length(trim(title)) between 1 and 90),
  description varchar(700) not null check (char_length(trim(description)) between 15 and 700),
  category text not null check (category in ('Waste', 'Energy', 'Water', 'Green Spaces', 'Transport')),
  author_name varchar(50) not null check (char_length(trim(author_name)) between 1 and 50),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  vote_count integer not null default 0 check (vote_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ideas_status_created_at_idx
  on public.ideas (status, created_at desc);
create index if not exists ideas_category_status_idx
  on public.ideas (category, status);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists ideas_set_updated_at on public.ideas;
create trigger ideas_set_updated_at
before update on public.ideas
for each row execute function public.set_updated_at();

-- Atomic increment prevents simultaneous votes from overwriting one another.
create or replace function public.increment_idea_vote(idea_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare updated_count integer;
begin
  update public.ideas
  set vote_count = vote_count + 1
  where id = idea_id and status = 'approved'
  returning vote_count into updated_count;

  if updated_count is null then
    raise exception 'Idea not found or not approved';
  end if;
  return updated_count;
end;
$$;

-- This application connects to Supabase from the Express server using a secret
-- service-role key. Never expose that key in browser code.
-- Enable RLS as a safety barrier for direct client access. The backend's
-- service-role key bypasses RLS, so API validation is still essential.
alter table public.ideas enable row level security;

-- No public policies are intentionally created. All database access for this
-- MVP goes through the Express API. The service-role key must remain private.
revoke all on table public.ideas from anon, authenticated;
revoke all on function public.increment_idea_vote(uuid) from public, anon, authenticated;
grant execute on function public.increment_idea_vote(uuid) to service_role;
