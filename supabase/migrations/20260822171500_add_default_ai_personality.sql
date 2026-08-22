-- Add default AI personality to shop_items

DO $$
DECLARE
    v_item_id UUID;
BEGIN
    -- Check if it already exists
    IF NOT EXISTS (SELECT 1 FROM public.shop_items WHERE category = 'ai_personality' AND name = 'Standard AI') THEN
        INSERT INTO public.shop_items (name, description, category, rarity, price_orbs, preview_data, is_premium_only)
        VALUES (
            'Standard AI', 
            'Your standard helpful AI companion', 
            'ai_personality', 
            'common', 
            0, 
            '{"system_prompt": "You are Questine, a helpful life management assistant."}', 
            false
        ) RETURNING id INTO v_item_id;

        -- We could optionally insert this into every existing user's inventory here, 
        -- but falling back in the application layer if none is equipped is safer for large user bases.
    END IF;
END $$;
