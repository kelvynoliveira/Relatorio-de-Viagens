-- COMPREHENSIVE FIX for Expenses Tables
-- Run this entire script in Supabase SQL Editor

-- 1. Create Tables (IF NOT EXISTS is safe)
create table if not exists food_entries (
  id uuid primary key default uuid_generate_v4(),
  trip_id uuid references trips(id) on delete cascade,
  date timestamp with time zone,
  amount numeric not null default 0,
  location text,
  description text,
  photos jsonb default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists other_entries (
  id uuid primary key default uuid_generate_v4(),
  trip_id uuid references trips(id) on delete cascade,
  date timestamp with time zone,
  amount numeric not null default 0,
  description text,
  photos jsonb default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Add 'photos' column to existing tables (safely)
do $$ 
begin
  if not exists (select 1 from information_schema.columns where table_name = 'fuel_entries' and column_name = 'photos') then
    alter table fuel_entries add column photos jsonb default '[]'::jsonb;
  end if;
  
  if not exists (select 1 from information_schema.columns where table_name = 'toll_entries' and column_name = 'photos') then
    alter table toll_entries add column photos jsonb default '[]'::jsonb;
  end if;
end $$;

-- 3. Force Link Foreign Keys (Fixing relationships)
alter table food_entries drop constraint if exists food_entries_trip_id_fkey;
alter table food_entries add constraint food_entries_trip_id_fkey 
  foreign key (trip_id) 
  references trips(id) 
  on delete cascade;

alter table other_entries drop constraint if exists other_entries_trip_id_fkey;
alter table other_entries add constraint other_entries_trip_id_fkey 
  foreign key (trip_id) 
  references trips(id) 
  on delete cascade;

-- 4. Enable RLS and Policies
alter table food_entries enable row level security;
alter table other_entries enable row level security;

-- Drop existing policies to avoid "policy already exists" errors
drop policy if exists "Enable all access for all users" on food_entries;
drop policy if exists "Enable all access for all users" on other_entries;

create policy "Enable all access for all users" on food_entries for all using (true);
create policy "Enable all access for all users" on other_entries for all using (true);

-- 5. Reload Schema Cache
NOTIFY pgrst, 'reload schema';
