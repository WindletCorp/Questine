import { generateObject, CoreMessage } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { z } from 'zod';

export type GenerateRoutineOptions = {
  systemContext?: string;
  messages: CoreMessage[];
  apiKey: string;
  provider?: string;
  model?: string;
};

// Define the structured schema for the routine blocks
const routineBlockSchema = z.object({
  start_time: z.string().describe("Start time of the block in HH:MM format (24-hour), e.g., '06:30'"),
  end_time: z.string().describe("End time of the block in HH:MM format (24-hour), e.g., '07:30'"),
  label: z.string().describe("A natural, descriptive human-readable label for this activity, e.g., 'Morning Workout'"),
  category: z.enum(['health', 'work', 'rest', 'social', 'errand', 'other']).describe("The broad category this activity falls under"),
});

const aiResponseSchema = z.object({
  type: z.enum(['routine', 'clarification']).describe("Whether you successfully generated the routine blocks, or if you need to ask a clarifying question because critical information is missing."),
  message: z.string().describe("A conversational message to the user. E.g. 'What time is your dentist appointment?' or 'Here is your generated routine for today!'"),
  blocks: z.array(routineBlockSchema).optional().describe("An array of chronological, non-overlapping time blocks. Only include this if type is 'routine'.")
});

export async function generateRoutine({ systemContext, messages, apiKey, provider = 'google', model = 'gemini-1.5-flash' }: GenerateRoutineOptions) {
  if (provider !== 'google') {
    throw new Error(`Provider ${provider} is not supported yet.`);
  }

  const google = createGoogleGenerativeAI({
    apiKey,
  });

  const baseSystemPrompt = `You are a helpful AI assistant that builds realistic daily routines.
Cover a full day (you can decide appropriate start and end times based on context).
Routine blocks MUST NOT overlap and MUST be in chronological order.
${systemContext ? `\nContext:\n${systemContext}` : ''}`;

  try {
    const { object } = await generateObject({
      model: google(model),
      schema: aiResponseSchema,
      system: baseSystemPrompt,
      messages: messages,
      maxRetries: 0,
    });

    return object;
  } catch (error: any) {
    console.error("AI Generation Error:", error);
    const msg = error.message || "";
    
    if (msg.includes("API key not valid") || msg.includes("API_KEY_INVALID")) {
      throw new Error("API_KEY_INVALID: Your AI API key is invalid.");
    }
    
    if (msg.includes("quota") || msg.includes("429")) {
      throw new Error("QUOTA_EXCEEDED: You have exceeded your AI provider's quota or rate limit.");
    }

    throw new Error("Failed to generate routine. Please try again.");
  }
}
