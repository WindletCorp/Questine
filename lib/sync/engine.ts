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
            const { error: uErr } = await client.from(entry.table_name as any).update(updatePayload).eq("id", entry.record_id);
            error = uErr;
            break;
            
          case "DELETE":
            const { error: dErr } = await client.from(entry.table_name as any).update({ deleted_at: new Date().toISOString() }).eq("id", entry.record_id);
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
              await dynamicTable.update(entry.record_id, { sync_status: "synced" });
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
    
    const tables = ["tasks", "routine_blocks", "journals"] as const;
    
    for (const tableName of tables) {
      try {
        let query = client.from(tableName).select("*").eq("user_id", userId);
        if (lastSync) {
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
              const localRecord = await localTable.get(record.id);
              
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
