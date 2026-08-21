-- Enums
CREATE TYPE item_category AS ENUM ('theme', 'ai_personality', 'notification_style', 'profile_customization');
CREATE TYPE item_rarity AS ENUM ('common', 'rare', 'epic', 'legendary');
CREATE TYPE transaction_type AS ENUM ('earned', 'spent');

-- Shop Items
CREATE TABLE public.shop_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    category item_category NOT NULL,
    rarity item_rarity DEFAULT 'common',
    price_orbs INTEGER NOT NULL,
    preview_data JSONB,
    preview_image TEXT,
    is_active BOOLEAN DEFAULT true,
    is_premium_only BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.shop_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Shop items are viewable by everyone" ON public.shop_items FOR SELECT USING (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shop_items TO authenticated, anon;

-- User Inventory
CREATE TABLE public.user_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES public.shop_items(id) ON DELETE CASCADE,
    category item_category NOT NULL, -- Denormalized for easier unique index on equipped items
    is_equipped BOOLEAN DEFAULT false,
    purchased_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, item_id)
);
CREATE UNIQUE INDEX one_equipped_per_category_idx ON public.user_inventory (user_id, category) WHERE is_equipped = true;

ALTER TABLE public.user_inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own inventory" ON public.user_inventory FOR ALL USING (auth.uid() = user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_inventory TO authenticated, anon;

-- Orb Transactions
CREATE TABLE public.orb_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    type transaction_type NOT NULL,
    amount INTEGER NOT NULL CHECK (amount > 0),
    source TEXT,
    reference_id UUID,
    balance_after INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.orb_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own transactions" ON public.orb_transactions FOR SELECT USING (auth.uid() = user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orb_transactions TO authenticated, anon;

-- Update user_settings
ALTER TABLE public.user_settings ADD COLUMN orbs INTEGER DEFAULT 0;

-- Migrate coins from user_stats to user_settings.orbs
UPDATE public.user_settings s
SET orbs = st.coins
FROM public.user_stats st
WHERE s.user_id = st.user_id AND st.coins > 0;

-- Drop coins from user_stats
ALTER TABLE public.user_stats DROP COLUMN coins;

-- DB Functions
CREATE OR REPLACE FUNCTION purchase_item(p_item_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_price INTEGER;
    v_category item_category;
    v_current_orbs INTEGER;
    v_already_owned BOOLEAN;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Not authenticated');
    END IF;

    -- Get item info
    SELECT price_orbs, category INTO v_price, v_category
    FROM public.shop_items WHERE id = p_item_id AND is_active = true;

    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Item not found or inactive');
    END IF;

    -- Check if already owned
    SELECT EXISTS(SELECT 1 FROM public.user_inventory WHERE user_id = v_user_id AND item_id = p_item_id) INTO v_already_owned;
    IF v_already_owned THEN
        RETURN json_build_object('success', false, 'error', 'Item already owned');
    END IF;

    -- Get user balance
    SELECT orbs INTO v_current_orbs FROM public.user_settings WHERE user_id = v_user_id FOR UPDATE;
    IF v_current_orbs IS NULL THEN
        -- Handle case where user_settings doesn't exist yet
        INSERT INTO public.user_settings (user_id, orbs) VALUES (v_user_id, 0) RETURNING orbs INTO v_current_orbs;
    END IF;

    IF v_current_orbs < v_price THEN
        RETURN json_build_object('success', false, 'error', 'Insufficient orbs');
    END IF;

    -- Deduct orbs
    UPDATE public.user_settings SET orbs = orbs - v_price WHERE user_id = v_user_id;

    -- Log transaction
    INSERT INTO public.orb_transactions (user_id, type, amount, source, reference_id, balance_after)
    VALUES (v_user_id, 'spent', v_price, 'shop_purchase', p_item_id, v_current_orbs - v_price);

    -- Add to inventory
    INSERT INTO public.user_inventory (user_id, item_id, category) VALUES (v_user_id, p_item_id, v_category);

    RETURN json_build_object('success', true, 'new_balance', v_current_orbs - v_price);
END;
$$;

CREATE OR REPLACE FUNCTION equip_item(p_inventory_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_category item_category;
    v_is_equipped BOOLEAN;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Not authenticated');
    END IF;

    -- Get inventory item info
    SELECT category, is_equipped INTO v_category, v_is_equipped
    FROM public.user_inventory WHERE id = p_inventory_id AND user_id = v_user_id;

    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Item not found in inventory');
    END IF;

    IF v_is_equipped THEN
        RETURN json_build_object('success', true, 'message', 'Item already equipped');
    END IF;

    -- Unequip current item in that category
    UPDATE public.user_inventory SET is_equipped = false WHERE user_id = v_user_id AND category = v_category AND is_equipped = true;

    -- Equip new item
    UPDATE public.user_inventory SET is_equipped = true WHERE id = p_inventory_id;

    RETURN json_build_object('success', true);
END;
$$;
