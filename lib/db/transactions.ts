import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import type { OrbTransaction, DbResult, TransactionType } from "./types";
import { ok, err } from "./types";

type Client = SupabaseClient<Database>;

export type TransactionFilters = {
  type?: TransactionType;
  source?: string;
  limit?: number;
};

export async function getTransactionHistory(
  client: Client,
  userId: string,
  filters?: TransactionFilters
): Promise<DbResult<OrbTransaction[]>> {
  let query = client
    .from("orb_transactions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (filters?.type) {
    query = query.eq("type", filters.type);
  }
  if (filters?.source) {
    query = query.eq("source", filters.source);
  }
  
  const limit = filters?.limit ?? 50;
  query = query.limit(limit);

  const { data, error } = await query;
  if (error) return err(error.message);
  return ok(data);
}

export async function getOrbBalance(
  client: Client,
  userId: string
): Promise<DbResult<number>> {
  const { data, error } = await client
    .from("user_settings")
    .select("orbs")
    .eq("user_id", userId)
    .single();

  if (error) {
    // If setting doesn't exist, balance is effectively 0
    if (error.code === 'PGRST116') {
      return ok(0);
    }
    return err(error.message);
  }
  return ok(data.orbs ?? 0);
}
