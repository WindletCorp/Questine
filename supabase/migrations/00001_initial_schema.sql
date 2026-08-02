-- Create users extensions (auth handled by supabase, we just add our gamification data)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  xp BIGINT DEFAULT 0,
  coins BIGINT DEFAULT 0,
  current_streak INT DEFAULT 0,
  longest_streak INT DEFAULT 0,
  byok_key TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create routine_blocks table
CREATE TABLE public.routine_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) NOT NULL,
  label TEXT NOT NULL,
  category TEXT NOT NULL,
  start_time BIGINT NOT NULL,
  end_time BIGINT NOT NULL,
  type TEXT CHECK (type IN ('PLAN', 'ACTUAL')) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create tasks table
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) NOT NULL,
  label TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  metadata JSONB
);

-- Create journals table
CREATE TABLE public.journals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) NOT NULL,
  content TEXT NOT NULL,
  ai_analysis JSONB,
  date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routine_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journals ENABLE ROW LEVEL SECURITY;

-- Create Policies
CREATE POLICY "Users can manage their own profile"
  ON public.users
  FOR ALL
  USING (auth.uid() = id);

CREATE POLICY "Users can manage their own routine blocks"
  ON public.routine_blocks
  FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own tasks"
  ON public.tasks
  FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own journals"
  ON public.journals
  FOR ALL
  USING (auth.uid() = user_id);
