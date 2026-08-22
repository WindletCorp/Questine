// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

serve(async (req) => {
  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get current time and time in 5 minutes
    const now = new Date();
    const inFiveMins = new Date(now.getTime() + 5 * 60000);

    // Format for postgres timestamp
    const nowStr = now.toISOString();
    const inFiveMinsStr = inFiveMins.toISOString();

    // Find blocks starting between now and in 5 minutes
    const { data: blocks, error } = await supabaseAdmin
      .from('routine_blocks')
      .select('id, user_id, label, start_time')
      .gte('start_time', nowStr)
      .lte('start_time', inFiveMinsStr)
      .is('deleted_at', null);

    if (error) {
      throw error;
    }

    if (!blocks || blocks.length === 0) {
      return new Response(JSON.stringify({ message: "No upcoming blocks" }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Call the send-push function for each block
    const promises = blocks.map(async (block) => {
      // Calculate exactly how many minutes are left (could be 4 or 5 depending on the minute boundary)
      const diffMs = new Date(block.start_time).getTime() - now.getTime();
      const minutesLeft = Math.round(diffMs / 60000);

      const payload = {
        userId: block.user_id,
        title: "Questine Reminder",
        body: `Your block '${block.label}' is starting in ${minutesLeft} minutes!`,
        icon: "/icon.png"
      };

      // Call our send-push edge function using the admin client (which automatically includes the Authorization header)
      return supabaseAdmin.functions.invoke('send-push', {
        body: payload,
      });
    });

    await Promise.all(promises);

    return new Response(JSON.stringify({ message: `Triggered pushes for ${blocks.length} blocks` }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err: any) {
    console.error('Scheduler Error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
