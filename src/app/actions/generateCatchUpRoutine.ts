"use server";

import { createClient } from "@/lib/supabase/server";
import { generateRoutine } from "@/lib/ai/generateRoutine";
import { ModelMessage } from "ai";

export async function generateCatchUpRoutine(
  messages: ModelMessage[],
  targetDate: string,
  apiKey: string,
  model: string = "gemini-1.5-flash"
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be logged in to catch up.");
  }

  if (!apiKey) {
    throw new Error("AI API Key is missing. Please configure it in Settings.");
  }

  // 1. Fetch user's global context
  const { data: profile } = await supabase
    .from("profiles")
    .select("global_context")
    .eq("id", user.id)
    .single();

  const globalContext = profile?.global_context || "No baseline context provided.";

  // 2. Determine time window (assuming UTC for now)
  const startOfDay = new Date(`${targetDate}T00:00:00.000Z`).toISOString();
  const endOfDay = new Date(new Date(startOfDay).getTime() + 24 * 60 * 60 * 1000).toISOString();

  // 3. Fetch existing blocks
  const { data: timelineBlocks } = await supabase
    .from("timeline_blocks")
    .select("start_time, end_time, label, type, color")
    .eq("user_id", user.id)
    .gte("start_time", startOfDay)
    .lt("start_time", endOfDay)
    .order("start_time");

  let planContext = "No plan was set for this day.";
  let actualContext = "No actual logs recorded yet for this day.";

  const formatBlock = (b: any) => {
    const st = new Date(b.start_time).toISOString().substring(11, 16);
    const et = new Date(b.end_time).toISOString().substring(11, 16);
    return `[${st} - ${et}] ${b.label} (${b.color || "other"})`;
  };

  if (timelineBlocks) {
    const planBlocks = timelineBlocks.filter(b => b.type === 'plan');
    const actualBlocks = timelineBlocks.filter(b => b.type === 'actual');

    if (planBlocks.length > 0) {
      planContext = planBlocks.map(formatBlock).join("\n");
    }
    if (actualBlocks.length > 0) {
      actualContext = actualBlocks.map(formatBlock).join("\n");
    }
  }

  const currentTimeStr = new Date().toLocaleTimeString("en-US", { hour: 'numeric', minute: '2-digit' });
  const todayStr = new Date().toISOString().split('T')[0];
  const isToday = targetDate === todayStr;

  const systemContext = `You are an AI routine builder designed to help users log their "Actual" daily routine (Catch-Up mode).
Target Date for Catch-up: ${targetDate}
${isToday ? `CURRENT LOCAL TIME: ${currentTimeStr}` : 'NOTE: The target date is in the past, so all times on this date have already occurred.'}

User's Baseline Global Context:
${globalContext}

--- CONTEXT FOR TODAY ---
What the user PLANNED to do today:
${planContext}

What the user ACTUALLY logged so far today:
${actualContext}
-------------------------

RULES FOR CATCH-UP GENERATION:
1. The user will provide a text/voice update describing what they actually did.
2. Parse their update into precise time blocks.
3. DO NOT auto-fill the rest of the day with plan blocks if they are unmentioned. The user wants to manually log what they did. Only generate blocks for activities they explicitly mention or imply having completed/changed.
4. If they have already logged some actual blocks (see context above), merge the new update with those existing actual blocks into a single cohesive, chronological, non-overlapping timeline.
5. If their update is ambiguous or missing critical timestamps, ask a clarification question.
${isToday ? "6. The user can only catch up on the PAST. If the user mentions an activity they *will* do in the future (relative to the CURRENT LOCAL TIME), DO NOT generate an actual routine block for it. Acknowledge it in your conversational message, but do not create blocks for future intents." : ""}
`;

  const response = await generateRoutine({
    systemContext,
    messages,
    apiKey,
    provider: "google",
    model,
  });

  return response;
}
