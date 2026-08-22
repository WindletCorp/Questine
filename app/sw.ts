/// <reference lib="webworker" />
import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist, NetworkFirst, ExpirationPlugin, CacheFirst } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope & WorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    ...defaultCache,
    // Cache theme chunks for offline use
    {
      matcher: ({ url }) => url.pathname.match(/themes.*\.js$/),
      handler: new CacheFirst({
        cacheName: "theme-chunks",
        plugins: [
          new ExpirationPlugin({
            maxEntries: 30,
            maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
          }),
        ],
      }),
    },
    // Add custom caching for supabase GET requests
    {
      matcher: ({ url, request }) => url.href.includes(".supabase.co/rest/v1/") && request.method === "GET",
      handler: new NetworkFirst({
        cacheName: "supabase-api-cache",
        plugins: [
          new ExpirationPlugin({
            maxEntries: 100,
            maxAgeSeconds: 60 * 60 * 24 * 7, // 1 week
          }),
        ],
        networkTimeoutSeconds: 3,
      }),
    },
  ],
});

serwist.addEventListeners();

self.addEventListener("push", (event: PushEvent) => {
  if (event.data) {
    try {
      const data = event.data.json();
      const title = data.title || "Questine Reminder";
      const options = {
        body: data.body || "It's time!",
        icon: data.icon || "/icon-192x192.png",
        data: data.data || { url: "/" },
      };
      event.waitUntil(self.registration.showNotification(title, options));
    } catch (e) {
      // If it's not JSON, just show text
      event.waitUntil(
        self.registration.showNotification("Questine Reminder", {
          body: event.data.text(),
        })
      );
    }
  }
});

self.addEventListener("notificationclick", (event: NotificationEvent) => {
  event.notification.close();

  // Focus or open the app
  const urlToOpen = event.notification.data?.url || "/";
  
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // If the app is already open, focus it
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          // @ts-ignore
          return client.focus();
        }
      }
      // Otherwise, open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});
