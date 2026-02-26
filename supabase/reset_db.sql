-- DANGER: DATA WIPE SCRIPT
-- This script wipes all application data and resets the schema for Real Auth.

-- 1. Truncate Tables (Clean slate)
truncate table public.displacement_legs cascade;
truncate table public.fuel_entries cascade;
truncate table public.toll_entries cascade;
truncate table public.food_entries cascade;
truncate table public.other_entries cascade;
truncate table public.itinerary_items cascade;
truncate table public.campus_visits cascade;
truncate table public.trips cascade;
truncate table public.profiles cascade;

-- 2. Fix user_id in trips (Switch back to UUID with FK for Real Auth)
-- First drop the text column we made for mocks
alter table public.trips drop column if exists user_id;

-- Add the real column linked to auth.users
alter table public.trips 
add column user_id uuid references auth.users(id);

-- 3. Create Trigger for Profile Creation
-- This ensures that when a user is created in Auth, a Profile is created in Public
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, email, name, role)
  values (
    new.id, 
    new.email, 
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)), 
    'user'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
