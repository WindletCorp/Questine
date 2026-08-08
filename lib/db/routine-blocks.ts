import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import type { RoutineBlock, RoutineBlockInsert, RoutineBlockUpdate, DbResult } from "./types";
import { ok, err } from "./types";

type Client = SupabaseClient<Database>;

export async function getRoutineBlocks(client: Client, userId: string, startTimestamp?: string, endTimestamp?: string): Promise<DbResult<RoutineBlock[]>> {
  let query = client
    .from("routine_blocks")
    .select("*")
    .eq("user_id", userId);

  if (startTimestamp) {
    query = query.gte("start_time", startTimestamp);
  } else {
    // Default: 24 hours in the past
    const defaultStart = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    query = query.gte("start_time", defaultStart);
  }

  if (endTimestamp) {
    query = query.lte("start_time", endTimestamp);
  } else {
    // Default: 24 hours in the future
    const defaultEnd = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    query = query.lte("start_time", defaultEnd);
  }

  const { data, error } = await query.order("start_time", { ascending: true });

  if (error) return err(error.message);
  return ok(data);
}

export async function createRoutineBlock(client: Client, block: RoutineBlockInsert): Promise<DbResult<RoutineBlock>> {
  const { data, error } = await client
    .from("routine_blocks")
    .insert(block)
    .select()
    .single();

  if (error) return err(error.message);
  return ok(data);
}

export async function updateRoutineBlock(client: Client, id: string, updates: RoutineBlockUpdate): Promise<DbResult<RoutineBlock>> {
  const { data, error } = await client
    .from("routine_blocks")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return err(error.message);
  return ok(data);
}

export async function deleteRoutineBlock(client: Client, id: string): Promise<DbResult<null>> {
  const { error } = await client
    .from("routine_blocks")
    .delete()
    .eq("id", id);

  if (error) return err(error.message);
  return ok(null);
}
