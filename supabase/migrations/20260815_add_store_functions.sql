-- 2a. Atomic purchase_item RPC
CREATE OR REPLACE FUNCTION public.purchase_item(p_item_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_item store_items%ROWTYPE;
  v_current_orbs BIGINT;
  v_new_balance BIGINT;
  v_inventory_id UUID;
BEGIN
  SELECT * INTO v_item FROM store_items WHERE id = p_item_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Item not found'; END IF;

  IF EXISTS (SELECT 1 FROM user_inventory WHERE user_id = v_user_id AND item_id = p_item_id) THEN
    RAISE EXCEPTION 'Item already owned';
  END IF;

  SELECT orbs INTO v_current_orbs FROM user_settings WHERE user_id = v_user_id;
  IF v_current_orbs IS NULL OR v_current_orbs < v_item.price_orbs THEN
    RAISE EXCEPTION 'Insufficient Orbs';
  END IF;

  v_new_balance := v_current_orbs - v_item.price_orbs;
  UPDATE user_settings SET orbs = v_new_balance WHERE user_id = v_user_id;

  INSERT INTO user_inventory (user_id, item_id) VALUES (v_user_id, p_item_id)
    RETURNING id INTO v_inventory_id;

  INSERT INTO orb_transactions (user_id, amount, reason, reference_id, balance_after)
    VALUES (v_user_id, -v_item.price_orbs, 'purchase_item', p_item_id, v_new_balance);

  RETURN jsonb_build_object('success', true, 'inventory_id', v_inventory_id, 'balance', v_new_balance);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2b. Extend existing handle_new_user trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_default_theme_id UUID;
  v_default_personality_id UUID;
  v_theme_meta JSONB;
  v_personality_meta JSONB;
BEGIN
  -- Core user rows (existing behavior)
  INSERT INTO public.users (id, created_at, updated_at) VALUES (NEW.id, NOW(), NOW());
  INSERT INTO public.user_profiles (user_id) VALUES (NEW.id);
  INSERT INTO public.user_settings (user_id) VALUES (NEW.id);
  INSERT INTO public.user_stats (user_id) VALUES (NEW.id);

  -- Lookup default items
  SELECT id, metadata INTO v_default_theme_id, v_theme_meta
    FROM store_items WHERE slug = 'default-theme' LIMIT 1;
  SELECT id, metadata INTO v_default_personality_id, v_personality_meta
    FROM store_items WHERE slug = 'default-personality' LIMIT 1;

  -- Seed inventory with defaults
  IF v_default_theme_id IS NOT NULL THEN
    INSERT INTO user_inventory (user_id, item_id) VALUES (NEW.id, v_default_theme_id);
  END IF;
  IF v_default_personality_id IS NOT NULL THEN
    INSERT INTO user_inventory (user_id, item_id) VALUES (NEW.id, v_default_personality_id);
  END IF;

  -- Seed equipment with cached metadata for offline use
  INSERT INTO user_equipment (user_id, theme_id, personality_id, theme_metadata, personality_metadata)
  VALUES (NEW.id, v_default_theme_id, v_default_personality_id,
          COALESCE(v_theme_meta, '{}'), COALESCE(v_personality_meta, '{}'));

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2c. Backfill existing users (who signed up before this migration)
INSERT INTO public.user_equipment (user_id, theme_id, personality_id, theme_metadata, personality_metadata)
SELECT u.id,
  (SELECT id FROM store_items WHERE slug = 'default-theme'),
  (SELECT id FROM store_items WHERE slug = 'default-personality'),
  COALESCE((SELECT metadata FROM store_items WHERE slug = 'default-theme'), '{}'),
  COALESCE((SELECT metadata FROM store_items WHERE slug = 'default-personality'), '{}')
FROM public.users u
WHERE NOT EXISTS (SELECT 1 FROM user_equipment WHERE user_id = u.id);

INSERT INTO public.user_inventory (user_id, item_id)
SELECT u.id, si.id
FROM public.users u
CROSS JOIN public.store_items si
WHERE si.slug IN ('default-theme', 'default-personality')
AND NOT EXISTS (SELECT 1 FROM user_inventory WHERE user_id = u.id AND item_id = si.id);
