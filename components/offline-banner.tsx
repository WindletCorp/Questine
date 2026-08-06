"use client";

import { useState, useEffect } from "react";

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    // Check initial state
    setIsOffline(!navigator.onLine);

    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => setIsOffline(false);

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        background: "linear-gradient(135deg, #b91c1c, #991b1b)",
        color: "#fef2f2",
        textAlign: "center",
        padding: "0.6rem 1rem",
        fontSize: "0.85rem",
        fontWeight: 600,
        fontFamily: "'Inter', system-ui, sans-serif",
        boxShadow: "0 2px 12px rgba(0,0,0,0.3)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "0.5rem",
      }}
    >
      <span style={{ fontSize: "1.1rem" }}>📡</span>
      You are offline — Some features like AI chat won&apos;t work until you reconnect.
    </div>
  );
}
