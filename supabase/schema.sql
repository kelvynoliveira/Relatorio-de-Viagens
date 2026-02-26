-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Brands Table
create table brands (
  id text primary key, -- keeping text to match current mock IDs if needed, or use uuid
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Campuses Table
create table campuses (
  id text primary key,
  brand_id text references brands(id),
  name text not null,
  city text not null,
  state text not null,
  address text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Trips Table
create table trips (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  origin_city text not null,
  start_date timestamp with time zone not null,
  end_date timestamp with time zone not null,
  notes text,
  status text check (status in ('draft', 'in_progress', 'completed')) default 'draft',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Itinerary Items (many-to-many link between trips and campuses)
create table itinerary_items (
  trip_id uuid references trips(id) on delete cascade,
  campus_id text references campuses(id),
  item_order integer not null,
  primary key (trip_id, item_order)
);

-- Displacement Legs
create table displacement_legs (
  id uuid primary key default uuid_generate_v4(),
  trip_id uuid references trips(id) on delete cascade,
  origin text not null,
  destination text not null,
  transport_type text check (transport_type in ('car', 'airplane', 'bus', 'uber', 'other')),
  distance_km numeric,
  date timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Fuel Entries
create table fuel_entries (
  id uuid primary key default uuid_generate_v4(),
  trip_id uuid references trips(id) on delete cascade,
  date timestamp with time zone,
  liters numeric not null,
  price_paid numeric not null,
  price_per_liter numeric,
  location text,
  odometer numeric,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Toll Entries
create table toll_entries (
  id uuid primary key default uuid_generate_v4(),
  trip_id uuid references trips(id) on delete cascade,
  date timestamp with time zone,
  amount numeric not null,
  location text,
  name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Campus Visits (Atendimentos)
create table campus_visits (
  id uuid primary key default uuid_generate_v4(),
  trip_id uuid references trips(id) on delete cascade,
  campus_id text references campuses(id),
  status text check (status in ('pending', 'in_progress', 'done')) default 'pending',
  notes text,
  sessions jsonb default '[]'::jsonb, -- Array of {startAt, endAt}
  scope jsonb default '[]'::jsonb,    -- Array of {id, label, qty}
  photos jsonb default '[]'::jsonb,   -- Array of {url, description, tags...}
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS Policies (Open for now as requested "create everything", user can lock down later)
alter table brands enable row level security;
alter table campuses enable row level security;
alter table trips enable row level security;
alter table itinerary_items enable row level security;
alter table displacement_legs enable row level security;
alter table fuel_entries enable row level security;
alter table toll_entries enable row level security;
alter table campus_visits enable row level security;

create policy "Enable all access for all users" on brands for all using (true);
create policy "Enable all access for all users" on campuses for all using (true);
create policy "Enable all access for all users" on trips for all using (true);
create policy "Enable all access for all users" on itinerary_items for all using (true);
create policy "Enable all access for all users" on displacement_legs for all using (true);
create policy "Enable all access for all users" on fuel_entries for all using (true);
create policy "Enable all access for all users" on toll_entries for all using (true);
create policy "Enable all access for all users" on campus_visits for all using (true);
