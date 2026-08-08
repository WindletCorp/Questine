"use client";

import { useEffect } from "react";
import { useSyncStore } from "./sync-store";

export function useNetworkMonitor() {
  const { setIsOnline, setStatus } = useSyncStore();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOnline = () => {
      setIsOnline(true);
      setStatus("idle");
    };

    const handleOffline = () => {
      setIsOnline(false);
      setStatus("offline");
    };

    // Initial state
    setIsOnline(navigator.onLine);
    if (!navigator.onLine) setStatus("offline");

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [setIsOnline, setStatus]);
}
