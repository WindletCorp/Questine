-- Create a trigger function to automatically update the updated_at column
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. Add updated_at to all tables and attach the trigger
-- users
ALTER TABLE public.users ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
CREATE TRIGGER on_users_updated
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- user_stats
ALTER TABLE public.user_stats ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
CREATE TRIGGER on_user_stats_updated
  BEFORE UPDATE ON public.user_stats
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- routine_blocks
ALTER TABLE public.routine_blocks ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
CREATE TRIGGER on_routine_blocks_updated
  BEFORE UPDATE ON public.routine_blocks
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- tasks
ALTER TABLE public.tasks ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
CREATE TRIGGER on_tasks_updated
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- journals
ALTER TABLE public.journals ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
CREATE TRIGGER on_journals_updated
  BEFORE UPDATE ON public.journals
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();


-- 2. Update routine_blocks time format (truncate data to safely change type)
TRUNCATE TABLE public.routine_blocks CASCADE;

ALTER TABLE public.routine_blocks 
  DROP COLUMN start_time,
  DROP COLUMN end_time,
  ADD COLUMN start_time TIMESTAMPTZ NOT NULL,
  ADD COLUMN end_time TIMESTAMPTZ NOT NULL;


-- 3. Add streak logic to user_stats
ALTER TABLE public.user_stats
  ADD COLUMN last_active_date TIMESTAMPTZ;


-- 4. Fix Cascade Deletes on foreign keys
-- Drop existing constraints (Need to get the exact names, assuming standard Supabase generation)
-- Since Supabase names them table_column_fkey, we can drop and recreate.
ALTER TABLE public.routine_blocks 
  DROP CONSTRAINT IF EXISTS routine_blocks_user_id_fkey,
  ADD CONSTRAINT routine_blocks_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.tasks 
  DROP CONSTRAINT IF EXISTS tasks_user_id_fkey,
  ADD CONSTRAINT tasks_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.journals 
  DROP CONSTRAINT IF EXISTS journals_user_id_fkey,
  ADD CONSTRAINT journals_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
