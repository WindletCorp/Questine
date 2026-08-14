-- Create a trigger function to automatically create a public.users row on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, created_at, updated_at)
  VALUES (NEW.id, NOW(), NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert missing users into public.users from auth.users (to fix current orphaned users)
INSERT INTO public.users (id, created_at, updated_at)
SELECT id, created_at, NOW() FROM auth.users
ON CONFLICT (id) DO NOTHING;
