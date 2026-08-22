import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import type { UserInventoryItem, DbResult, ItemCategory, ShopItem } from "./types";
import { ok, err } from "./types";

type Client = SupabaseClient<Database>;

export type PopulatedInventoryItem = UserInventoryItem & {
  shop_item: ShopItem;
};

export async function getUserInventory(
  client: Client,
  userId: string
): Promise<DbResult<PopulatedInventoryItem[]>> {
  const { data, error } = await client
    .from("user_inventory")
    .select(`
      *,
      shop_item:shop_items(*)
    `)
    .eq("user_id", userId);

  if (error) return err(error.message);
  
  // Note: the joined data might be an array depending on how Supabase views the relation,
  // but since it's a many-to-one (inventory -> shop_item), it should be a single object.
  // We'll coerce it to our populated type.
  return ok(data as unknown as PopulatedInventoryItem[]);
}

export async function getEquippedItems(
  client: Client,
  userId: string
): Promise<DbResult<PopulatedInventoryItem[]>> {
  const { data, error } = await client
    .from("user_inventory")
    .select(`
      *,
      shop_item:shop_items(*)
    `)
    .eq("user_id", userId)
    .eq("is_equipped", true);

  if (error) return err(error.message);
  return ok(data as unknown as PopulatedInventoryItem[]);
}

export async function getEquippedByCategory(
  client: Client,
  userId: string,
  category: ItemCategory
): Promise<DbResult<PopulatedInventoryItem | null>> {
  const { data, error } = await client
    .from("user_inventory")
    .select(`
      *,
      shop_item:shop_items(*)
    `)
    .eq("user_id", userId)
    .eq("category", category)
    .eq("is_equipped", true)
    .maybeSingle();

  if (error) return err(error.message);
  return ok((data as unknown as PopulatedInventoryItem) || null);
}

export async function equipItem(
  client: Client,
  inventoryId: string
): Promise<DbResult<void>> {
  const { data, error } = await client.rpc("equip_item", {
    p_inventory_id: inventoryId,
  });

  if (error) return err(error.message);

  const result = data as any;
  if (!result.success) {
    return err(result.error || "Equip failed");
  }

  return ok(undefined);
}

export async function hasItem(
  client: Client,
  userId: string,
  itemId: string
): Promise<DbResult<boolean>> {
  const { data, error } = await client
    .from("user_inventory")
    .select("id")
    .eq("user_id", userId)
    .eq("item_id", itemId)
    .maybeSingle();

  if (error) return err(error.message);
  return ok(!!data);
}
