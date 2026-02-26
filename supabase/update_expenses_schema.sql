-- 1. Add "photos" column to existing expense tables (Fuel, Toll)
alter table fuel_entries add column if not exists photos jsonb default '[]'::jsonb;
alter table toll_entries add column if not exists photos jsonb default '[]'::jsonb;

-- 2. Create "food_entries" table
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

-- 3. Create "other_entries" table
create table if not exists other_entries (
  id uuid primary key default uuid_generate_v4(),
  trip_id uuid references trips(id) on delete cascade,
  date timestamp with time zone,
  amount numeric not null default 0,
  description text,
  photos jsonb default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Enable RLS and add basic policies
alter table food_entries enable row level security;
alter table other_entries enable row level security;

create policy "Enable all access for all users" on food_entries for all using (true);
create policy "Enable all access for all users" on other_entries for all using (true);
