-- Enable pgcrypto for encryption (useful for user_ai_keys)
create extension if not exists pgcrypto;

-- 1. Create profiles
create table public.profiles (
  id uuid references auth.users not null primary key,
  username text,
  avatar_url text,
  global_context text,
  global_context_updated_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

alter table public.profiles enable row level security;
create policy "Users can view own profile." on profiles for select using (auth.uid() = id);
create policy "Users can update own profile." on profiles for update using (auth.uid() = id);

-- 2. Create day_snapshots (without FKs to routines yet to avoid circular reference)
create table public.day_snapshots (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) not null,
  date date not null,
  plan_routine_id uuid, 
  actual_routine_id uuid,
  journal_text text,
  confirmed_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

alter table public.day_snapshots enable row level security;
create policy "Users can manage own day snapshots." on day_snapshots for all using (auth.uid() = user_id);

-- 3. Create routines
create type routine_type as enum ('plan', 'actual');
create table public.routines (
  id uuid default gen_random_uuid() primary key,
  day_snapshot_id uuid references public.day_snapshots(id) on delete cascade not null,
  type routine_type not null,
  generated_at timestamp with time zone,
  locked_at timestamp with time zone
);

alter table public.routines enable row level security;
create policy "Users can manage own routines." on routines for all 
using (
  exists (
    select 1 from public.day_snapshots ds 
    where ds.id = routines.day_snapshot_id 
    and ds.user_id = auth.uid()
  )
);

-- Now add the circular FKs back to day_snapshots
alter table public.day_snapshots 
  add constraint fk_plan_routine foreign key (plan_routine_id) references public.routines(id) on delete set null,
  add constraint fk_actual_routine foreign key (actual_routine_id) references public.routines(id) on delete set null;

-- 4. Create routine_blocks
create type routine_block_source as enum ('ai', 'manual');
create table public.routine_blocks (
  id uuid default gen_random_uuid() primary key,
  routine_id uuid references public.routines(id) on delete cascade not null,
  start_time time not null,
  end_time time not null,
  label text not null,
  source routine_block_source not null,
  order_index integer not null
);

alter table public.routine_blocks enable row level security;
create policy "Users can manage own routine blocks." on routine_blocks for all 
using (
  exists (
    select 1 from public.routines r
    join public.day_snapshots ds on r.day_snapshot_id = ds.id
    where r.id = routine_blocks.routine_id 
    and ds.user_id = auth.uid()
  )
);

-- 5. Create user_ai_keys
create table public.user_ai_keys (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) not null,
  provider text not null,
  encrypted_key text not null,
  created_at timestamp with time zone default now()
);

alter table public.user_ai_keys enable row level security;
create policy "Users can insert own ai keys" on user_ai_keys for insert with check (auth.uid() = user_id);
create policy "Users can update own ai keys" on user_ai_keys for update using (auth.uid() = user_id);
create policy "Users can delete own ai keys" on user_ai_keys for delete using (auth.uid() = user_id);
