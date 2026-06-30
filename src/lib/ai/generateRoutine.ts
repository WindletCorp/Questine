import { generateObject } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { z } from 'zod';

export type GenerateRoutineOptions = {
  globalContext: string;
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

const routineSchema = z.object({
  blocks: z.array(routineBlockSchema).describe("An array of chronological, non-overlapping time blocks representing the user's routine.")
});

export async function generateRoutine({ globalContext, apiKey, provider = 'google', model = 'gemini-2.5-flash' }: GenerateRoutineOptions) {
  if (provider !== 'google') {
    throw new Error(`Provider ${provider} is not supported yet.`);
  }

  const google = createGoogleGenerativeAI({
    apiKey,
  });

  try {
    const { object } = await generateObject({
      model: google(model),
      schema: routineSchema,
      prompt: `Generate a realistic daily routine as a sequence of time blocks based on the following context about the user.
Cover a full day (you can decide the appropriate start and end times based on the context, e.g., 07:00 to 22:00).
Blocks MUST NOT overlap and MUST be in chronological order.

User Context:
${globalContext}
`,
    });

    return object.blocks;
  } catch (error: any) {
    console.error("AI Generation Error:", error);
    throw new Error(error.message || "Failed to generate routine. Please check your AI API key and try again.");
  }
}
