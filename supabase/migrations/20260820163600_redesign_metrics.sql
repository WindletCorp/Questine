-- 1. Create the new metric_subscriptions table (composite PK, no surrogate UUID)
CREATE TABLE public.metric_subscriptions (
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    metric_id UUID NOT NULL REFERENCES public.metric_definitions(id) ON DELETE CASCADE,
    target_value NUMERIC,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, metric_id)
);

ALTER TABLE public.metric_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own subscriptions"
    ON public.metric_subscriptions FOR ALL
    USING (auth.uid() = user_id);
GRANT ALL ON TABLE public.metric_subscriptions TO authenticated, service_role, anon;

-- 2. Migrate data from user_metrics -> metric_subscriptions
INSERT INTO public.metric_subscriptions (user_id, metric_id, target_value, created_at)
SELECT user_id, metric_id, target_value, created_at FROM public.user_metrics
ON CONFLICT DO NOTHING;

-- 3. Create new metric_entries table with direct references
ALTER TABLE public.metric_entries RENAME TO metric_entries_old;

CREATE TABLE public.metric_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    metric_id UUID NOT NULL REFERENCES public.metric_definitions(id) ON DELETE CASCADE,
    value NUMERIC NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.metric_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own metric entries"
    ON public.metric_entries FOR ALL
    USING (auth.uid() = user_id);
GRANT ALL ON TABLE public.metric_entries TO authenticated, service_role, anon;

-- 4. Migrate data from old entries -> new entries
INSERT INTO public.metric_entries (id, user_id, metric_id, value, timestamp, created_at)
SELECT
    e.id,
    um.user_id,
    um.metric_id,
    e.value,
    e.timestamp,
    e.entered_at
FROM public.metric_entries_old e
JOIN public.user_metrics um ON um.id = e.user_metric_id;

-- 5. Drop old tables
DROP TABLE public.metric_entries_old;
DROP TABLE public.user_metrics;
