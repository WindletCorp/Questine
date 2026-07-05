"use server";

import { createClient } from "@/lib/supabase/server";
import { generateObject } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { z } from "zod";
import { revalidatePath } from "next/cache";

export async function executeGlobalCommand(prompt: string, dateStr: string, apiKey: string, modelStr: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: "Unauthorized" };
  }

  // 1. Fetch Current Context
  const startOfDay = new Date(`${dateStr}T00:00:00.000Z`).toISOString();
  const endOfDay = new Date(new Date(startOfDay).getTime() + 24 * 60 * 60 * 1000).toISOString();

  const { data: blocks } = await supabase
    .from("timeline_blocks")
    .select("*")
    .eq("user_id", user.id)
    .gte("start_time", startOfDay)
    .lt("start_time", endOfDay);

  const { data: tasks } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", user.id)
    .eq("target_date", dateStr);

  const contextStr = `
CURRENT DATE: ${dateStr}
CURRENT BLOCKS: ${JSON.stringify(blocks || [])}
CURRENT TASKS: ${JSON.stringify(tasks || [])}
  `;

  // 2. Call AI to parse intent
  const google = createGoogleGenerativeAI({ apiKey });
  
  try {
    const { object } = await generateObject({
      model: google(modelStr),
      system: `You are an omnipresent AI assistant for a productivity app. Your job is to parse the user's natural language command and decide how to mutate their day.
      You have access to their current blocks and tasks for today.
      
      Supported Intents:
      - ADD_TASK: Create a new task. Provide the title.
      - UPDATE_BLOCKS: Shift, extend, or modify existing blocks. Provide the block IDs and their new absolute start/end times in ISO string format.
      - COMPLETE_TASK: Mark an existing task as completed. Provide the task ID.
      - CHAT: If the request is just conversational or unsupported, provide a chat response.

      You must return a strict JSON object matching the schema. Only populate the fields relevant to the intent.
      ${contextStr}`,
      prompt: `User Command: "${prompt}"`,
      schema: z.object({
        intent: z.enum(["ADD_TASK", "UPDATE_BLOCKS", "COMPLETE_TASK", "CHAT"]),
        addTask: z.object({
          title: z.string()
        }).optional(),
        updateBlocks: z.array(z.object({
          id: z.string(),
          new_start_time: z.string(),
          new_end_time: z.string()
        })).optional(),
        completeTask: z.object({
          id: z.string()
        }).optional(),
        chatResponse: z.string().optional()
      }),
    });

    // 3. Execute Database Operations based on intent
    if (object.intent === "ADD_TASK" && object.addTask) {
      await supabase.from("tasks").insert({
        user_id: user.id,
        title: object.addTask.title,
        target_date: dateStr,
        status: "pending"
      });
      revalidatePath('/', 'layout');
      return { success: true, message: `Added task: ${object.addTask.title}` };
    }

    if (object.intent === "UPDATE_BLOCKS" && object.updateBlocks) {
      for (const update of object.updateBlocks) {
        await supabase.from("timeline_blocks")
          .update({ start_time: update.new_start_time, end_time: update.new_end_time })
          .eq("id", update.id)
          .eq("user_id", user.id);
      }
      revalidatePath('/', 'layout');
      return { success: true, message: "Routine updated!" };
    }

    if (object.intent === "COMPLETE_TASK" && object.completeTask) {
      await supabase.from("tasks")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("id", object.completeTask.id)
        .eq("user_id", user.id);
      revalidatePath('/', 'layout');
      return { success: true, message: "Task marked as done!" };
    }

    if (object.intent === "CHAT") {
      return { success: true, message: object.chatResponse || "I can't do that yet, but I'm learning!" };
    }

    return { success: false, message: "I didn't quite understand how to execute that." };

  } catch (error) {
    console.error("AI Error:", error);
    return { success: false, message: "AI processing failed." };
  }
}
