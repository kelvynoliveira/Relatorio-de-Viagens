-- Create Mobility Entries Table (if not exists)
create table if not exists mobility_entries (
  id uuid primary key default uuid_generate_v4(),
  trip_id uuid references trips(id) on delete cascade,
  date timestamp with time zone,
  amount numeric not null default 0,
  transport_type text default 'uber',
  origin text,
  destination text,
  location text,
  description text,
  photos jsonb default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Ensure origin and destination columns exist (in case table was created previously without them)
do $$ 
begin 
    if not exists (select 1 from information_schema.columns where table_name='mobility_entries' and column_name='origin') then
        alter table mobility_entries add column origin text;
    end if;

    if not exists (select 1 from information_schema.columns where table_name='mobility_entries' and column_name='destination') then
        alter table mobility_entries add column destination text;
    end if;

    if not exists (select 1 from information_schema.columns where table_name='mobility_entries' and column_name='transport_type') then
        alter table mobility_entries add column transport_type text default 'uber';
    end if;
end $$;

-- Enable RLS
alter table mobility_entries enable row level security;

-- Add Policy
drop policy if exists "Enable all access for all users" on mobility_entries;
create policy "Enable all access for all users" on mobility_entries for all using (true);

-- Reload Schema Cache
NOTIFY pgrst, 'reload schema';
