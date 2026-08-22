export type NotificationPersonality = {
  id: string;
  name: string;
  icon: string;
  titleTemplate: string;
  bodyTemplate: string;
};

export const defaultPersonality: NotificationPersonality = {
  id: "default",
  name: "Standard",
  icon: "/icon.png", // Assuming a standard PWA icon exists
  titleTemplate: "Questine Reminder",
  bodyTemplate: "Your block '{blockName}' is starting in {minutes} minutes!",
};

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!("Notification" in window)) {
    console.warn("This browser does not support desktop notification");
    return "denied";
  }

  const permission = await Notification.requestPermission();
  
  if (permission === "granted") {
    // Automatically register the Web Push subscription so the backend can send pushes
    await registerWebPushSubscription();
  }

  return permission;
}

export async function scheduleNotification(
  title: string,
  options: NotificationOptions,
  timestamp: number
): Promise<boolean> {
  if (!("serviceWorker" in navigator)) {
    console.warn("Service Worker not supported.");
    return false;
  }

  const registration = await navigator.serviceWorker.ready;

  try {
    // @ts-ignore - showTrigger is an experimental API
    if ("showTrigger" in Notification.prototype) {
      // @ts-ignore
      options.showTrigger = new TimestampTrigger(timestamp);
      await registration.showNotification(title, options);
      console.log(`Notification scheduled for ${new Date(timestamp).toLocaleString()} using local trigger.`);
      return true;
    } else {
      console.warn("Notification Triggers API not supported. Falling back to sending an immediate Web Push...");
      
      const supabase = createSupabaseBrowserClient();
      const { data: userData } = await supabase.auth.getUser();
      
      if (userData?.user) {
        // We trigger the edge function immediately to test Web Push Delivery
        await supabase.functions.invoke('send-push', {
          body: {
            userId: userData.user.id,
            title: title,
            body: options.body,
            icon: options.icon
          },
        });
        console.log("Triggered immediate Web Push fallback.");
      }
      return true;
    }
  } catch (error) {
    console.error("Error scheduling notification:", error);
    return false;
  }
}

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

// Utility to convert Base64 URL safe string to Uint8Array for VAPID keys
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function registerWebPushSubscription(): Promise<boolean> {
  if (!("serviceWorker" in navigator)) return false;
  const registration = await navigator.serviceWorker.ready;

  try {
    const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!publicVapidKey) {
      console.error("VAPID public key not found in environment variables.");
      return false;
    }

    // Subscribe to push manager
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicVapidKey),
    });

    const subJson = subscription.toJSON();
    if (!subJson.endpoint || !subJson.keys) return false;

    // Send subscription to Supabase
    const supabase = createSupabaseBrowserClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      console.error("User not authenticated for push subscription");
      return false;
    }

    const { error: dbError } = await supabase.from('push_subscriptions').upsert({
      user_id: userData.user.id,
      endpoint: subJson.endpoint,
      p256dh: subJson.keys.p256dh,
      auth: subJson.keys.auth,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id, endpoint' });

    if (dbError) {
      console.error("Failed to save push subscription to database:", dbError);
      return false;
    }

    console.log("Web Push subscription saved. Push will be delivered by backend pg_cron.");
    return true;
  } catch (error) {
    console.error("Web Push Fallback Error:", error);
    return false;
  }
}

