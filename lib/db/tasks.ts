import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import type { Task, TaskInsert, TaskUpdate, DbResult } from "./types";
import { ok, err } from "./types";

type Client = SupabaseClient<Database>;

export async function getTasks(client: Client, userId: string): Promise<DbResult<Task[]>> {
  const { data, error } = await client
    .from("tasks")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

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
