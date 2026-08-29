-- Timeline Schema Alignment Migration
-- Makes start_time / end_time NOT NULL across all timeline entities
-- Replaces metric_entries.timestamp with start_time / end_time

-- 1. Tasks: backfill NULLs then enforce NOT NULL
UPDATE public.tasks SET start_time = created_at WHERE start_time IS NULL;
UPDATE public.tasks SET end_time = start_time WHERE end_time IS NULL;
ALTER TABLE public.tasks ALTER COLUMN start_time SET NOT NULL;
ALTER TABLE public.tasks ALTER COLUMN end_time SET NOT NULL;

-- 2. Journals: backfill NULLs then enforce NOT NULL
UPDATE public.journals SET start_time = created_at WHERE start_time IS NULL;
UPDATE public.journals SET end_time = start_time WHERE end_time IS NULL;
ALTER TABLE public.journals ALTER COLUMN start_time SET NOT NULL;
ALTER TABLE public.journals ALTER COLUMN end_time SET NOT NULL;

-- 3. Metric Entries: replace timestamp with start_time / end_time
ALTER TABLE public.metric_entries ADD COLUMN start_time TIMESTAMPTZ;
ALTER TABLE public.metric_entries ADD COLUMN end_time TIMESTAMPTZ;
UPDATE public.metric_entries SET start_time = timestamp, end_time = timestamp;
ALTER TABLE public.metric_entries ALTER COLUMN start_time SET NOT NULL;
ALTER TABLE public.metric_entries ALTER COLUMN end_time SET NOT NULL;
ALTER TABLE public.metric_entries DROP COLUMN timestamp;

-- 4. Add indexes for timeline range queries
CREATE INDEX IF NOT EXISTS idx_tasks_start_time ON public.tasks(start_time);
CREATE INDEX IF NOT EXISTS idx_journals_start_time ON public.journals(start_time);
CREATE INDEX IF NOT EXISTS idx_metric_entries_start_time ON public.metric_entries(start_time);
CREATE INDEX IF NOT EXISTS idx_routine_blocks_start_time ON public.routine_blocks(start_time);
