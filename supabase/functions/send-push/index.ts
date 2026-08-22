// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import webPush from "npm:web-push@3.6.7";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { userId, title, body, icon } = await req.json();

    if (!userId || !title) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log(`Checking subscriptions for userId: ${userId}`);

    // Get all subscriptions for user
    const { data: subscriptions, error } = await supabaseAdmin
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error(`Database error:`, error);
      return new Response(JSON.stringify({ error: 'Database error', details: error }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.warn(`No subscriptions found for userId: ${userId}`);
      return new Response(JSON.stringify({ error: 'No subscriptions found in DB' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400, // Changed from 404 to distinguish from API Gateway 404
      });
    }

    console.log(`Found ${subscriptions.length} subscriptions for userId: ${userId}`);

    // Set VAPID details
    const publicVapidKey = Deno.env.get('NEXT_PUBLIC_VAPID_PUBLIC_KEY');
    const privateVapidKey = Deno.env.get('VAPID_PRIVATE_KEY');

    if (!publicVapidKey || !privateVapidKey) {
       return new Response(JSON.stringify({ error: 'VAPID keys not configured' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    webPush.setVapidDetails(
      'mailto:test@example.com',
      publicVapidKey,
      privateVapidKey
    );

    const payload = JSON.stringify({
      title,
      body: body || 'You have a new notification!',
      icon: icon || '/icon.png',
    });

    const sendPromises = subscriptions.map((sub) => {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        }
      };
      return webPush.sendNotification(pushSubscription, payload)
        .catch(err => {
          console.error('Error sending push to endpoint:', sub.endpoint, err);
          // If the subscription is expired or invalid (e.g. 410 Gone), we could delete it here
          if (err.statusCode === 410 || err.statusCode === 404) {
             return supabaseAdmin.from('push_subscriptions').delete().match({ id: sub.id });
          }
        });
    });

    await Promise.all(sendPromises);

    return new Response(
      JSON.stringify({ success: true, message: `Sent push to ${subscriptions.length} devices.` }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error: any) {
    console.error('Edge Function Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
