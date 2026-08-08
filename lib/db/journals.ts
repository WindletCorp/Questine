import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import type { Journal, JournalInsert, JournalUpdate, DbResult } from "./types";
import { ok, err } from "./types";

type Client = SupabaseClient<Database>;

export async function getJournals(client: Client, userId: string, startTimeAfter?: string, startTimeBefore?: string): Promise<DbResult<Journal[]>> {
  let query = client
    .from("journals")
    .select("*")
    .eq("user_id", userId);

  if (startTimeAfter) {
    query = query.gte("start_time", startTimeAfter);
  } else {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    query = query.gte("start_time", yesterday);
  }

  if (startTimeBefore) {
    query = query.lte("start_time", startTimeBefore);
  } else {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    query = query.lte("start_time", tomorrow);
  }

  const { data, error } = await query.order("start_time", { ascending: false });

  if (error) return err(error.message);
  return ok(data);
}

export async function createJournal(client: Client, journal: JournalInsert): Promise<DbResult<Journal>> {
  const { data, error } = await client
    .from("journals")
    .insert(journal)
    .select()
    .single();

  if (error) return err(error.message);
  return ok(data);
}

export async function updateJournal(client: Client, id: string, updates: JournalUpdate): Promise<DbResult<Journal>> {
  const { data, error } = await client
    .from("journals")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return err(error.message);
  return ok(data);
}

export async function deleteJournal(client: Client, id: string): Promise<DbResult<null>> {
  const { error } = await client
    .from("journals")
    .delete()
    .eq("id", id);

  if (error) return err(error.message);
  return ok(null);
}
