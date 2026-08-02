import { generateObject } from 'ai'
import { z } from 'zod'
import { getAuthenticatedAIProvider } from '@/lib/ai/auth'

export const maxDuration = 30;

const journalAnalysisSchema = z.object({
  mood: z.string().describe("The user's overall mood/state of mind (e.g. productive, anxious, calm)"),
  stress_level: z.enum(['low', 'medium', 'high']),
  suggested_tasks: z.array(z.string()).describe("Actionable tasks extracted from the journal"),
  summary: z.string().describe("A brief 1-2 sentence summary of the journal")
});

export async function POST(req: Request) {
  try {
    const { content } = await req.json();

    const { errorResponse, provider } = await getAuthenticatedAIProvider(req)
    if (errorResponse) return errorResponse

    const result = await generateObject({
      model: provider!,
      schema: journalAnalysisSchema,
      system: "You are an analytical assistant. Read the user's journal entry and extract structured insights about their mood, stress, and any actionable tasks they mentioned.",
      prompt: `Journal Entry:\n${content}`
    });

    return Response.json(result.object);
  } catch (error) {
    console.error('AI Journal Analysis Error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
