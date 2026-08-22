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
  icon: "/icon-192x192.png", // Assuming a standard PWA icon exists
  titleTemplate: "Questine Reminder",
  bodyTemplate: "Your block '{blockName}' is starting in {minutes} minutes!",
};

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!("Notification" in window)) {
    console.warn("This browser does not support desktop notification");
    return "denied";
  }

  if (Notification.permission === "granted") {
    return "granted";
  }

  return await Notification.requestPermission();
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
      console.warn("Notification Triggers API not supported. Falling back to Web Push...");
      return await setupWebPushFallback(title, options, timestamp);
    }
  } catch (error) {
    console.error("Error scheduling notification:", error);
    return false;
  }
}

async function setupWebPushFallback(
  title: string,
  options: NotificationOptions,
  timestamp: number
): Promise<boolean> {
  // TODO: Implement Web Push Fallback
  // 1. Get VAPID public key
  // 2. Subscribe to push manager: registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey })
  // 3. Send subscription, title, options, and timestamp to our backend (Supabase/Next API)
  // 4. Backend will schedule a job to send the push notification at `timestamp`.
  
  console.log("Web Push fallback stub hit. To be fully implemented with backend.");
  return false;
}
