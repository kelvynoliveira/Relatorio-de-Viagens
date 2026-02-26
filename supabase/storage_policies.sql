-- Allow public uploads to trip-photos bucket
-- WARNING: This allows anyone to upload. For production, add authentication checks.

-- 1. Create the bucket if it doesn't exist (idempotent)
insert into storage.buckets (id, name, public)
values ('trip-photos', 'trip-photos', true)
on conflict (id) do nothing;

-- 2. Drop existing policies to avoid conflicts
drop policy if exists "Public Access" on storage.objects;
drop policy if exists "Public Upload" on storage.objects;
drop policy if exists "Give me access" on storage.objects;

-- 3. Create Policy for SELECT (View/Download)
create policy "Public Access"
on storage.objects for select
using ( bucket_id = 'trip-photos' );

-- 4. Create Policy for INSERT (Upload)
create policy "Public Upload"
on storage.objects for insert
with check ( bucket_id = 'trip-photos' );

-- 5. Create Policy for UPDATE/DELETE (Optional, if you want users to delete their photos)
create policy "Public Update/Delete"
on storage.objects for all
using ( bucket_id = 'trip-photos' );
