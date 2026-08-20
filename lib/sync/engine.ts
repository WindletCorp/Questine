import { db } from "../local-db";
import { createSupabaseBrowserClient } from "../supabase/client";
import type { SyncResult } from "./types";

const client = createSupabaseBrowserClient();

export class SyncEngine {
  static async getLastSyncTime(): Promise<string | null> {
    const record = await db.meta.get("last_sync_time");
    return record?.value || null;
  }

  static async setLastSyncTime(time: string): Promise<void> {
    await db.meta.put({ key: "last_sync_time", value: time });
  }

  static async pushChanges(): Promise<{ pushed: number; errors: any[] }> {
    const errors: any[] = [];
    let pushed = 0;

    const queue = await db.sync_queue.orderBy("created_at").toArray();
    if (queue.length === 0) return { pushed, errors };

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
            
            // Handle composite PKs for metric_subscriptions
            if (entry.table_name === "metric_subscriptions") {
                const [userId, metricId] = entry.record_id.split(":");
                updateQuery = updateQuery.eq("user_id", userId).eq("metric_id", metricId);
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

  static async pullChanges(): Promise<{ pulled: number; errors: any[] }> {
    const errors: any[] = [];
    let pulled = 0;
    
    // In a real app we'd get the userId securely, but for PWA local context we check current session
    const { data: { session } } = await client.auth.getSession();
    if (!session?.user) return { pulled: 0, errors: ["No active session for pull"] };
    
    const userId = session.user.id;
    const lastSync = await this.getLastSyncTime();
    
    // 1. Pull global metrics
    try {
        const count = await db.metric_definitions.count();
        let defQuery = client.from("metric_definitions").select("*").eq("is_global", true);
        if (lastSync && count > 0) {
            defQuery = defQuery.gt("updated_at", lastSync);
        }
        
        const { data, error } = await defQuery;
        if (!error && data) {
            await db.transaction("rw", db.metric_definitions, async () => {
                for (const record of data) {
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
    try {
        const count = await db.metric_definitions.count();
        let defQuery = client.from("metric_definitions").select("*").eq("created_by", userId);
        if (lastSync && count > 0) {
            defQuery = defQuery.gt("updated_at", lastSync);
        }
        const { data, error } = await defQuery;
        
        if (!error && data) {
            await db.transaction("rw", db.metric_definitions, async () => {
                for (const record of data) {
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
    
    // 3. Pull all user tables
    const tables = ["tasks", "routine_blocks", "journals", "metric_subscriptions", "metric_entries"] as const;
    
    for (const tableName of tables) {
      try {
        const localTable = db.table(tableName);
        const count = await localTable.count();
        let query = client.from(tableName).select("*").eq("user_id", userId);
        if (lastSync && count > 0) {
          query = query.gt("updated_at", lastSync);
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
              // Handle composite PK for subscriptions
              const anyRecord = record as any;
              const pk = tableName === "metric_subscriptions" ? [anyRecord.user_id, anyRecord.metric_id] : anyRecord.id;
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
    
    return { pulled, errors };
  }

  static async fullSync(): Promise<SyncResult> {
    if (!navigator.onLine) {
      return { success: false, pushed: 0, pulled: 0, errors: ["Offline"] };
    }

    const { pushed, errors: pushErrors } = await this.pushChanges();
    const { pulled, errors: pullErrors } = await this.pullChanges();
    
    const errors = [...pushErrors, ...pullErrors];
    const success = errors.length === 0;

    if (success) {
      await this.setLastSyncTime(new Date().toISOString());
    }

    return { success, pushed, pulled, errors };
  }
}
