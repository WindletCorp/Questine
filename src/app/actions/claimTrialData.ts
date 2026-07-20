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

    // 1. Fetch profile to check if trial was already claimed
    const { data: profile, error: fetchProfileError } = await supabase
      .from("profiles")
      .select("has_claimed_trial")
      .eq("id", user.id)
      .single();

    if (fetchProfileError) {
      return { error: `Profile fetch failed: ${fetchProfileError.message}` };
    }

    if (profile?.has_claimed_trial) {
      return { alreadyClaimed: true };
    }

    // 2. Update profile with global context and set has_claimed_trial
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ 
        global_context: globalContext,
        has_claimed_trial: true 
      })
      .eq("id", user.id);
    
    if (profileError) return { error: `Profile update failed: ${profileError.message}` };

    // 3. Create timeline_blocks for today (plan type)
    const today = new Date().toISOString().split('T')[0];

    const blocksToInsert = blocks.map((b) => {
<<<<<<< HEAD
      // Ensure format HH:mm:ss
      const st = b.start_time.length === 5 ? `${b.start_time}:00` : b.start_time;
      const et = b.end_time.length === 5 ? `${b.end_time}:00` : b.end_time;

      const startTimestamp = new Date(`${today}T${st}.000Z`);
      let endTimestamp = new Date(`${today}T${et}.000Z`);

      // Handle blocks that cross midnight
      if (endTimestamp < startTimestamp) {
        endTimestamp = new Date(endTimestamp.getTime() + 24 * 60 * 60 * 1000);
=======
      let startTimestamp;
      let endTimestamp;
      
      if (b.start_time.includes('T')) {
        startTimestamp = new Date(b.start_time);
        endTimestamp = new Date(b.end_time);
      } else {
        const st = b.start_time.length === 5 ? `${b.start_time}:00` : b.start_time;
        const et = b.end_time.length === 5 ? `${b.end_time}:00` : b.end_time;

        startTimestamp = new Date(`${today}T${st}.000Z`);
        endTimestamp = new Date(`${today}T${et}.000Z`);

        // Handle blocks that cross midnight
        if (endTimestamp < startTimestamp) {
          endTimestamp = new Date(endTimestamp.getTime() + 24 * 60 * 60 * 1000);
        }
>>>>>>> public-release
      }

      return {
        user_id: user.id,
        start_time: startTimestamp.toISOString(),
        end_time: endTimestamp.toISOString(),
        label: b.label,
        color: b.category,
        type: "plan" as const,
        source: b.source,
      };
    });

    const { error: blocksError } = await supabase
      .from("timeline_blocks")
      .insert(blocksToInsert);
      
    if (blocksError) return { error: `Blocks insertion failed: ${blocksError.message}` };

    return { success: true };
  } catch (err: any) {
    console.error("claimTrialData SERVER ERROR:", err);
    return { error: err.message || "An unexpected error occurred." };
  }
}
