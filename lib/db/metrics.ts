import type { SupabaseClient } from "@supabase/supabase-js";
import type { DbResult, MetricDefinition, UserMetric, MetricEntry } from "./types";
import { ok, err } from "./types";
import { handleDbError } from "./errors";

// Use any to bypass generated types until supabase gen types is run again
type Client = SupabaseClient<any, "public", any>;

export async function getGlobalMetrics(
  client: Client
): Promise<DbResult<MetricDefinition[]>> {
  const { data, error } = await client
    .from("metric_definitions")
    .select("*")
    .eq("is_global", true);

  if (error) return err(handleDbError(error as any));
  return ok(data as MetricDefinition[]);
}

export type EnrolledMetric = UserMetric & { metric_definition: MetricDefinition };

export async function getUserMetrics(
  client: Client,
  userId: string
): Promise<DbResult<EnrolledMetric[]>> {
  const { data, error } = await client
    .from("user_metrics")
    .select(`
      *,
      metric_definition:metric_definitions(*)
    `)
    .eq("user_id", userId);

  if (error) return err(handleDbError(error as any));
  return ok(data as EnrolledMetric[]);
}

export async function enrollInMetric(
  client: Client,
  userId: string,
  metricId: string,
  targetValue?: number
): Promise<DbResult<UserMetric>> {
  const { data, error } = await client
    .from("user_metrics")
    .insert({
      user_id: userId,
      metric_id: metricId,
      target_value: targetValue,
    })
    .select()
    .single();

  if (error) return err(handleDbError(error as any));
  return ok(data as UserMetric);
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

  if (error) return err(handleDbError(error as any));
  return ok(data as MetricDefinition);
}

export async function logMetricEntry(
  client: Client,
  userMetricId: string,
  value: number,
  timestamp: string
): Promise<DbResult<MetricEntry>> {
  const { data, error } = await client
    .from("metric_entries")
    .insert({
      user_metric_id: userMetricId,
      value,
      timestamp,
    })
    .select()
    .single();

  if (error) return err(handleDbError(error as any));
  return ok(data as MetricEntry);
}

export async function getMetricEntries(
  client: Client,
  userMetricId: string,
  timeRange?: { from: string; to: string }
): Promise<DbResult<MetricEntry[]>> {
  let query = client
    .from("metric_entries")
    .select("*")
    .eq("user_metric_id", userMetricId)
    .order("timestamp", { ascending: false });

  if (timeRange) {
    query = query.gte("timestamp", timeRange.from).lte("timestamp", timeRange.to);
  }

  const { data, error } = await query;

  if (error) return err(handleDbError(error as any));
  return ok(data as MetricEntry[]);
}

