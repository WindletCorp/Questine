"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

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

  // Generate routine using AI
  // TODO: Replace with actual AI API call using process.env.DEVELOPER_AI_KEY
  // For MVP/Demo purposes, we'll simulate an AI response based on the context
  await new Promise(resolve => setTimeout(resolve, 2000)); // simulate network latency
  
  const generatedBlocks = [
    {
      start_time: "08:00:00",
      end_time: "09:00:00",
      label: "Morning Routine & Breakfast",
      source: "ai" as const
    },
    {
      start_time: "09:00:00",
      end_time: "12:00:00",
      label: "Deep Work Session",
      source: "ai" as const
    },
    {
      start_time: "12:00:00",
      end_time: "13:00:00",
      label: "Lunch Break",
      source: "ai" as const
    },
    {
      start_time: "13:00:00",
      end_time: "17:00:00",
      label: "Meetings & Light Tasks",
      source: "ai" as const
    },
    {
      start_time: "18:00:00",
      end_time: "19:00:00",
      label: "Exercise",
      source: "ai" as const
    },
    {
      start_time: "20:00:00",
      end_time: "21:00:00",
      label: "Relax & Read",
      source: "ai" as const
    }
  ];

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
