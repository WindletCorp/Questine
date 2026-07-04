"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function toggleTaskStatus(taskId: string, newStatus: "pending" | "completed") {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Must be logged in to update tasks.");
  }

  const { error } = await supabase
    .from("tasks")
    .update({ 
      status: newStatus,
      completed_at: newStatus === "completed" ? new Date().toISOString() : null
    })
    .eq("id", taskId)
    .eq("user_id", user.id);

  if (error) {
    throw new Error("Failed to update task status");
  }

  revalidatePath("/home");
  revalidatePath("/catchup");
  return { success: true };
}

export async function updateMetricValue(metricLogId: string, newValue: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Must be logged in to update metrics.");
  }

  const { error } = await supabase
    .from("metric_logs")
    .update({ value: newValue })
    .eq("id", metricLogId)
    .eq("user_id", user.id);

  if (error) {
    throw new Error("Failed to update metric value");
  }

  revalidatePath("/home");
  revalidatePath("/catchup");
  return { success: true };
}

export async function updateJournalLog(logId: string, newContent: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Must be logged in");

  const { error } = await supabase
    .from("journal_logs")
    .update({ content: newContent })
    .eq("id", logId)
    .eq("user_id", user.id);

  if (error) throw new Error("Failed to update journal log");
  
  revalidatePath("/home");
  revalidatePath("/catchup");
  return { success: true };
}

export async function createJournalLog(content: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Must be logged in");

  const { error } = await supabase.from("journal_logs").insert({
    user_id: user.id,
    content
  });

  if (error) throw new Error("Failed to create journal log");
  revalidatePath("/home");
  return { success: true };
}

export async function createTask(title: string, date: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Must be logged in");

  const { error } = await supabase.from("tasks").insert({
    user_id: user.id,
    title,
    target_date: date,
    status: 'pending'
  });

  if (error) throw new Error("Failed to create task");
  revalidatePath("/home");
  return { success: true };
}

export async function updateTaskDetails(taskId: string, title: string, targetDate: string, linkedBlockId: string | null) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Must be logged in");

  const { error } = await supabase.from("tasks").update({
    title,
    target_date: targetDate,
    linked_block_id: linkedBlockId
  }).eq("id", taskId).eq("user_id", user.id);

  if (error) throw new Error("Failed to update task");
  revalidatePath("/home");
  return { success: true };
}

export async function deleteTask(taskId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Must be logged in");

  const { error } = await supabase.from("tasks").delete().eq("id", taskId).eq("user_id", user.id);
  if (error) throw new Error("Failed to delete task");
  revalidatePath("/home");
  return { success: true };
}

export async function createMetric(name: string, value: number, unit?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Must be logged in");

  // Find or create def
  let defId;
  const { data: existingDef } = await supabase.from("metric_definitions")
    .select("id").eq("user_id", user.id).ilike("name", name).single();
    
  if (existingDef) {
    defId = existingDef.id;
  } else {
    const { data: newDef, error: defErr } = await supabase.from("metric_definitions")
      .insert({ user_id: user.id, name, unit }).select("id").single();
    if (defErr) throw new Error("Failed to create metric definition");
    defId = newDef.id;
  }

  const { error } = await supabase.from("metric_logs").insert({
    user_id: user.id,
    metric_id: defId,
    value
  });

  if (error) throw new Error("Failed to create metric");
  revalidatePath("/home");
  return { success: true };
}
