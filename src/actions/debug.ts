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

  // Clear existing blocks
  await supabase.from("timeline_blocks").delete().eq("user_id", user.id);
  await supabase.from("journal_logs").delete().eq("user_id", user.id);

  const today = new Date().toISOString().split('T')[0];

  // Insert a journal log
  await supabase
    .from("journal_logs")
    .insert({
      user_id: user.id,
      content: "Felt really productive today. Did all my tasks!",
    });

  // Insert some timeline blocks for the plan
  await supabase.from("timeline_blocks").insert([
    {
      user_id: user.id,
      start_time: new Date(`${today}T09:00:00.000Z`).toISOString(),
      end_time: new Date(`${today}T10:30:00.000Z`).toISOString(),
      label: "Deep Work Session",
      type: "plan",
      source: "ai",
      color: "work"
    },
    {
      user_id: user.id,
      start_time: new Date(`${today}T10:45:00.000Z`).toISOString(),
      end_time: new Date(`${today}T11:15:00.000Z`).toISOString(),
      label: "Email & Catchup",
      type: "plan",
      source: "manual",
      color: "other"
    }
  ]);

  return { success: true };
}
