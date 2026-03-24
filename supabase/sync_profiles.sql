-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name, role)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'Usuário'), 'user');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to call the function on signup
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Backfill existing users who don't have a profile yet
insert into public.profiles (id, email, name, role)
select id, email, coalesce(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', 'Usuário'), 'user'
from auth.users
where id not in (select id from public.profiles)
on conflict (id) do nothing;
