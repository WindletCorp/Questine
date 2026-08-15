CREATE TABLE public.metric_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    unit TEXT,
    polarity TEXT,
    is_global BOOLEAN DEFAULT false,
    created_by UUID REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.metric_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Global metrics are readable by everyone"
    ON public.metric_definitions FOR SELECT
    USING (is_global = true);

CREATE POLICY "Users can read own metrics"
    ON public.metric_definitions FOR SELECT
    USING (auth.uid() = created_by);

CREATE POLICY "Users can insert own metrics"
    ON public.metric_definitions FOR INSERT
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own metrics"
    ON public.metric_definitions FOR UPDATE
    USING (auth.uid() = created_by);

CREATE POLICY "Users can delete own metrics"
    ON public.metric_definitions FOR DELETE
    USING (auth.uid() = created_by);


CREATE TABLE public.user_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    metric_id UUID NOT NULL REFERENCES public.metric_definitions(id) ON DELETE CASCADE,
    target_value NUMERIC,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, metric_id)
);

ALTER TABLE public.user_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own enrolled metrics"
    ON public.user_metrics FOR ALL
    USING (auth.uid() = user_id);


CREATE TABLE public.metric_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_metric_id UUID NOT NULL REFERENCES public.user_metrics(id) ON DELETE CASCADE,
    value NUMERIC NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    entered_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.metric_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own metric entries"
    ON public.metric_entries FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_metrics
            WHERE user_metrics.id = metric_entries.user_metric_id
            AND user_metrics.user_id = auth.uid()
        )
    );

-- Seed global metrics
INSERT INTO public.metric_definitions (name, type, unit, polarity, is_global) VALUES
    ('Water', 'boolean', 'glass', 'positive', true),
    ('Pushups', 'boolean', 'rep', 'positive', true),
    ('Reading', 'boolean', 'session', 'positive', true),
    ('Studying', 'boolean', 'session', 'positive', true),
    ('Screen Time', 'boolean', 'session', 'negative', true);

GRANT ALL ON TABLE public.metric_definitions TO authenticated, service_role, anon;
GRANT ALL ON TABLE public.user_metrics TO authenticated, service_role, anon;
GRANT ALL ON TABLE public.metric_entries TO authenticated, service_role, anon;

