"use server";

import { createClient } from "@/lib/supabase/server";
import { generateRoutine } from "@/lib/ai/generateRoutine";
import { ModelMessage } from "ai";

export async function generateAuthenticatedRoutine(messages: ModelMessage[], apiKey: string, model: string = "gemini-1.5-flash") {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be logged in to generate a routine.");
  }

  if (!apiKey) {
    throw new Error("AI API Key is missing. Please configure it in Settings.");
  }

  // Fetch global context
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("global_context")
    .eq("id", user.id)
    .single();

  if (error) {
    console.error("Error fetching profile:", error);
  }

  const globalContext = profile?.global_context || "No baseline context provided by the user.";

  const today = new Date();
  const currentDateStr = today.toLocaleDateString("en-US", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const systemContext = `You are an AI routine builder designed to help users create a daily schedule.
Current Date and Day: ${currentDateStr}

The user's baseline global context is:
${globalContext}

If the user provides enough information for a full day, output the routine blocks.
If the user's request is ambiguous or missing critical information (e.g. they say "I have a meeting" but don't say when), you should ask for clarification instead of generating blocks.
Keep your clarification messages concise and friendly, matching a Duolingo-style energetic tone.`;

  const response = await generateRoutine({
    systemContext,
    messages,
    apiKey,
    provider: "google",
    model,
  });

  return response;
}
