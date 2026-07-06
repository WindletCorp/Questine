"use server";

import { createClient } from "@/lib/supabase/server";

export interface SaveRoutineBlock {
  start_time: string; // e.g. "09:00:00" or "09:00"
  end_time: string;
  label: string;
  category: string;
  source: "ai" | "manual";
}

export interface SaveTask {
  title: string;
  status: "pending" | "completed";
  target_date?: string;
}

export interface SaveMetric {
  name: string;
  unit?: string;
  value: number;
}

export async function saveCatchUp(
  date: string,
  journalText: string,
  blocks: SaveRoutineBlock[],
  tasks: SaveTask[] = [],
  metrics: SaveMetric[] = []
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be logged in to save a catch-up routine.");
  }

  // 1. Insert Journal Log
  const { data: journalLog, error: journalError } = await supabase
    .from("journal_logs")
    .insert({
      user_id: user.id,
      content: journalText,
    })
    .select("id")
    .single();

  if (journalError) throw new Error(`Failed to save journal log: ${journalError.message}`);

  const startOfDay = new Date(`${date}T00:00:00.000Z`).toISOString();
  const endOfDay = new Date(new Date(startOfDay).getTime() + 24 * 60 * 60 * 1000).toISOString();

  // 2. Delete existing 'actual' blocks for this date window
  await supabase
    .from("timeline_blocks")
    .delete()
    .eq("user_id", user.id)
    .eq("type", "actual")
    .gte("start_time", startOfDay)
    .lt("start_time", endOfDay);

  // 3. Insert new actual blocks
  if (blocks.length > 0) {
    const blocksToInsert = blocks.map((b) => ({
        user_id: user.id,
        start_time: b.start_time,
        end_time: b.end_time,
        label: b.label,
        color: b.category,
        type: "actual" as const,
        source: b.source,
    }));

    const { error: blocksError } = await supabase.from("timeline_blocks").insert(blocksToInsert);
    if (blocksError) throw new Error(`Failed to save timeline blocks: ${blocksError.message}`);
  }

  // 4. Handle Tasks
  if (tasks.length > 0) {
    const tasksToInsert = tasks.map(t => ({
      user_id: user.id,
      title: t.title,
      status: t.status,
      target_date: t.target_date || date,
      completed_at: t.status === 'completed' ? new Date().toISOString() : null
    }));
    const { error: tasksError } = await supabase.from("tasks").insert(tasksToInsert);
    if (tasksError) throw new Error(`Failed to save tasks: ${tasksError.message}`);
  }

  // 5. Handle Metrics (AI Auto-Schema)
  if (metrics.length > 0) {
    for (const metric of metrics) {
      // Find or create metric definition
      let metricDefId;
      const { data: existingDef } = await supabase
        .from("metric_definitions")
        .select("id")
        .eq("user_id", user.id)
        .ilike("name", metric.name) // Case insensitive match
        .single();
      
      if (existingDef) {
        metricDefId = existingDef.id;
      } else {
        const { data: newDef, error: defError } = await supabase
          .from("metric_definitions")
          .insert({
            user_id: user.id,
            name: metric.name,
            unit: metric.unit,
          })
          .select("id")
          .single();
        if (defError) throw new Error(`Failed to create metric definition: ${defError.message}`);
        metricDefId = newDef.id;
      }

      // Insert metric log
      const { error: logError } = await supabase
        .from("metric_logs")
        .insert({
          user_id: user.id,
          metric_id: metricDefId,
          value: metric.value,
          journal_log_id: journalLog.id
        });
      
      if (logError) throw new Error(`Failed to log metric: ${logError.message}`);
    }
  }

  return { success: true };
}
