create table public.trial_generations (
  id uuid default gen_random_uuid() primary key,
  ip_address text not null,
  created_at timestamp with time zone default now()
);

-- Note: No RLS policies are added because this table is only accessed via secure Server Actions
-- bypassing RLS using the Service Role Key. If client-side access is ever needed, RLS must be enabled.
