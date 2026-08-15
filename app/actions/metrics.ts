"use server"

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getGlobalMetrics, enrollInMetric, createCustomMetric, logMetricEntry, getMetricEntries } from "@/lib/db/metrics";
import { revalidatePath } from "next/cache";

export async function getGlobalMetricsAction() {
  const supabase = await createSupabaseServerClient();
  const result = await getGlobalMetrics(supabase);
  if (result.error) throw new Error(result.error.message);
  return result.data;
}

export async function getUserMetricsAction() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  const result = await import("@/lib/db/metrics").then(m => m.getUserMetrics(supabase, user.id));
  if (result.error) throw new Error(result.error.message);
  return result.data;
}

export async function enrollMetricAction(metricId: string, targetValue?: number) {
  // TODO: Add rate limits here before publishing

  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  const result = await enrollInMetric(supabase, user.id, metricId, targetValue);

  if (result.error) {
    throw new Error(result.error.message);
  }

  revalidatePath("/metrics");
  return result.data;
}

export async function createCustomMetricAction(name: string, type: string, polarity: string) {
  // TODO: Add rate limits here before publishing

  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  const result = await createCustomMetric(supabase, user.id, name, type, polarity);

  if (result.error) {
    throw new Error(result.error.message);
  }

  // Auto-enroll the user into their custom metric
  await enrollInMetric(supabase, user.id, result.data.id);

  revalidatePath("/metrics");
  return result.data;
}

export async function logMetricEntryAction(userMetricId: string, value: number, timestamp: string) {
  // TODO: Add rate limits here before publishing

  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  const result = await logMetricEntry(supabase, userMetricId, value, timestamp);

  if (result.error) {
    throw new Error(result.error.message);
  }

  revalidatePath("/metrics");
  return result.data;
}

export async function getMetricEntriesAction(userMetricId: string, timeRange?: { from: string; to: string }) {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  const result = await getMetricEntries(supabase, userMetricId, timeRange);

  if (result.error) {
    throw new Error(result.error.message);
  }

  return result.data;
}
