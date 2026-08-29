import { db } from "../local-db";
import { createSupabaseBrowserClient } from "../supabase/client";
import type { SyncResult } from "./types";

const client = createSupabaseBrowserClient();

export class SyncEngine {
  static async getLastSyncTime(): Promise<string | null> {
    const record = await db.meta.get("last_sync_time");
    if (!record?.value) return null;

    // Safety guard: if stored last_sync_time is in the future relative to local clock, auto-heal & reset
    const maxAllowed = new Date(Date.now() + 60 * 1000).toISOString();
    if (record.value > maxAllowed) {
      console.warn("Detected contaminated future sync timestamp, auto-healing cursor:", record.value);
      await db.meta.delete("last_sync_time");
      return null;
    }
    return record.value;
  }

  static async resetSyncCursor(): Promise<void> {
    await db.meta.delete("last_sync_time");
  }

  static async setLastSyncTime(time: string): Promise<void> {
    await db.meta.put({ key: "last_sync_time", value: time });
  }

  static async pushChanges(): Promise<{ pushed: number; errors: any[] }> {
    const errors: any[] = [];
    let pushed = 0;

    const queue = await db.sync_queue.orderBy("created_at").toArray();
    if (queue.length === 0) return { pushed, errors };

    const { data: { session } } = await client.auth.getSession();
    if (!session?.user) return { pushed, errors }; // Do not attempt to push without a session

    for (const entry of queue) {
      try {
        let error = null;
        
        switch (entry.operation) {
          case "INSERT":
            const insertPayload = { ...entry.payload };
            delete insertPayload.sync_status;
            const { error: iErr } = await client.from(entry.table_name as any).insert(insertPayload);
            error = iErr;
            break;
            
          case "UPDATE":
            const updatePayload = { ...entry.payload };
            delete updatePayload.sync_status;
            
            let updateQuery = client.from(entry.table_name as any).update(updatePayload);
            
            // Handle composite PKs for metric_subscriptions and user tables
            if (entry.table_name === "metric_subscriptions") {
                const [userId, metricId] = entry.record_id.split(":");
                updateQuery = updateQuery.eq("user_id", userId).eq("metric_id", metricId);
            } else if (["user_profiles", "user_settings", "user_stats"].includes(entry.table_name)) {
                updateQuery = updateQuery.eq("user_id", entry.record_id);
            } else {
                updateQuery = updateQuery.eq("id", entry.record_id);
            }
            
            const { error: uErr } = await updateQuery;
            error = uErr;
            break;
            
          case "DELETE":
            let deleteQuery = client.from(entry.table_name as any).update({ deleted_at: new Date().toISOString() });
            
            if (entry.table_name === "metric_subscriptions") {
                const [userId, metricId] = entry.record_id.split(":");
                deleteQuery = deleteQuery.eq("user_id", userId).eq("metric_id", metricId);
            } else if (["user_profiles", "user_settings", "user_stats"].includes(entry.table_name)) {
                deleteQuery = deleteQuery.eq("user_id", entry.record_id);
            } else {
                deleteQuery = deleteQuery.eq("id", entry.record_id);
            }
            
            const { error: dErr } = await deleteQuery;
            error = dErr;
            break;
        }

        if (error) {
          console.error(`Sync push error for ${entry.id}:`, error);
          errors.push(error);
          // Depending on the error, we might want to stop or continue. For now, continue and keep the entry.
        } else {
          // Success!
          const dynamicTable = db.table(entry.table_name);
          await db.transaction("rw", dynamicTable, db.sync_queue, async () => {
            if (entry.operation !== "DELETE") {
                let pk: string | string[] = entry.record_id;
                if (entry.table_name === "metric_subscriptions") {
                    pk = entry.record_id.split(":"); // Dexie compound key format [user_id, metric_id]
                } else if (["user_profiles", "user_settings", "user_stats"].includes(entry.table_name)) {
                    pk = entry.record_id; // user_id is the pk
                }
              await dynamicTable.update(pk, { sync_status: "synced" });
            }
            await db.sync_queue.delete(entry.id);
          });
          pushed++;
        }
      } catch (err) {
        console.error(`Sync push exception for ${entry.id}:`, err);
        errors.push(err);
      }
    }

    return { pushed, errors };
  }

  static async pullChanges(): Promise<{ pulled: number; errors: any[], newLastSync: string | null }> {
    const errors: any[] = [];
    let pulled = 0;
    
    // In a real app we'd get the userId securely, but for PWA local context we check current session
    const { data: { session } } = await client.auth.getSession();
    const userId = session?.user?.id;
    
    const syncStartTime = new Date().toISOString();
    const lastSync = await this.getLastSyncTime();
    let newLastSync = lastSync;

    const trackMaxUpdated = (updated_at?: string | null) => {
        if (!updated_at) return;
        // Never allow sync cursor to advance beyond the current sync start time
        if (updated_at <= syncStartTime && (!newLastSync || updated_at > newLastSync)) {
            newLastSync = updated_at;
        }
    };
    
    // 1. Pull global metrics
    try {
        const count = await db.metric_definitions.count();
        let defQuery = client.from("metric_definitions").select("*").eq("is_global", true);
        if (lastSync && count > 0) {
            defQuery = defQuery.gte("updated_at", lastSync); // Use gte to avoid clock skew misses
        }
        
        const { data, error } = await defQuery;
        if (!error && data) {
            await db.transaction("rw", db.metric_definitions, async () => {
                for (const record of data) {
                    trackMaxUpdated(record.updated_at);
                    const localRecord = await db.metric_definitions.get(record.id);
                    if (!localRecord || ((record.updated_at || "") > (localRecord.updated_at || ""))) {
                        await db.metric_definitions.put({ ...record, sync_status: "synced" });
                        pulled++;
                    }
                }
            });
        } else if (error) {
            errors.push(error);
        }
    } catch (e) {
        errors.push(e);
    }
    
    // 2. Pull user-created definitions
    if (userId) {
      try {
          const count = await db.metric_definitions.count();
          let defQuery = client.from("metric_definitions").select("*").eq("created_by", userId);
        if (lastSync && count > 0) {
            defQuery = defQuery.gte("updated_at", lastSync);
        }
        const { data, error } = await defQuery;
        
        if (!error && data) {
            await db.transaction("rw", db.metric_definitions, async () => {
                for (const record of data) {
                    trackMaxUpdated(record.updated_at);
                    const localRecord = await db.metric_definitions.get(record.id);
                    if (!localRecord || ((record.updated_at || "") > (localRecord.updated_at || ""))) {
                        await db.metric_definitions.put({ ...record, sync_status: "synced" });
                        pulled++;
                    }
                }
            });
        } else if (error) {
            errors.push(error);
        }
      } catch(e) {
          errors.push(e);
      }
    }
    
    // 3. Pull all user tables
    if (userId) {
      const tables = [
        "user_profiles", 
        "user_settings", 
      "user_stats", 
      "tasks", 
      "routine_blocks", 
      "journals", 
      "metric_subscriptions", 
      "metric_entries", 
      "user_inventory"
    ] as const;
    
    for (const tableName of tables) {
      try {
        const localTable = db.table(tableName);
        const count = await localTable.count();
        let query = client.from(tableName).select("*").eq("user_id", userId);
        if (lastSync && count > 0) {
          query = query.gte("updated_at", lastSync);
        }
        
        const { data, error } = await query;
        
        if (error) {
          errors.push(error);
          continue;
        }

        if (data) {
          const localTable = db.table(tableName);
          
          await db.transaction("rw", localTable, async () => {
            // Upsert remote data to local db using Last Write Wins
            for (const record of data) {
              trackMaxUpdated(record.updated_at);
              // Handle composite/special PKs
              const anyRecord = record as any;
              let pk: string | string[] = anyRecord.id;
              
              if (tableName === "metric_subscriptions") {
                  pk = [anyRecord.user_id, anyRecord.metric_id];
              } else if (["user_profiles", "user_settings", "user_stats"].includes(tableName)) {
                  pk = anyRecord.user_id;
              }

              const localRecord = await localTable.get(pk);
              
              if (!localRecord || ((record.updated_at || "") > (localRecord.updated_at || ""))) {
                await localTable.put({ ...record, sync_status: "synced" });
                pulled++;
              }
            }
          });
        }
      } catch (err) {
        errors.push(err);
      }
    }
    }
    
    // 4. Pull global shop items
    try {
        const count = await db.shop_items.count();
        let query = client.from("shop_items").select("*");
        if (lastSync && count > 0) {
            query = query.gte("updated_at", lastSync);
        }
        
        const { data, error } = await query;
        if (!error && data) {
            await db.transaction("rw", db.shop_items, async () => {
                for (const record of data) {
                    trackMaxUpdated(record.updated_at);
                    const localRecord = await db.shop_items.get(record.id);
                    if (!localRecord || ((record.updated_at || "") > (localRecord.updated_at || ""))) {
                        await db.shop_items.put({ ...record, sync_status: "synced" });
                        pulled++;
                    }
                }
            });
        } else if (error) {
            errors.push(error);
        }
    } catch(e) {
        errors.push(e);
    }
    
    return { pulled, errors, newLastSync };
  }

  static async fullSync(): Promise<SyncResult> {
    if (!navigator.onLine) {
      return { success: false, pushed: 0, pulled: 0, errors: ["Offline"] };
    }

    const { pushed, errors: pushErrors } = await this.pushChanges();
    const { pulled, errors: pullErrors, newLastSync } = await this.pullChanges();
    
    const errors = [...pushErrors, ...pullErrors];
    const success = errors.length === 0;

    // Use the maximum updated_at observed from the server, capped at current time
    if (success) {
      const nowIso = new Date().toISOString();
      const finalSyncTime = (newLastSync && newLastSync <= nowIso) ? newLastSync : nowIso;
      await this.setLastSyncTime(finalSyncTime);
    }

    return { success, pushed, pulled, errors };
  }
}
