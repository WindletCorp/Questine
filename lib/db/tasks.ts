import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Task, TaskInsert, TaskUpdate, DbResult, Waypoint, TaskMetadata } from "./types";
import { ok, err } from "./types";

type Client = SupabaseClient<Database>;

export async function getTasks(client: Client, userId: string, updatedAfter?: string, updatedBefore?: string, startTimeAfter?: string, startTimeBefore?: string, endTimeAfter?: string, endTimeBefore?: string): Promise<DbResult<Task[]>> {
  let query = client
    .from("tasks")
    .select("*")
    .eq("user_id", userId);

  if (updatedAfter) {
    query = query.gte("updated_at", updatedAfter);
  } else {
    const defaultStart = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    query = query.gte("updated_at", defaultStart);
  }

  if (updatedBefore) {
    query = query.lte("updated_at", updatedBefore);
  } else {
    const defaultEnd = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    query = query.lte("updated_at", defaultEnd);
  }

  if (startTimeAfter) {
    query = query.gte("start_time", startTimeAfter);
  }
  if (startTimeBefore) {
    query = query.lte("start_time", startTimeBefore);
  }
  if (endTimeAfter) {
    query = query.gte("end_time", endTimeAfter);
  }
  if (endTimeBefore) {
    query = query.lte("end_time", endTimeBefore);
  }

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) return err(error.message);
  // We can return data directly now that Database is overridden globally
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
