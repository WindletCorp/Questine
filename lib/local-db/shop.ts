import { db } from "./index";
import type { LocalShopItem, LocalUserInventoryItem } from "./index";
import type { ItemCategory } from "../db/types";

export async function getLocalShopItems(): Promise<LocalShopItem[]> {
  const items = await db.shop_items.orderBy("sort_order").toArray();
  return items.filter(item => item.is_active === true);
}

export async function getLocalInventory(userId: string): Promise<LocalUserInventoryItem[]> {
  return await db.user_inventory
    .where("user_id")
    .equals(userId)
    .toArray();
}

export async function getLocalEquippedByCategory(
  userId: string,
  category: ItemCategory
): Promise<LocalUserInventoryItem | undefined> {
  const items = await db.user_inventory
    .where("user_id")
    .equals(userId)
    .and((item) => item.category === category && item.is_equipped === true)
    .toArray();
    
  return items[0];
}

export async function equipLocalItem(
  userId: string,
  inventoryId: string
): Promise<{ error: string | null }> {
  try {
    await db.transaction("rw", db.user_inventory, db.sync_queue, async () => {
      // 1. Get the target item to equip
      const targetItem = await db.user_inventory.get(inventoryId);
      if (!targetItem) throw new Error("Item not found in inventory");
      if (targetItem.user_id !== userId) throw new Error("Unauthorized");

      // 2. Find currently equipped item of the same category
      const currentEquipped = await getLocalEquippedByCategory(userId, targetItem.category);

      // 3. Unequip current item if it exists and is different
      if (currentEquipped && currentEquipped.id !== targetItem.id) {
        currentEquipped.is_equipped = false;
        currentEquipped.updated_at = new Date().toISOString();
        currentEquipped.sync_status = "pending";
        await db.user_inventory.put(currentEquipped);
        
        await db.sync_queue.add({
          id: crypto.randomUUID(),
          table_name: "user_inventory",
          operation: "UPDATE",
          record_id: currentEquipped.id,
          payload: { is_equipped: false, updated_at: currentEquipped.updated_at },
          created_at: new Date().toISOString()
        });
      }

      // 4. Equip the new item
      targetItem.is_equipped = true;
      targetItem.updated_at = new Date().toISOString();
      targetItem.sync_status = "pending";
      await db.user_inventory.put(targetItem);

      await db.sync_queue.add({
        id: crypto.randomUUID(),
        table_name: "user_inventory",
        operation: "UPDATE",
        record_id: targetItem.id,
        payload: { is_equipped: true, updated_at: targetItem.updated_at },
        created_at: new Date().toISOString()
      });
    });

    return { error: null };
  } catch (error: any) {
    return { error: error.message };
  }
}
