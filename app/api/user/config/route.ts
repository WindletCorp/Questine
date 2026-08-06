import { createSupabaseServerClient } from '@/lib/supabase/server';
import { z } from 'zod';

const UpdateConfigSchema = z.object({
  byok_key: z.string().optional(),
  byok_provider: z.string().optional(),
  goals: z.string().optional(),
  constraints: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    
    // 1. Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    // 2. Parse request body
    const body = await req.json();
    const parsed = UpdateConfigSchema.safeParse(body);
    
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: 'Invalid payload', details: parsed.error.issues }), { status: 400 });
    }
    
    const updates = parsed.data;

    // Only update if there are fields to update
    if (Object.keys(updates).length === 0) {
      return new Response(JSON.stringify({ error: 'No fields provided to update' }), { status: 400 });
    }

    // 3. Update the user record in database
    const { error: updateError } = await supabase
      .from('users')
      .update(updates)
      .eq('id', user.id);

    if (updateError) {
      console.error('Failed to update user config:', updateError);
      return new Response(JSON.stringify({ error: 'Failed to update configuration' }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true, message: 'Configuration updated successfully' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err: any) {
    console.error('Unhandled Route Error:', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
