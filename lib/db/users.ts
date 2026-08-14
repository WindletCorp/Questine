import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import type { UserProfile, UserProfileUpdate, UserSettings, UserSettingsUpdate, DbResult } from "./types";
import { ok, err } from "./types";
import { handleDbError } from "./errors";

type Client = SupabaseClient<Database>;

export async function getUserProfile(
  client: Client,
  userId: string
): Promise<DbResult<UserProfile>> {
  const { data, error } = await client
    .from("user_profiles")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) return err(handleDbError(error));
  return ok(data as UserProfile);
}

export async function updateUserProfile(
  client: Client,
  userId: string,
  updates: UserProfileUpdate
): Promise<DbResult<UserProfile>> {
  const { data, error } = await client
    .from("user_profiles")
    .update(updates)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) return err(handleDbError(error));
  return ok(data as UserProfile);
}

export async function getUserSettings(
  client: Client,
  userId: string
): Promise<DbResult<UserSettings>> {
  const { data, error } = await client
    .from("user_settings")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) return err(handleDbError(error));
  return ok(data as UserSettings);
}

export async function updateUserSettings(
  client: Client,
  userId: string,
  updates: UserSettingsUpdate
): Promise<DbResult<UserSettings>> {
  const { data, error } = await client
    .from("user_settings")
    .update(updates)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) return err(handleDbError(error));
  return ok(data as UserSettings);
}
