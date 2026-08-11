import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Task, TaskInsert, TaskUpdate, DbResult, Waypoint, TaskMetadata } from "./types";
import { ok, err } from "./types";

type Client = SupabaseClient<Database>;

export type GetTasksOptions = {
  /** Overlap filter: return tasks where start_time <= to AND end_time >= from */
  from?: string;
  to?: string;
  /** Fallback filter on updated_at (used when from/to are not specified) */
  updatedAfter?: string;
  updatedBefore?: string;
};

export async function getTasks(client: Client, userId: string, opts: GetTasksOptions = {}): Promise<DbResult<Task[]>> {
  let query = client
    .from("tasks")
    .select("*")
    .eq("user_id", userId);

  const { from, to, updatedAfter, updatedBefore } = opts;

  if (from || to) {
    // Overlap semantics: task overlaps window when start_time <= to AND end_time >= from
    if (from) query = query.gte("end_time", from);
    if (to) query = query.lte("start_time", to);
  } else {
    // Default: filter by updated_at within a 48-hour window
    const defaultStart = updatedAfter ?? new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const defaultEnd = updatedBefore ?? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    query = query.gte("updated_at", defaultStart).lte("updated_at", defaultEnd);
  }

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) return err(error.message);
  return ok(data);
}

export async function createTask(client: Client, task: TaskInsert): Promise<DbResult<Task>> {
  const { data, error } = await client
    .from("tasks")
    .insert(task)
    .select()
    .single();

  if (error) return err(error.message);
  return ok(data);
}

export async function updateTask(client: Client, id: string, updates: TaskUpdate): Promise<DbResult<Task>> {
  const { data, error } = await client
    .from("tasks")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return err(error.message);
  return ok(data);
}

export async function deleteTask(client: Client, id: string): Promise<DbResult<null>> {
  const { error } = await client
    .from("tasks")
    .delete()
    .eq("id", id);

  if (error) return err(error.message);
  return ok(null);
}

// Waypoint Helpers

export async function addWaypoint(client: Client, taskId: string, waypoint: Waypoint): Promise<DbResult<Task>> {
  const { data: task, error: fetchError } = await client.from("tasks").select("metadata").eq("id", taskId).single();
  if (fetchError) return err(fetchError.message);

  const metadata: TaskMetadata = (task.metadata as TaskMetadata) || {};
  const waypoints: Waypoint[] = metadata.waypoints || [];
  
  waypoints.push(waypoint);
  metadata.waypoints = waypoints;

  return updateTask(client, taskId, { metadata });
}

export async function updateWaypoint(client: Client, taskId: string, waypointOrder: number, updates: Partial<Waypoint>): Promise<DbResult<Task>> {
  const { data: task, error: fetchError } = await client.from("tasks").select("metadata").eq("id", taskId).single();
  if (fetchError) return err(fetchError.message);

  const metadata: TaskMetadata = (task.metadata as TaskMetadata) || {};
  const waypoints: Waypoint[] = metadata.waypoints || [];
  
  const index = waypoints.findIndex((w: Waypoint) => w.order === waypointOrder);
  if (index === -1) return err("Waypoint not found");

  waypoints[index] = { ...waypoints[index], ...updates };
  metadata.waypoints = waypoints;

  return updateTask(client, taskId, { metadata });
}

export async function removeWaypoint(client: Client, taskId: string, waypointOrder: number): Promise<DbResult<Task>> {
  const { data: task, error: fetchError } = await client.from("tasks").select("metadata").eq("id", taskId).single();
  if (fetchError) return err(fetchError.message);

  const metadata: TaskMetadata = (task.metadata as TaskMetadata) || {};
  const waypoints: Waypoint[] = metadata.waypoints || [];
  
  metadata.waypoints = waypoints.filter((w: Waypoint) => w.order !== waypointOrder);

  return updateTask(client, taskId, { metadata });
}
