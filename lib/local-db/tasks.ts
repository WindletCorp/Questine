import { db, type LocalTask, type SyncQueueEntry } from "./index";
import type { TaskInsert, TaskUpdate, DbResult, Task } from "../db/types";
import { ok, err } from "../db/types";

export async function getLocalTasks(
  userId: string,
  updatedAfter?: string,
  updatedBefore?: string,
  dueDateAfter?: string,
  dueDateBefore?: string
): Promise<DbResult<LocalTask[]>> {
  try {
    let collection = db.tasks.where("user_id").equals(userId);
    let tasks = await collection.toArray();

    // In-memory filtering since Dexie doesn't easily support multiple ranges on different properties
    if (updatedAfter) tasks = tasks.filter(t => t.updated_at && t.updated_at >= updatedAfter);
    if (updatedBefore) tasks = tasks.filter(t => t.updated_at && t.updated_at <= updatedBefore);
    if (dueDateAfter) tasks = tasks.filter(t => t.due_date && t.due_date >= dueDateAfter);
    if (dueDateBefore) tasks = tasks.filter(t => t.due_date && t.due_date <= dueDateBefore);

    tasks.sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));
    return ok(tasks);
  } catch (error: any) {
    return err(error.message);
  }
}

export async function createLocalTask(task: TaskInsert): Promise<DbResult<LocalTask>> {
  try {
    const id = task.id || crypto.randomUUID();
    const now = new Date().toISOString();
    
    const localTask: LocalTask = {
      id,
      user_id: task.user_id,
      label: task.label,
      due_date: task.due_date ?? null,
      metadata: task.metadata ?? null,
      completed_at: task.completed_at ?? null,
      created_at: task.created_at ?? now,
      updated_at: task.updated_at ?? now,
      sync_status: "pending"
    };

    const queueEntry: SyncQueueEntry = {
      id: crypto.randomUUID(),
      table_name: "tasks",
      operation: "INSERT",
      record_id: id,
      payload: localTask,
      created_at: now
    };

    await db.transaction("rw", db.tasks, db.sync_queue, async () => {
      await db.tasks.add(localTask);
      await db.sync_queue.add(queueEntry);
    });

    return ok(localTask);
  } catch (error: any) {
    return err(error.message);
  }
}

export async function updateLocalTask(id: string, updates: TaskUpdate): Promise<DbResult<LocalTask>> {
  try {
    const now = new Date().toISOString();
    
    const finalUpdates = {
      ...updates,
      updated_at: now,
      sync_status: "pending" as const
    };

    const queueEntry: SyncQueueEntry = {
      id: crypto.randomUUID(),
      table_name: "tasks",
      operation: "UPDATE",
      record_id: id,
      payload: updates, // Only the actual updates, not full object
      created_at: now
    };

    await db.transaction("rw", db.tasks, db.sync_queue, async () => {
      await db.tasks.update(id, finalUpdates);
      await db.sync_queue.add(queueEntry);
    });

    const updated = await db.tasks.get(id);
    if (!updated) throw new Error("Task not found after update");
    return ok(updated);
  } catch (error: any) {
    return err(error.message);
  }
}

export async function deleteLocalTask(id: string): Promise<DbResult<null>> {
  try {
    const now = new Date().toISOString();
    
    const queueEntry: SyncQueueEntry = {
      id: crypto.randomUUID(),
      table_name: "tasks",
      operation: "DELETE",
      record_id: id,
      payload: null,
      created_at: now
    };

    await db.transaction("rw", db.tasks, db.sync_queue, async () => {
      await db.tasks.delete(id);
      await db.sync_queue.add(queueEntry);
    });

    return ok(null);
  } catch (error: any) {
    return err(error.message);
  }
}
