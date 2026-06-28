-- Update handle_new_user to also save the username from auth metadata
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id, 
    new.raw_user_meta_data->>'username'
  );
  return new;
end;
$$ language plpgsql security definer;
