-- Create a table for global app settings (key-value store)
create table if not exists app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_by uuid references auth.users(id)
);

-- Enable RLS
alter table app_settings enable row level security;

-- Policy: Everyone can read settings
create policy "Allow public read access"
  on app_settings for select
  using (true);

-- Policy: Only authenticated users can update (or restrict to admins if needed, for now all auth users)
create policy "Allow authenticated update"
  on app_settings for insert
  with check (auth.role() = 'authenticated');

create policy "Allow authenticated update generic"
  on app_settings for update
  using (auth.role() = 'authenticated');

-- Create a storage bucket for 'branding' if it doesn't exist
-- Note: Buckets are usually created in the dashboard, but we can try inserting if the storage schema is accessible
insert into storage.buckets (id, name, public)
values ('branding', 'branding', true)
on conflict (id) do nothing;

-- Storage policies for 'branding'
create policy "Branding Images are publicly accessible"
  on storage.objects for select
  using ( bucket_id = 'branding' );

create policy "Authenticated users can upload branding"
  on storage.objects for insert
  with check ( bucket_id = 'branding' and auth.role() = 'authenticated' );

create policy "Authenticated users can update branding"
  on storage.objects for update
  using ( bucket_id = 'branding' and auth.role() = 'authenticated' );
