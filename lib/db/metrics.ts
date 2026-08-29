import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import type { DbResult, MetricDefinition, MetricSubscription, MetricEntry } from "./types";
import { ok, err } from "./types";
import { handleDbError } from "./errors";

type Client = SupabaseClient<Database>;

export async function getGlobalMetrics(
  client: Client
): Promise<DbResult<MetricDefinition[]>> {
  const { data, error } = await client
    .from("metric_definitions")
    .select("*")
    .eq("is_global", true);

  if (error) return err(handleDbError(error));
  return ok(data);
}

export type EnrolledMetric = MetricSubscription & { metric_definition: MetricDefinition };

export async function getUserSubscriptions(
  client: Client,
  userId: string
): Promise<DbResult<EnrolledMetric[]>> {
  const { data, error } = await client
    .from("metric_subscriptions")
    .select(`
      *,
      metric_definition:metric_definitions(*)
    `)
    .eq("user_id", userId);

  if (error) return err(handleDbError(error));
  
  // Note: the joined data might be an array depending on foreign key setup,
  // but since it's a many-to-one it should be an object. We'll cast it to match EnrolledMetric.
  return ok(data as unknown as EnrolledMetric[]);
}

export async function subscribe(
  client: Client,
  userId: string,
  metricId: string,
  targetValue?: number
): Promise<DbResult<MetricSubscription>> {
  const { data, error } = await client
    .from("metric_subscriptions")
    .upsert({
      user_id: userId,
      metric_id: metricId,
      target_value: targetValue ?? null,
      is_active: true,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id,metric_id' })
    .select()
    .single();

  if (error) return err(handleDbError(error));
  return ok(data);
}

export async function unsubscribe(
  client: Client,
  userId: string,
  metricId: string
): Promise<DbResult<null>> {
  const { error } = await client
    .from("metric_subscriptions")
    .delete()
    .eq("user_id", userId)
    .eq("metric_id", metricId);

  if (error) return err(handleDbError(error));
  return ok(null);
}

export async function createCustomMetric(
  client: Client,
  userId: string,
  name: string,
  type: string = 'boolean',
  polarity: string = 'positive'
): Promise<DbResult<MetricDefinition>> {
  const { data, error } = await client
    .from("metric_definitions")
    .insert({
      name,
      type,
      polarity,
      is_global: false,
      created_by: userId,
    })
    .select()
    .single();

  if (error) return err(handleDbError(error));
  
  // Auto-subscribe the user
  const subResult = await subscribe(client, userId, data.id);
  if (subResult.error) {
    return err(subResult.error);
  }

  return ok(data);
}

export async function logEntry(
  client: Client,
  userId: string,
  metricId: string,
  value: number,
  startTime: string,
  endTime?: string
): Promise<DbResult<MetricEntry>> {
  const { data, error } = await client
    .from("metric_entries")
    .insert({
      user_id: userId,
      metric_id: metricId,
      value,
      start_time: startTime,
      end_time: endTime ?? startTime,
    })
    .select()
    .single();

  if (error) return err(handleDbError(error));
  return ok(data);
}

export async function getEntries(
  client: Client,
  userId: string,
  metricId?: string,
  timeRange?: { from: string; to: string }
): Promise<DbResult<MetricEntry[]>> {
  let query = client
    .from("metric_entries")
    .select("*")
    .eq("user_id", userId)
    .order("start_time", { ascending: false });

  if (metricId) {
    query = query.eq("metric_id", metricId);
  }

  if (timeRange) {
    query = query.gte("start_time", timeRange.from).lte("start_time", timeRange.to);
  }

  const { data, error } = await query;

  if (error) return err(handleDbError(error));
  return ok(data);
}
