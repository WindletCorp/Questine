"use server";

import { createClient } from "@/lib/supabase/server";

interface SaveRoutineBlock {
  start_time: string;
  end_time: string;
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

  // 1. Find or create day_snapshot
  const { data: snapshot, error: snapshotError } = await supabase
    .from("day_snapshots")
    .select("id, plan_routine_id")
    .eq("user_id", user.id)
    .eq("date", date)
    .single();

  if (snapshotError && snapshotError.code !== 'PGRST116') {
    // PGRST116 is not found
    throw new Error(`Failed to fetch day snapshot: ${snapshotError.message}`);
  }

  let snapshotId = snapshot?.id;

  if (!snapshot) {
    const { data: newSnapshot, error: createSnapshotError } = await supabase
      .from("day_snapshots")
      .insert({ user_id: user.id, date })
      .select("id")
      .single();
    
    if (createSnapshotError) throw new Error(`Failed to create snapshot: ${createSnapshotError.message}`);
    snapshotId = newSnapshot.id;
  }

  // 2. If there's an existing plan_routine, we could delete it to start fresh
  if (snapshot?.plan_routine_id) {
    await supabase.from("routines").delete().eq("id", snapshot.plan_routine_id);
  }

  // 3. Create new routine
  const { data: routine, error: routineError } = await supabase
    .from("routines")
    .insert({
      day_snapshot_id: snapshotId,
      type: "plan",
      generated_at: new Date().toISOString()
    })
    .select("id")
    .single();

  if (routineError) throw new Error(`Failed to create routine: ${routineError.message}`);

  // 4. Update snapshot with plan_routine_id
  await supabase
    .from("day_snapshots")
    .update({ plan_routine_id: routine.id })
    .eq("id", snapshotId);

  // 5. Insert blocks
  const blocksToInsert = blocks.map((b, idx) => ({
    routine_id: routine.id,
    start_time: b.start_time,
    end_time: b.end_time,
    label: b.label,
    category: b.category,
    source: b.source,
    order_index: idx
  }));

  const { error: blocksError } = await supabase
    .from("routine_blocks")
    .insert(blocksToInsert);

  if (blocksError) throw new Error(`Failed to save routine blocks: ${blocksError.message}`);

  return { success: true, routineId: routine.id };
}
