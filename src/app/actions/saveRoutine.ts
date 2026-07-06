"use server";

import { createClient } from "@/lib/supabase/server";

interface SaveRoutineBlock {
  start_time: string; // Absolute ISO string
  end_time: string;   // Absolute ISO string
  label: string;
  category: string;
  source: "ai" | "manual";
}

export async function saveRoutine(date: string, blocks: SaveRoutineBlock[]) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be logged in to save a routine.");
  }

  const startOfDay = new Date(`${date}T00:00:00.000Z`).toISOString();
  const endOfDay = new Date(new Date(startOfDay).getTime() + 24 * 60 * 60 * 1000).toISOString();

  // 1. Delete existing 'plan' blocks for this date window
  await supabase
    .from("timeline_blocks")
    .delete()
    .eq("user_id", user.id)
    .eq("type", "plan")
    .gte("start_time", startOfDay)
    .lt("start_time", endOfDay);

  // 2. Insert new plan blocks
  if (blocks.length === 0) return { success: true };

  const blocksToInsert = blocks.map((b) => ({
    user_id: user.id,
    start_time: b.start_time,
    end_time: b.end_time,
    label: b.label,
    color: b.category, // Storing category in color for now based on old logic
    type: "plan" as const,
    source: b.source,
  }));

  const { error: blocksError } = await supabase
    .from("timeline_blocks")
    .insert(blocksToInsert);

  if (blocksError) throw new Error(`Failed to save timeline blocks: ${blocksError.message}`);

  return { success: true };
}
