-- 1a. Modify user_settings — add Orbs + Subscription fields:
ALTER TABLE public.user_settings
  ADD COLUMN orbs BIGINT DEFAULT 0,
  ADD COLUMN subscription_tier TEXT DEFAULT 'free',
  ADD COLUMN subscription_expires_at TIMESTAMPTZ;

-- 1b. Remove coins from user_stats:
ALTER TABLE public.user_stats DROP COLUMN IF EXISTS coins;

-- 1c. Create store_items (global catalog):
CREATE TABLE public.store_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,               -- 'theme' | 'personality' | 'avatar_frame'
  slug TEXT NOT NULL UNIQUE,        -- e.g. 'cyberpunk-neon'
  name TEXT NOT NULL,
  description TEXT,
  price_orbs BIGINT NOT NULL DEFAULT 0,
  is_premium BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',      -- type-specific: CSS vars, system prompts, asset URLs
  store_metadata JSONB DEFAULT '{}', -- display: rarity, tags, preview colors
  preview_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1d. Create user_inventory (ownership):
CREATE TABLE public.user_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.store_items(id) ON DELETE CASCADE,
  acquired_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, item_id)
);

-- 1e. Create user_equipment (loadout):
CREATE TABLE public.user_equipment (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  theme_id UUID REFERENCES public.store_items(id),
  personality_id UUID REFERENCES public.store_items(id),
  avatar_frame_id UUID REFERENCES public.store_items(id),
  theme_metadata JSONB DEFAULT '{}',
  personality_metadata JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1f. Create orb_transactions (audit ledger):
CREATE TABLE public.orb_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount BIGINT NOT NULL,
  reason TEXT NOT NULL,
  reference_id UUID,
  balance_after BIGINT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1g. RLS policies:
ALTER TABLE public.store_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orb_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "store_items are readable by authenticated users"
  ON public.store_items FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users can manage their own inventory"
  ON public.user_inventory FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own equipment"
  ON public.user_equipment FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own transactions"
  ON public.orb_transactions FOR SELECT
  USING (auth.uid() = user_id);

-- 1h. Triggers:
CREATE TRIGGER on_store_items_updated
  BEFORE UPDATE ON public.store_items
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER on_user_equipment_updated
  BEFORE UPDATE ON public.user_equipment
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- 1i. Grants:
GRANT ALL ON TABLE public.store_items TO authenticated, service_role;
GRANT ALL ON TABLE public.user_inventory TO authenticated, service_role;
GRANT ALL ON TABLE public.user_equipment TO authenticated, service_role;
GRANT ALL ON TABLE public.orb_transactions TO authenticated, service_role;

-- 1j. Seed default items:
INSERT INTO public.store_items (slug, type, name, description, price_orbs, is_premium, metadata) VALUES
  ('default-theme', 'theme', 'Classic', 'The default Questine theme', 0, false,
   '{"layout": "default", "variables": {}}'),
  ('default-personality', 'personality', 'Questine', 'Your balanced life companion', 0, false,
   '{"system_prompt": "You are Questine, a helpful and encouraging life management assistant.", "tone": "balanced", "display_name": "Questine", "avatar_url": null}');
