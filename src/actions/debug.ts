"use server";

import { createClient } from "@/lib/supabase/server";

export async function seedDummyData() {
  if (process.env.NODE_ENV !== "development") {
    throw new Error("This action is only available in development mode.");
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be logged in to seed dummy data.");
  }

  // Check if they already have day_snapshots to avoid spam
  const { data: existing } = await supabase
    .from("day_snapshots")
    .select("id")
    .eq("user_id", user.id)
    .limit(1);
    
  if (existing && existing.length > 0) {
    for (const snap of existing) {
      // Cascade delete manually just in case
      const { data: routines } = await supabase.from("routines").select("id").eq("day_snapshot_id", snap.id);
      if (routines && routines.length > 0) {
        await supabase.from("routine_blocks").delete().in("routine_id", routines.map(r => r.id));
      }
      await supabase.from("routines").delete().eq("day_snapshot_id", snap.id);
      await supabase.from("day_snapshots").delete().eq("id", snap.id);
    }
  }

  // Insert a dummy day_snapshot
  const { data: snapshot, error: snapErr } = await supabase
    .from("day_snapshots")
    .insert({
      user_id: user.id,
      date: new Date().toISOString().split('T')[0],
      journal_text: "Felt really productive today. Did all my tasks!",
    })
    .select("id")
    .single();

  if (snapErr) throw snapErr;

  // Now insert a plan routine
  const { data: planRoutine, error: planErr } = await supabase
    .from("routines")
    .insert({
      day_snapshot_id: snapshot.id,
      type: "plan",
    })
    .select("id")
    .single();

  if (planErr) throw planErr;

  // Insert some routine blocks for the plan
  await supabase.from("routine_blocks").insert([
    {
      routine_id: planRoutine.id,
      start_time: "09:00",
      end_time: "10:30",
      label: "Deep Work Session",
      source: "ai",
      order_index: 0
    },
    {
      routine_id: planRoutine.id,
      start_time: "10:45",
      end_time: "11:15",
      label: "Email & Catchup",
      source: "manual",
      order_index: 1
    }
  ]);

  // Update snapshot with plan_routine_id
  await supabase
    .from("day_snapshots")
    .update({ plan_routine_id: planRoutine.id })
    .eq("id", snapshot.id);

  return { success: true };
}
