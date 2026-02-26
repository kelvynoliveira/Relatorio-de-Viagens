-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- --- TABLES ---

-- 1. Brands
create table if not exists brands (
  id text primary key,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Campuses
create table if not exists campuses (
  id text primary key,
  brand_id text references brands(id),
  name text not null,
  city text not null,
  state text not null,
  address text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Trips
create table if not exists trips (
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

-- 4. Itinerary Items
create table if not exists itinerary_items (
  trip_id uuid references trips(id) on delete cascade,
  campus_id text references campuses(id),
  item_order integer not null,
  primary key (trip_id, item_order)
);

-- 5. Displacement Legs
create table if not exists displacement_legs (
  id uuid primary key default uuid_generate_v4(),
  trip_id uuid references trips(id) on delete cascade,
  origin text not null,
  destination text not null,
  transport_type text check (transport_type in ('car', 'airplane', 'bus', 'uber', 'other')),
  distance_km numeric,
  date timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. Fuel Entries
create table if not exists fuel_entries (
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

-- 7. Toll Entries
create table if not exists toll_entries (
  id uuid primary key default uuid_generate_v4(),
  trip_id uuid references trips(id) on delete cascade,
  date timestamp with time zone,
  amount numeric not null,
  location text,
  name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8. Campus Visits
create table if not exists campus_visits (
  id uuid primary key default uuid_generate_v4(),
  trip_id uuid references trips(id) on delete cascade,
  campus_id text references campuses(id),
  status text check (status in ('pending', 'in_progress', 'done')) default 'pending',
  notes text,
  sessions jsonb default '[]'::jsonb,
  scope jsonb default '[]'::jsonb,
  photos jsonb default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- --- RLS POLICIES ---

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

-- --- SEED DATA ---

-- Seed Brands
insert into brands (id, name) values
('b1', 'AGES'),
('b2', 'UNA'),
('b3', 'UNIFACS'),
('b4', 'USJT'),
('b5', 'Unimonte'),
('b6', 'UniSociesc'),
('b7', 'SOCIESC'),
('b8', 'UNISUL'),
('b9', 'UNIFG'),
('b10', 'UNIBH'),
('b11', 'HSM'),
('b12', 'COMMUNITY'),
('b13', 'UNP'),
('b14', 'FPB'),
('b15', 'UNICURITIBA'),
('b16', 'UAM'),
('b17', 'FASEH'),
('b18', 'FG'),
('b19', 'GCP'),
('b20', 'UNIRITTER'),
('b21', 'FADERGS'),
('b22', 'IBMR'),
('b23', 'AZURE'),
('b24', 'MILTON CAMPOS'),
('b25', 'LE CORDON BLEU'),
('b26', 'DC UNP')
on conflict (id) do nothing;

-- Seed Campuses
insert into campuses (id, brand_id, name, city, state, address) values
('c1',  'b7',  'SÃO BENTO DO SUL', '', '', ''),
('c2',  'b8',  'RIO BRANCO', '', '', ''),
('c3',  'b4',  'CUBATAO', '', '', ''),
('c4',  'b7',  'ANITA', '', '', ''),
('c5',  'b12', 'ACADEMY', '', '', ''),
('c6',  'b3',  'CPB', '', '', ''),
('c7',  'b10', 'ESTORIL', '', '', ''),
('c8',  'b11', 'HSM PAULISTA', '', '', ''),
('c9',  'b7',  'CAMPUS PARK', '', '', ''),
('c10', 'b2',  'AIMORES', '', '', ''),
('c11', 'b9',  'BRUMADO', '', '', ''),
('c12', 'b25', 'LE CORDON BLEU', '', '', ''),
('c13', 'b24', 'MILTON CAMPOS', '', '', ''),
('c14', 'b2',  'DIVINOPOLIS', '', '', ''),
('c15', 'b2',  'CENTER MINAS', '', '', ''),
('c16', 'b2',  'POUSO ALEGRE', '', '', ''),
('c17', 'b2',  'CONTAGEM', '', '', ''),
('c18', 'b2',  'POUSO ALEGRE', '', '', ''),
('c19', 'b2',  'TUCURUI', '', '', ''),
('c20', 'b2',  'SETE LAGOAS', '', '', ''),
('c21', 'b2',  'LINHA VERDE', '', '', ''),
('c22', 'b2',  'LIBERDADE', '', '', ''),
('c23', 'b2',  'BARREIRO', '', '', ''),
('c24', 'b4',  'VILA MATHIAS', '', '', ''),
('c25', 'b2',  'CATALAO', '', '', ''),
('c26', 'b2',  'BETIM', '', '', ''),
('c27', 'b7',  'BLUMENAU', '', '', ''),
('c28', 'b4',  'JABAQUARA', '', '', ''),
('c29', 'b2',  'BOM DESPACHO', '', '', ''),
('c30', 'b4',  'MOOCA', '', '', ''),
('c31', null,  'BLOCO ENLACE E ROTEAMENTO', '', '', ''),
('c32', 'b2',  'ITABIRA', '', '', ''),
('c33', 'b2',  'KARAIBA', '', '', ''),
('c34', 'b2',  'JATAI', '', '', ''),
('c35', 'b8',  'ITAJAI', '', '', ''),
('c36', 'b4',  'SANTO AMARO', '', '', ''),
('c37', 'b4',  'PAULISTA', '', '', ''),
('c38', 'b7',  'JARAGUA', '', '', ''),
('c39', 'b14', 'JOAO PESSOA', '', '', ''),
('c40', 'b4',  'BUTANTA', '', '', ''),
('c41', 'b2',  'CONSELHEIRO LAFAIETE', '', '', ''),
('c42', 'b8',  'FLORIANOPOLIS CONTINENTE', '', '', ''),
('c43', 'b4',  'GUARULHOS', '', '', ''),
('c44', 'b4',  'SÃO BERNANDO DO CAMPO', '', '', ''),
('c45', 'b4',  'VILA MADALENA', '', '', ''),
('c46', 'b4',  'SANTANA', '', '', ''),
('c47', 'b2',  'ITUMBIARA', '', '', ''),
('c48', 'b15', 'REBOUÇAS', '', '', ''),
('c49', 'b16', 'CENTER3', '', '', ''),
('c50', 'b16', 'PIRACICABA', '', '', ''),
('c51', 'b16', 'CENTRO', '', '', ''),
('c52', 'b16', 'PAULISTA', '', '', ''),
('c53', 'b16', 'SJC', '', '', ''),
('c54', 'b16', 'SJC CIS', '', '', ''),
('c55', 'b1',  'PARIPIRANGA', '', '', ''),
('c56', 'b1',  'SENHOR DO BONFIM', '', '', ''),
('c57', 'b1',  'JACOBINA', '', '', ''),
('c58', 'b1',  'IRECE', '', '', ''),
('c59', 'b17', 'VESPASIANO', '', '', ''),
('c60', 'b8',  'BRACO DO NORTE', '', '', ''),
('c61', 'b8',  'ARARANGUA', '', '', ''),
('c62', 'b8',  'DIBMUSSI', '', '', ''),
('c63', 'b8',  'TUBARAO', '', '', ''),
('c64', 'b8',  'PEDRA BRANCA', '', '', ''),
('c65', 'b8',  'PEDRA BRANCA WIFI', '', '', ''),
('c66', 'b8',  'PEDRA BRANCA DC', '', '', ''),
('c67', 'b8',  'CRICIUMA', '', '', ''),
('c68', 'b1',  'CIS JACOBINA', '', '', ''),
('c69', 'b9',  'GUANAMBI', '', '', ''),
('c70', 'b9',  'VASCO', '', '', ''),
('c71', 'b16', 'BLOCO LEGADO', '', '', ''),
('c72', 'b18', 'PIEDADE', '', '', ''),
('c73', 'b13', 'SALGADO', '', '', ''),
('c74', 'b13', 'ZONA NORTE', '', '', ''),
('c75', 'b13', 'MOSSORO', '', '', ''),
('c76', 'b19', 'GCP', '', '', ''),
('c77', 'b26', 'DC UNP', '', '', ''),
('c78', 'b20', 'BLOCO LEGADO', '', '', ''),
('c79', 'b21', 'GALERIA LUZA', '', '', ''),
('c80', 'b11', 'LEARNING VILLAGE', '', '', ''),
('c81', 'b20', 'ZONA SUL', '', '', ''),
('c82', 'b20', 'CANOAS', '', '', ''),
('c83', 'b20', 'FAPA', '', '', ''),
('c84', 'b22', 'BOTAFOGO', '', '', ''),
('c85', 'b22', 'CATETE', '', '', ''),
('c86', 'b22', 'BARRA', '', '', ''),
('c87', 'b23', 'AZURE', '', '', ''),
('c88', 'b3',  'LAPA', '', '', ''),
('c89', 'b3',  'SANTA MONICA', '', '', ''),
('c90', 'b3',  'CTN', '', '', ''),
('c91', 'b18', 'BOA VISTA', '', '', ''),
('c92', 'b1',  'JACOBINA CIS', '', '', ''),
('c93', 'b16', 'CIS PIRACICABA', '', '', ''),
('c94', 'b8',  'TUBARAO HOSPITAL', '', '', ''),
('c95', 'b3',  'CAJAZEIRAS', '', '', ''),
('c96', 'b8',  'AMBULATORIO', '', '', ''),
('c97', 'b3',  'IGUATEMI', '', '', ''),
('c98', 'b1',  'SENHOR DO BONFIM ODONTO', '', '', ''),
('c99',  'b16', 'MANAUS', '', '', ''),
('c100', 'b16', 'SANTANA DO PARNAIBA', '', '', ''),
('c101', 'b16', 'SANTANA', '', '', ''),
('c102', 'b17', 'VESPASIANO NPJ', '', '', ''),
('c103', 'b2',  'BOM DESPACHO CLINICA', '', '', '')
on conflict (id) do nothing;
