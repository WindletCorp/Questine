import { db, type LocalTask, type SyncQueueEntry } from "./index";
import type { TaskInsert, TaskUpdate, DbResult, Task } from "../db/types";
import { ok, err, type TaskMetadata, type Waypoint } from "../db/types";

export async function getLocalTasks(
  userId: string,
  updatedAfter?: string,
  updatedBefore?: string,
  startTimeAfter?: string,
  startTimeBefore?: string,
  endTimeAfter?: string,
  endTimeBefore?: string
): Promise<DbResult<LocalTask[]>> {
  try {
    let collection = db.tasks.where("user_id").equals(userId);
    let tasks = await collection.toArray();

    // In-memory filtering since Dexie doesn't easily support multiple ranges on different properties
    if (updatedAfter) tasks = tasks.filter(t => t.updated_at && t.updated_at >= updatedAfter);
    if (updatedBefore) tasks = tasks.filter(t => t.updated_at && t.updated_at <= updatedBefore);
    if (startTimeAfter) tasks = tasks.filter(t => t.start_time && t.start_time >= startTimeAfter);
    if (startTimeBefore) tasks = tasks.filter(t => t.start_time && t.start_time <= startTimeBefore);
    if (endTimeAfter) tasks = tasks.filter(t => t.end_time && t.end_time >= endTimeAfter);
    if (endTimeBefore) tasks = tasks.filter(t => t.end_time && t.end_time <= endTimeBefore);

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
      start_time: task.start_time ?? null,
      end_time: task.end_time ?? null,
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

export async function addLocalWaypoint(taskId: string, waypoint: Waypoint): Promise<DbResult<LocalTask>> {
  try {
    const task = await db.tasks.get(taskId);
    if (!task) return err("Task not found");

    const metadata: TaskMetadata = (task.metadata as TaskMetadata) || {};
    const waypoints: Waypoint[] = metadata.waypoints || [];
    
    waypoints.push(waypoint);
    metadata.waypoints = waypoints;

    return updateLocalTask(taskId, { metadata });
  } catch (error: any) {
    return err(error.message);
  }
}

export async function updateLocalWaypoint(taskId: string, waypointOrder: number, updates: Partial<Waypoint>): Promise<DbResult<LocalTask>> {
  try {
    const task = await db.tasks.get(taskId);
    if (!task) return err("Task not found");

    const metadata: TaskMetadata = (task.metadata as TaskMetadata) || {};
    const waypoints: Waypoint[] = metadata.waypoints || [];
    
    const index = waypoints.findIndex((w: Waypoint) => w.order === waypointOrder);
    if (index === -1) return err("Waypoint not found");

    waypoints[index] = { ...waypoints[index], ...updates };
    metadata.waypoints = waypoints;

    return updateLocalTask(taskId, { metadata });
  } catch (error: any) {
    return err(error.message);
  }
}

export async function removeLocalWaypoint(taskId: string, waypointOrder: number): Promise<DbResult<LocalTask>> {
  try {
    const task = await db.tasks.get(taskId);
    if (!task) return err("Task not found");

    const metadata: TaskMetadata = (task.metadata as TaskMetadata) || {};
    const waypoints: Waypoint[] = metadata.waypoints || [];
    
    metadata.waypoints = waypoints.filter((w: Waypoint) => w.order !== waypointOrder);

    return updateLocalTask(taskId, { metadata });
  } catch (error: any) {
    return err(error.message);
  }
}
