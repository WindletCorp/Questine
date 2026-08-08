import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import type { Task, TaskInsert, TaskUpdate, DbResult } from "./types";
import { ok, err } from "./types";

type Client = SupabaseClient<Database>;

export async function getTasks(client: Client, userId: string, updatedAfter?: string, updatedBefore?: string, dueDateAfter?: string, dueDateBefore?: string): Promise<DbResult<Task[]>> {
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

  if (dueDateAfter) {
    query = query.gte("due_date", dueDateAfter);
  }
  if (dueDateBefore) {
    query = query.lte("due_date", dueDateBefore);
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
