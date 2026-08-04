import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import type { UserProfile, DbResult } from "./types";
import { ok, err } from "./types";

type Client = SupabaseClient<Database>;

export async function getUserProfile(
  client: Client,
  userId: string
): Promise<DbResult<UserProfile>> {
  const { data, error } = await client
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) return err(error.message);
  return ok(data as UserProfile);
}
