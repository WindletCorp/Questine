import { generateText, tool } from 'ai'
import { z } from 'zod'
import { getAuthenticatedAIProvider } from '@/lib/ai/auth'

export const maxDuration = 30; // Max execution time

export async function POST(req: Request) {
  const requestId = Math.random().toString(36).substring(7);
  console.log(`[Chat-${requestId}] 🚀 New request received`);
  console.time(`[Chat-${requestId}] Total Time`);

  try {
    console.time(`[Chat-${requestId}] Parse JSON`);
    const { messages } = await req.json();
    console.timeEnd(`[Chat-${requestId}] Parse JSON`);
    console.log(`[Chat-${requestId}] 📨 Messages count:`, messages.length);

    console.time(`[Chat-${requestId}] Auth & DB Fetch`);
    const { errorResponse, provider, goals, constraints, currentTime, supabase, user } = await getAuthenticatedAIProvider(req)
    console.timeEnd(`[Chat-${requestId}] Auth & DB Fetch`);

    if (errorResponse) {
      console.error(`[Chat-${requestId}] ❌ Auth Failed`);
      return errorResponse
    }

    console.log(`[Chat-${requestId}] ✅ Auth successful. User:`, user.id);

    const systemPrompt = `You are an intense, highly effective accountability partner and productivity coach for the Questine app. Your goal is to keep the user disciplined, focused, and on track with their routine. Be firm but encouraging.
Here is the user's current context:
- Current Time: ${currentTime}
- Goals: ${goals || 'None specified yet'}
- Constraints: ${constraints || 'None specified yet'}

You have access to tools to manage the user's routine blocks and tasks.
- When the user asks about their schedule or what they should be doing, ALWAYS use the 'get_routine_blocks' and 'get_tasks' tools to check their actual data before answering.
- If the user asks you to add a task or routine block, use the corresponding 'create' tool to do it for them.
Keep this context in mind when giving advice or holding them accountable.`;

    console.log(`[Chat-${requestId}] 🤖 Calling generateText API (Gemini)...`);
    console.time(`[Chat-${requestId}] generateText Execution`);
    const result = await generateText({
      model: provider!,
      system: systemPrompt,
      messages,
      tools: {
        get_routine_blocks: tool({
          description: 'Get the user\'s scheduled routine blocks to see how their day is structured.',
          parameters: z.object({}),
          execute: async (_args: any) => {
            console.time(`[Chat-${requestId}] 🛠️ Tool execution: get_routine_blocks`);
            const { data, error } = await supabase.from('routine_blocks').select('id, label, category, start_time, end_time, type').eq('user_id', user.id);
            console.timeEnd(`[Chat-${requestId}] 🛠️ Tool execution: get_routine_blocks`);
            if (error) {
              console.error(`[Chat-${requestId}] ❌ Tool get_routine_blocks failed:`, error.message);
              return { error: error.message };
            }
            return { blocks: data };
          }
        }),
        create_routine_block: tool({
          description: 'Create a new routine block in the user\'s schedule. Start and end times are in minutes from midnight (e.g. 8:00 AM = 480).',
          parameters: z.object({
            label: z.string(),
            category: z.string(),
            start_time: z.number().describe('Start time in minutes from midnight (0-1439)'),
            end_time: z.number().describe('End time in minutes from midnight (0-1439)'),
            type: z.string().describe('Must be exactly "PLAN" or "ACTUAL"')
          }),
          execute: async (args: any) => {
            console.time(`[Chat-${requestId}] 🛠️ Tool execution: create_routine_block`);
            const { data, error } = await supabase.from('routine_blocks').insert({
              ...args,
              user_id: user.id
            }).select('id').single();
            console.timeEnd(`[Chat-${requestId}] 🛠️ Tool execution: create_routine_block`);
            if (error) {
              console.error(`[Chat-${requestId}] ❌ Tool create_routine_block failed:`, error.message);
              return { error: error.message };
            }
            return { success: true, id: data.id };
          }
        }),
        get_tasks: tool({
          description: 'Get the user\'s to-do list tasks.',
          parameters: z.object({}),
          execute: async (_args: any) => {
            console.time(`[Chat-${requestId}] 🛠️ Tool execution: get_tasks`);
            const { data, error } = await supabase.from('tasks').select('id, label, completed_at').eq('user_id', user.id);
            console.timeEnd(`[Chat-${requestId}] 🛠️ Tool execution: get_tasks`);
            if (error) {
              console.error(`[Chat-${requestId}] ❌ Tool get_tasks failed:`, error.message);
              return { error: error.message };
            }
            return { tasks: data };
          }
        }),
        create_task: tool({
          description: 'Add a new task to the user\'s to-do list.',
          parameters: z.object({
            label: z.string().describe('The name of the task')
          }),
          execute: async ({ label }: any) => {
            console.time(`[Chat-${requestId}] 🛠️ Tool execution: create_task`);
            const { data, error } = await supabase.from('tasks').insert({
              label,
              user_id: user.id
            }).select('id').single();
            console.timeEnd(`[Chat-${requestId}] 🛠️ Tool execution: create_task`);
            if (error) {
              console.error(`[Chat-${requestId}] ❌ Tool create_task failed:`, error.message);
              return { error: error.message };
            }
            return { success: true, id: data.id };
          }
        })
      }
    });

    console.timeEnd(`[Chat-${requestId}] generateText Execution`);
    console.log(`[Chat-${requestId}] 📝 Exact AI Response Text:\n`, result.text);
    console.log(`[Chat-${requestId}] 🎉 Request fully completed. Total tokens:`, result.usage?.totalTokens);
    console.timeEnd(`[Chat-${requestId}] Total Time`);

    return Response.json({ text: result.text });
  } catch (error) {
    console.error(`[Chat] ❌ Catastrophic Error:`, error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
