"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { generateRoutine } from "@/lib/ai/generateRoutine";

export async function generateTrial(globalContext: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    throw new Error("You're already logged in! Head to your dashboard to build routines.");
  }

  const headersList = await headers();
  // Attempt to get IP from standard headers
  const ip = headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || "unknown-ip";

  // Check rate limit: 1 per 24 hours
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  
  // NOTE: Rate limit check disabled for dev/testing
  /*
  const { data: recentTrials, error: checkError } = await supabase
    .from("trial_generations")
    .select("id")
    .eq("ip_address", ip)
    .gte("created_at", twentyFourHoursAgo);

  if (checkError) {
    console.error("Rate limit check error:", checkError);
    throw new Error("Failed to verify rate limits.");
  }

  if (recentTrials && recentTrials.length > 0) {
    throw new Error("Looks like you've already tried this today! Sign up to keep building your own routines.");
  }
  */

  const apiKey = process.env.DEVELOPER_AI_KEY;
  const model = process.env.DEVELOPER_AI_MODEL || "gemini-2.5-flash";

  if (!apiKey) {
    throw new Error("Developer AI key is not configured.");
  }

  const response = await generateRoutine({
    systemContext: "You are generating a one-shot trial routine for a new user. Always generate the routine, do not ask for clarification.",
    messages: [{ role: 'user', content: globalContext }],
    apiKey,
    provider: "google",
    model,
  });

  if (response.type === 'clarification') {
    throw new Error("AI requested clarification unexpectedly: " + response.message);
  }

  const rawBlocks = response.blocks || [];

  const generatedBlocks = rawBlocks.map((b, idx) => ({
    start_time: b.start_time,
    end_time: b.end_time,
    label: b.label,
    category: b.category,
    source: "ai" as const,
    order_index: idx
  }));

  // Log this trial generation to enforce rate limits
  const { error: logError } = await supabase
    .from("trial_generations")
    .insert({ ip_address: ip });
    
  if (logError) {
    console.error("Failed to log trial generation", logError);
    // don't fail the request if logging fails, but it's noted
  }

  return generatedBlocks;
}
