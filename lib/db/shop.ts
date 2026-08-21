import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import type { ShopItem, DbResult, ItemCategory, ItemRarity } from "./types";
import { ok, err } from "./types";

type Client = SupabaseClient<Database>;

export type ShopItemFilters = {
  category?: ItemCategory;
  rarity?: ItemRarity;
  isPremiumOnly?: boolean;
};

export async function getShopItems(
  client: Client,
  filters?: ShopItemFilters
): Promise<DbResult<ShopItem[]>> {
  let query = client
    .from("shop_items")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("price_orbs", { ascending: true });

  if (filters?.category) {
    query = query.eq("category", filters.category);
  }
  if (filters?.rarity) {
    query = query.eq("rarity", filters.rarity);
  }
  if (filters?.isPremiumOnly !== undefined) {
    query = query.eq("is_premium_only", filters.isPremiumOnly);
  }

  const { data, error } = await query;
  if (error) return err(error.message);
  return ok(data);
}

export async function getShopItem(
  client: Client,
  itemId: string
): Promise<DbResult<ShopItem>> {
  const { data, error } = await client
    .from("shop_items")
    .select("*")
    .eq("id", itemId)
    .single();

  if (error) return err(error.message);
  return ok(data);
}

export async function getItemsByCategory(
  client: Client,
  category: ItemCategory
): Promise<DbResult<ShopItem[]>> {
  return getShopItems(client, { category });
}

export async function purchaseItem(
  client: Client,
  itemId: string
): Promise<DbResult<{ new_balance: number }>> {
  const { data, error } = await client.rpc("purchase_item", {
    p_item_id: itemId,
  });

  if (error) return err(error.message);
  
  const result = data as any;
  if (!result.success) {
    return err(result.error || "Purchase failed");
  }

  return ok({ new_balance: result.new_balance });
}
