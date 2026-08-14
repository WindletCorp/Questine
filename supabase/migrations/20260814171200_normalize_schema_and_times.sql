-- Clear all existing data to prevent type casting issues or foreign key issues during refactor
TRUNCATE TABLE public.users CASCADE;

-- Create user_profiles table
CREATE TABLE public.user_profiles (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enforce username to be alphanumeric and underscores only, length 3 to 20 characters
ALTER TABLE public.user_profiles
ADD CONSTRAINT username_format_check 
CHECK (username ~ '^[a-zA-Z0-9_]{3,20}$');

CREATE INDEX idx_user_profiles_username ON public.user_profiles(username);

-- Create user_settings table
CREATE TABLE public.user_settings (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  byok_key TEXT,
  byok_provider TEXT,
  goals TEXT,
  constraints TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Remove migrated columns from users table
ALTER TABLE public.users
DROP COLUMN username,
DROP COLUMN display_name,
DROP COLUMN avatar_url,
DROP COLUMN bio,
DROP COLUMN byok_key,
DROP COLUMN byok_provider,
DROP COLUMN goals,
DROP COLUMN constraints;

-- Add updated_at to users if missing
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Policies for user_profiles
CREATE POLICY "Profiles are readable by everyone"
  ON public.user_profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON public.user_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policies for user_settings
CREATE POLICY "Users can manage own settings"
  ON public.user_settings FOR ALL
  USING (auth.uid() = user_id);

-- Enforce TIMESTAMPTZ on routine_blocks
ALTER TABLE public.routine_blocks
ALTER COLUMN start_time DROP DEFAULT,
ALTER COLUMN start_time TYPE TIMESTAMPTZ USING '1970-01-01 00:00:00Z'::timestamptz,
ALTER COLUMN end_time DROP DEFAULT,
ALTER COLUMN end_time TYPE TIMESTAMPTZ USING '1970-01-01 00:00:00Z'::timestamptz;

-- Since data is truncated, we can just alter type on tasks and journals
-- (If they were string/text, Supabase may have cast them to TIMESTAMPTZ already, but let's ensure it)
ALTER TABLE public.tasks
ALTER COLUMN start_time TYPE TIMESTAMPTZ USING start_time::timestamptz,
ALTER COLUMN end_time TYPE TIMESTAMPTZ USING end_time::timestamptz;

ALTER TABLE public.journals
ALTER COLUMN start_time TYPE TIMESTAMPTZ USING start_time::timestamptz,
ALTER COLUMN end_time TYPE TIMESTAMPTZ USING end_time::timestamptz;
