import { createClient } from '@supabase/supabase-js';
import { generateText, tool, LanguageModel, isStepCount } from 'ai'; // 👈 Added LanguageModelV1 import
import { createGoogle } from '@ai-sdk/google';
import { z } from 'zod';
import { google } from "@ai-sdk/google";
import { createGoogleGenerativeAI } from '@ai-sdk/google';

export async function POST(req: Request) {
    try {
        const { prompt, userId } = await req.json();

        if (!userId) {
            return new Response(JSON.stringify({ error: 'User ID is required' }), { status: 400 });
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const serviceRoleKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjdmh6Y29peGJmbHl0bnBpeXVkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTY0MzMwMiwiZXhwIjoyMTAxMjE5MzAyfQ.QiwPzOJgFMaTyQ4ehGMToTY4yAafi7_74512HyDlYsA"

        if (!serviceRoleKey) {
            console.error("❌ CRITICAL: SUPABASE_SERVICE_ROLE_KEY is missing!");
            return new Response(JSON.stringify({ error: 'Server misconfiguration' }), { status: 500 });
        }

        const supabase = createClient(supabaseUrl!, serviceRoleKey);

        // 1. Fetch user API key and provider preference
        const { data: userConfig, error } = await supabase
            .from('users')
            .select('byok_provider, byok_key')
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

        // 2. Dynamic Provider Setup with Strict Typing
        // ⚡ FIX: Assign the LanguageModelV1 type so 'generateText' accepts it perfectly
        let modelInstance: LanguageModelV1; 

        if (userConfig.byok_provider === 'google' || userConfig.byok_provider === 'gemini') {
            const google = createGoogle({ apiKey: userConfig.byok_key });
            modelInstance = google('gemini-2.5-flash');
        } else {
            return new Response(JSON.stringify({ error: 'Only Google Gemini configuration is ready.' }), { status: 400 });
        }

        console.log(prompt, "STARTED CALLING GENERATE TEXT TYPE SHIII");

//         // 3. Execution Loop
// import { z } from 'zod';
// import { generateText, tool, isStepCount } from 'ai';
// import { google } from "@ai-sdk/google";
        const google = createGoogleGenerativeAI({
        apiKey: userConfig.byok_key
        });
        const result = await generateText({
        model: google("gemini-2.5-flash"),

        tools: {
            weather: tool({
            description: 'Get the weather in a location',
            inputSchema: z.object({
                location: z.string().describe('The location to get the weather for'),
            }),
            execute: async ({ location }) => ({
                location,
                temperature: 72 + Math.floor(Math.random() * 21) - 10,
            }),
            }),
        },
        stopWhen: isStepCount(5),
        prompt: 'What is the weather in San Francisco?',
        });

        console.log("✅ FINAL RESPONSE GENERATED:", result.text);

        return new Response(JSON.stringify({ text: result.text }), {
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (err: any) {
        console.error('Unhandled Route Error:', err);
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}
