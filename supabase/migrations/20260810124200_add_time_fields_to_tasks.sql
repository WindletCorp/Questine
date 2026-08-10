ALTER TABLE public.tasks
ADD COLUMN start_time timestamp with time zone,
ADD COLUMN end_time timestamp with time zone;

ALTER TABLE public.tasks
DROP COLUMN due_date;
