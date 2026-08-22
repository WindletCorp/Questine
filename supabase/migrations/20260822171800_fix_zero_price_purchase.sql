-- Fix purchase_item function to handle 0 price items without violating orb_transactions amount check
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

    -- Deduct orbs (only if price > 0)
    IF v_price > 0 THEN
        UPDATE public.user_settings SET orbs = orbs - v_price WHERE user_id = v_user_id;

        -- Log transaction
        INSERT INTO public.orb_transactions (user_id, type, amount, source, reference_id, balance_after)
        VALUES (v_user_id, 'spent', v_price, 'shop_purchase', p_item_id, v_current_orbs - v_price);
    END IF;

    -- Add to inventory
    INSERT INTO public.user_inventory (user_id, item_id, category) VALUES (v_user_id, p_item_id, v_category);

    RETURN json_build_object('success', true, 'new_balance', v_current_orbs - v_price);
END;
$$;
