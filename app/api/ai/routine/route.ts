import { generateObject } from 'ai'
import { z } from 'zod'
import { getAuthenticatedAIProvider } from '@/lib/ai/auth'

export const maxDuration = 30;

// Define the schema for the generated routine
const routineSchema = z.object({
  blocks: z.array(z.object({
    label: z.string().describe("Name of the block (e.g. Deep Work, Workout)"),
    category: z.string().describe("Category of the block (e.g. Health, Work, Leisure)"),
    start_time_offset_mins: z.number().describe("Minutes from start of day for this block"),
    duration_mins: z.number().describe("Duration of the block in minutes")
  }))
});

export async function POST(req: Request) {
  try {
    const { errorResponse, provider, goals, constraints, currentTime } = await getAuthenticatedAIProvider(req)
    if (errorResponse) return errorResponse

    const result = await generateObject({
      model: provider!,
      schema: routineSchema,
      system: "You are a master time-management coach. Generate an optimal daily routine for the user based on their goals, constraints, and the current time of day.",
      prompt: `Current Time: ${currentTime}\nGoals: ${goals || 'None specified'}\nConstraints: ${constraints || 'None specified'}`
    });

    return Response.json(result.object);
  } catch (error) {
    console.error('AI Routine Error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
