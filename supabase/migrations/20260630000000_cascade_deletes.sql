-- Update foreign keys to cascade on delete
alter table public.profiles
  drop constraint profiles_id_fkey,
  add constraint profiles_id_fkey foreign key (id) references auth.users (id) on delete cascade;

alter table public.day_snapshots
  drop constraint day_snapshots_user_id_fkey,
  add constraint day_snapshots_user_id_fkey foreign key (user_id) references public.profiles (id) on delete cascade;

alter table public.user_ai_keys
  drop constraint user_ai_keys_user_id_fkey,
  add constraint user_ai_keys_user_id_fkey foreign key (user_id) references public.profiles (id) on delete cascade;
