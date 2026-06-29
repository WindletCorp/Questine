"use server";

import { createClient } from "@/lib/supabase/server";
import { RoutineBlock } from "@/components/routine/RoutineViewer";

export async function claimTrialData(globalContext: string, blocks: Omit<RoutineBlock, 'id'>[]) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { error: "You must be logged in to claim trial data. Please check if your account requires email confirmation." };
    }

    // 1. Update profile with global context
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ global_context: globalContext })
      .eq("id", user.id);
    
    if (profileError) return { error: `Profile update failed: ${profileError.message}` };

    // 2. Create day_snapshot for today
    const today = new Date().toISOString().split('T')[0];
    const { data: snapshot, error: snapshotError } = await supabase
      .from("day_snapshots")
      .insert({
        user_id: user.id,
        date: today
      })
      .select()
      .single();

    if (snapshotError) return { error: `Snapshot creation failed: ${snapshotError.message}` };

    // 3. Create a plan routine
    const { data: routine, error: routineError } = await supabase
      .from("routines")
      .insert({
        day_snapshot_id: snapshot.id,
        type: "plan",
        generated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (routineError) return { error: `Routine creation failed: ${routineError.message}` };

    // 4. Update the snapshot with the plan_routine_id
    const { error: snapshotUpdateError } = await supabase
      .from("day_snapshots")
      .update({ plan_routine_id: routine.id })
      .eq("id", snapshot.id);
      
    if (snapshotUpdateError) return { error: `Snapshot link failed: ${snapshotUpdateError.message}` };

    // 5. Insert blocks
    const blocksToInsert = blocks.map((b, idx) => ({
      routine_id: routine.id,
      start_time: b.start_time,
      end_time: b.end_time,
      label: b.label,
      source: b.source,
      order_index: b.order_index || idx
    }));

    const { error: blocksError } = await supabase
      .from("routine_blocks")
      .insert(blocksToInsert);
      
    if (blocksError) return { error: `Blocks insertion failed: ${blocksError.message}` };

    return { success: true };
  } catch (err: any) {
    console.error("claimTrialData SERVER ERROR:", err);
    return { error: err.message || "An unexpected error occurred." };
  }
}


