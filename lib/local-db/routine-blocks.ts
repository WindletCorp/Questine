import { db, type LocalRoutineBlock, type SyncQueueEntry } from "./index";
import type { RoutineBlockInsert, RoutineBlockUpdate, DbResult, RoutineBlock } from "../db/types";
import { ok, err } from "../db/types";
import { handleDbError } from "../db/errors";

export type GetLocalRoutineBlocksOptions = {
  from?: string;
  to?: string;
};

export async function getLocalRoutineBlocks(
  userId: string,
  opts: GetLocalRoutineBlocksOptions = {}
): Promise<DbResult<LocalRoutineBlock[]>> {
  try {
    let collection = db.routine_blocks.where("user_id").equals(userId);
    let blocks = await collection.toArray();

    const { from, to } = opts;

    if (from || to) {
      if (from) blocks = blocks.filter(b => b.end_time && b.end_time >= from);
      if (to) blocks = blocks.filter(b => b.start_time && b.start_time <= to);
    } else {
      // Default: 48-hour window
      const defaultStart = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const defaultEnd = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      blocks = blocks.filter(b => b.start_time >= defaultStart && b.start_time <= defaultEnd);
    }

    blocks.sort((a, b) => a.start_time.localeCompare(b.start_time));
    return ok(blocks);
  } catch (error) {
    return err(handleDbError(error));
  }
}

export async function createLocalRoutineBlock(block: RoutineBlockInsert): Promise<DbResult<LocalRoutineBlock>> {
  try {
    const id = block.id || crypto.randomUUID();
    const now = new Date().toISOString();
    
    const localBlock: LocalRoutineBlock = {
      id,
      user_id: block.user_id,
      label: block.label,
      category: block.category,
      type: block.type,
      start_time: block.start_time,
      end_time: block.end_time,
      created_at: block.created_at ?? now,
      updated_at: block.updated_at ?? now,
      sync_status: "pending"
    };

    const queueEntry: SyncQueueEntry = {
      id: crypto.randomUUID(),
      table_name: "routine_blocks",
      operation: "INSERT",
      record_id: id,
      payload: localBlock,
      created_at: now
    };

    await db.transaction("rw", db.routine_blocks, db.sync_queue, async () => {
      await db.routine_blocks.add(localBlock);
      await db.sync_queue.add(queueEntry);
    });

    return ok(localBlock);
  } catch (error) {
    return err(handleDbError(error));
  }
}

export async function updateLocalRoutineBlock(id: string, updates: RoutineBlockUpdate): Promise<DbResult<LocalRoutineBlock>> {
  try {
    const now = new Date().toISOString();
    
    const finalUpdates = {
      ...updates,
      updated_at: now,
      sync_status: "pending" as const
    };

    const queueEntry: SyncQueueEntry = {
      id: crypto.randomUUID(),
      table_name: "routine_blocks",
      operation: "UPDATE",
      record_id: id,
      payload: updates,
      created_at: now
    };

    await db.transaction("rw", db.routine_blocks, db.sync_queue, async () => {
      await db.routine_blocks.update(id, finalUpdates);
      await db.sync_queue.add(queueEntry);
    });

    const updated = await db.routine_blocks.get(id);
    if (!updated) return err({ code: 'NOT_FOUND', message: "Routine block not found after update" });
    return ok(updated);
  } catch (error) {
    return err(handleDbError(error));
  }
}

export async function deleteLocalRoutineBlock(id: string): Promise<DbResult<null>> {
  try {
    const now = new Date().toISOString();
    
    const queueEntry: SyncQueueEntry = {
      id: crypto.randomUUID(),
      table_name: "routine_blocks",
      operation: "DELETE",
      record_id: id,
      payload: null,
      created_at: now
    };

    await db.transaction("rw", db.routine_blocks, db.sync_queue, async () => {
      await db.routine_blocks.delete(id);
      await db.sync_queue.add(queueEntry);
    });

    return ok(null);
  } catch (error) {
    return err(handleDbError(error));
  }
}
