import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import type { RoutineBlock, RoutineBlockInsert, RoutineBlockUpdate, DbResult } from "./types";
import { ok, err } from "./types";
import { handleDbError } from "./errors";

type Client = SupabaseClient<Database>;

export type GetRoutineBlocksOptions = {
  /** Overlap filter: return blocks where start_time <= to AND end_time >= from */
  from?: string;
  to?: string;
};

export async function getRoutineBlocks(client: Client, userId: string, opts: GetRoutineBlocksOptions = {}): Promise<DbResult<RoutineBlock[]>> {
  let query = client
    .from("routine_blocks")
    .select("*")
    .eq("user_id", userId);

  const { from, to } = opts;

  if (from || to) {
    if (from) query = query.gte("end_time", from);
    if (to) query = query.lte("start_time", to);
  } else {
    // Default: 48-hour window
    const defaultStart = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const defaultEnd = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    query = query.gte("start_time", defaultStart).lte("start_time", defaultEnd);
  }

  const { data, error } = await query.order("start_time", { ascending: true });

  if (error) return err(handleDbError(error));
  return ok(data);
}

export async function createRoutineBlock(client: Client, block: RoutineBlockInsert): Promise<DbResult<RoutineBlock>> {
  const { data, error } = await client
    .from("routine_blocks")
    .insert(block)
    .select()
    .single();

  if (error) return err(handleDbError(error));
  return ok(data);
}

export async function updateRoutineBlock(client: Client, id: string, updates: RoutineBlockUpdate): Promise<DbResult<RoutineBlock>> {
  const { data, error } = await client
    .from("routine_blocks")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return err(handleDbError(error));
  return ok(data);
}

export async function deleteRoutineBlock(client: Client, id: string): Promise<DbResult<null>> {
  const { error } = await client
    .from("routine_blocks")
    .delete()
    .eq("id", id);

  if (error) return err(handleDbError(error));
  return ok(null);
}
