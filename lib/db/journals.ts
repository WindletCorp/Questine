import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import type { Journal, JournalInsert, JournalUpdate, DbResult } from "./types";
import { ok, err } from "./types";
import { handleDbError } from "./errors";

type Client = SupabaseClient<Database>;

export type GetJournalsOptions = {
  /** Overlap filter: return journals where start_time <= to AND end_time >= from */
  from?: string;
  to?: string;
};

export async function getJournals(client: Client, userId: string, opts: GetJournalsOptions = {}): Promise<DbResult<Journal[]>> {
  let query = client
    .from("journals")
    .select("*")
    .eq("user_id", userId)
    .is("deleted_at", null);

  const { from, to } = opts;

  if (from || to) {
    if (from) query = query.gte("end_time", from);
    if (to) query = query.lte("start_time", to);
  } else {
    // Default: 48-hour window
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    query = query.gte("start_time", yesterday).lte("start_time", tomorrow);
  }

  const { data, error } = await query.order("start_time", { ascending: false });

  if (error) return err(handleDbError(error));
  return ok(data);
}

export async function createJournal(client: Client, journal: JournalInsert): Promise<DbResult<Journal>> {
  const { data, error } = await client
    .from("journals")
    .insert(journal)
    .select()
    .single();

  if (error) return err(handleDbError(error));
  return ok(data);
}

export async function updateJournal(client: Client, id: string, updates: JournalUpdate): Promise<DbResult<Journal>> {
  const { data, error } = await client
    .from("journals")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return err(handleDbError(error));
  return ok(data);
}

export async function deleteJournal(client: Client, id: string): Promise<DbResult<null>> {
  const { error } = await client
    .from("journals")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return err(handleDbError(error));
  return ok(null);
}
