-- Add profile fields to users table
ALTER TABLE public.users 
ADD COLUMN username TEXT UNIQUE,
ADD COLUMN display_name TEXT,
ADD COLUMN avatar_url TEXT,
ADD COLUMN bio TEXT;

-- Enforce username to be alphanumeric and underscores only, length 3 to 20 characters
ALTER TABLE public.users
ADD CONSTRAINT username_format_check 
CHECK (username ~ '^[a-zA-Z0-9_]{3,20}$');

-- Create an index on username for faster lookups
CREATE INDEX idx_users_username ON public.users(username);
