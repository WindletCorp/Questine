-- Create user_stats table
CREATE TABLE public.user_stats (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  xp BIGINT DEFAULT 0,
  coins BIGINT DEFAULT 0,
  current_streak INT DEFAULT 0,
  longest_streak INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Copy existing gamification data from users to user_stats
INSERT INTO public.user_stats (user_id, xp, coins, current_streak, longest_streak)
SELECT id, xp, coins, current_streak, longest_streak FROM public.users;

-- Drop columns from users table
ALTER TABLE public.users 
  DROP COLUMN xp,
  DROP COLUMN coins,
  DROP COLUMN current_streak,
  DROP COLUMN longest_streak;

-- Enable RLS on user_stats
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;

-- Create Policies for user_stats
CREATE POLICY "Users can view their own stats"
  ON public.user_stats
  FOR SELECT
  USING (auth.uid() = user_id);

-- Note: No UPDATE policy is created for public. 
-- Stats can only be modified securely from the server (using a Service Role Key) 
-- or via SECURITY DEFINER functions.
