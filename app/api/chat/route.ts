import { generateText, isStepCount } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { buildTools } from '@/lib/ai/tools';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
    try {
        const { messages, userId } = await req.json();

        if (!userId) {
            return new Response(JSON.stringify({ error: 'User ID is required' }), { status: 400 });
        }

        const supabase = await createSupabaseServerClient();

        // 1. Fetch user API key and provider preference
        const { data: userConfig, error } = await supabase
            .from('users')
            .select('byok_provider, byok_key, goals, constraints')
            .eq('id', userId)
            .maybeSingle();

        if (error) {
            console.error('Database query crashed:', error);
            return new Response(JSON.stringify({ error: 'Database query failed' }), { status: 500 });
        }

        if (!userConfig) {
            return new Response(JSON.stringify({ error: 'User profile not found' }), { status: 404 });
        }

        if (!userConfig.byok_key) {
            return new Response(JSON.stringify({ error: 'API key not configured' }), { status: 400 });
        }

        if (!userConfig.byok_provider) {
            return new Response(JSON.stringify({ error: 'BYOK Provider not configured. Please set up your provider first.' }), { status: 400 });
        }

        if (userConfig.byok_provider !== 'google' && userConfig.byok_provider !== 'gemini') {
            return new Response(JSON.stringify({ error: `Unsupported BYOK provider: ${userConfig.byok_provider}` }), { status: 400 });
        }

        console.log("STARTED CALLING STREAM TEXT WITH MESSAGES");

        // 2. Initialize provider
        const google = createGoogleGenerativeAI({
            apiKey: userConfig.byok_key
        });

        // 3. Build tools
        const myTools = buildTools({
            client: supabase,
            userId: userId,
        });

        const systemPrompt = `You are Questine, an elite, no-nonsense personal operating system.
        Your sole purpose is to help the user manage their tasks and schedule their routine blocks.

        Current Date and Time: ${new Date().toISOString()}

        USER CONTEXT:
        - Goals: ${userConfig.goals || "None specified"}
        - Constraints: ${userConfig.constraints || "None specified"}

        RULES:
        1. Embody a proactive, sharp, and concise persona. Do not sound like a generic AI assistant. Drop pleasantries like "How can I help you today?".
        2. Strictly align all your suggestions, scheduling, and task management with the user's GOALS and CONSTRAINTS.
        3. You have a strict limit of 5 tool calls per turn. Do not brute force tools. If you hit an error, explain it and stop.
        4. You manage Tasks and Routine Blocks. You do not manage journals.`;

        console.time('[LLM] generateText');
        const result = await generateText({
            model: google('gemini-3.5-flash-lite'),
            system: systemPrompt,
            tools: myTools,
            stopWhen: isStepCount(5),
            messages: messages || [{ role: 'user', content: 'Hello!' }],
        });
        console.timeEnd('[LLM] generateText');

        console.log("✅ FINAL RESPONSE GENERATED:", result.text);

        return new Response(JSON.stringify({ text: result.text, responseMessages: result.response.messages }), {
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (err: any) {
        console.error('Unhandled Route Error:', err);
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}

