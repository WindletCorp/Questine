/// <reference lib="webworker" />
import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist, NetworkFirst, ExpirationPlugin } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    ...defaultCache,
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
