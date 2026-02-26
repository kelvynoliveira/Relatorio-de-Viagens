-- Create profiles table (safe if exists)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text unique not null,
  name text,
  role text check (role in ('admin', 'user')) default 'user',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS (safe to run multiple times)
alter table public.profiles enable row level security;

-- Policies for profiles (drop to recreate safely)
drop policy if exists "Public profiles are viewable by everyone." on profiles;
create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

drop policy if exists "Users can insert their own profile." on profiles;
create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

drop policy if exists "Users can update own profile." on profiles;
create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- Fix user_id in trips (Force it to be TEXT for mock auth)
-- First remove if it exists as UUID or text (to ensure clean slate)
-- NOTE: This clears user_id data. For dev/demo this is acceptable.
do $$ 
begin
    if exists (select 1 from information_schema.columns where table_name = 'trips' and column_name = 'user_id') then
        alter table public.trips drop column user_id;
    end if;
end $$;

alter table public.trips add column user_id text;
