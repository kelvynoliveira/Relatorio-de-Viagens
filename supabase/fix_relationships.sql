-- Explicitly fix relationships and schema
-- Run this in Supabase SQL Editor

-- 1. Ensure trip_id column exists (if tables were created empty)
alter table food_entries add column if not exists trip_id uuid;
alter table other_entries add column if not exists trip_id uuid;

-- 2. Force recreate the Foreign Key constraints
-- This ensures the relationship is correctly defined for PostgREST
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

-- 3. Ensure RLS is enabled and policies exist (just in case)
alter table food_entries enable row level security;
alter table other_entries enable row level security;

drop policy if exists "Enable all access for all users" on food_entries;
create policy "Enable all access for all users" on food_entries for all using (true);

drop policy if exists "Enable all access for all users" on other_entries;
create policy "Enable all access for all users" on other_entries for all using (true);

-- 4. Reload PostgREST schema cache
-- This is critical for the client to "see" the new relationships immediately
NOTIFY pgrst, 'reload schema';
