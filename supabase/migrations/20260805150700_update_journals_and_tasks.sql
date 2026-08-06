-- Update Tasks table
ALTER TABLE public.tasks ADD COLUMN due_date TIMESTAMPTZ;

-- Update Journals table
TRUNCATE TABLE public.journals CASCADE;

ALTER TABLE public.journals 
  DROP COLUMN date,
  ADD COLUMN start_time TIMESTAMPTZ NOT NULL,
  ADD COLUMN end_time TIMESTAMPTZ NOT NULL;
