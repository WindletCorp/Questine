-- Drop old tables and their dependencies
drop table if exists public.routine_blocks cascade;
drop table if exists public.routines cascade;
drop table if exists public.day_snapshots cascade;

-- We can reuse routine_type and routine_block_source enums for timeline_blocks
-- Ensure they exist, if not create them (they should exist from initial schema)
-- create type routine_type as enum ('plan', 'actual');
-- create type routine_block_source as enum ('ai', 'manual');

-- 1. Create timeline_blocks
create table public.timeline_blocks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  start_time timestamp with time zone not null,
  end_time timestamp with time zone not null,
  label text not null,
  color text, -- carrying over from previous migrations
  type routine_type not null,
  source routine_block_source not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.timeline_blocks enable row level security;
create policy "Users can manage own timeline blocks." on timeline_blocks for all using (auth.uid() = user_id);

-- 2. Create journal_logs (Event-Sourced Logging)
create table public.journal_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  logged_at timestamp with time zone default now()
);

alter table public.journal_logs enable row level security;
create policy "Users can manage own journal logs." on journal_logs for all using (auth.uid() = user_id);

-- 3. Create tasks
create type task_status as enum ('pending', 'completed');
create table public.tasks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  status task_status default 'pending' not null,
  target_date date,
  linked_block_id uuid references public.timeline_blocks(id) on delete set null,
  created_at timestamp with time zone default now(),
  completed_at timestamp with time zone
);

alter table public.tasks enable row level security;
create policy "Users can manage own tasks." on tasks for all using (auth.uid() = user_id);

-- 4. Create metric_definitions
create table public.metric_definitions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  unit text,
  created_at timestamp with time zone default now(),
  unique(user_id, name) -- Prevent duplicate metric names per user
);

alter table public.metric_definitions enable row level security;
create policy "Users can manage own metric definitions." on metric_definitions for all using (auth.uid() = user_id);

-- 5. Create metric_logs
create table public.metric_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  metric_id uuid references public.metric_definitions(id) on delete cascade not null,
  value numeric not null,
  journal_log_id uuid references public.journal_logs(id) on delete set null,
  recorded_at timestamp with time zone default now()
);

alter table public.metric_logs enable row level security;
create policy "Users can manage own metric logs." on metric_logs for all using (auth.uid() = user_id);
