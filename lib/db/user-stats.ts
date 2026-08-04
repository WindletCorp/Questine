import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import type { UserStats, DbResult } from "./types";
import { ok, err } from "./types";

type Client = SupabaseClient<Database>;

export async function getUserStats(
  client: Client,
  userId: string
): Promise<DbResult<UserStats>> {
  const { data, error } = await client
    .from("user_stats")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) return err(error.message);
  return ok(data as UserStats);
}
