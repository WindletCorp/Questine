"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { useThemeContext } from "@/themes/provider";

export default function TestPage() {
  const { user, loading } = useAuth();
  const { theme } = useThemeContext();

  if (loading) {
    return (
      <div style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "1rem", background: "#0a0a0f", color: "#64748b", fontFamily: "system-ui" }}>
        <p>Checking auth…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "1rem", background: "#0a0a0f", color: "#64748b", fontFamily: "system-ui" }}>
        <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: "16px", padding: "2rem", textAlign: "center", maxWidth: "400px" }}>
          <h1 style={{ color: "#e2e8f0", marginBottom: "0.75rem" }}>🔐 Auth Required</h1>
          <p style={{ color: "#94a3b8", marginBottom: "0.5rem" }}>Not authenticated. Sign in first.</p>
          <p style={{ fontSize: "0.8rem", color: "#475569" }}>This page requires an authenticated session. If you are offline, you must have logged in previously to access this page.</p>
          <div style={{ marginTop: "1.5rem" }}>
            <a href="/login" style={{ textDecoration: "none", display: "inline-block", padding: "0.5rem 1rem", borderRadius: "8px", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "white", fontWeight: 600 }}>
              Go to Login Page
            </a>
          </div>
        </div>
      </div>
    );
  }

  const TestLab = theme.pages.TestLab;

  return (
    <div style={{ position: "relative" }}>
      {/* Notification Tester UI Overlay */}
      <div 
        style={{ 
          position: "absolute", 
          top: "1rem", 
          right: "1rem", 
          zIndex: 9999, 
          background: "#1e293b", 
          padding: "1rem", 
          borderRadius: "8px",
          border: "1px solid #334155",
          color: "white",
          boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.5)",
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem"
        }}
      >
        <h3 style={{ fontSize: "1rem", margin: 0, paddingBottom: "0.5rem", borderBottom: "1px solid #334155" }}>
          Notification Tester
        </h3>
        <button 
          onClick={async () => {
            const { requestNotificationPermission } = await import("@/lib/notifications");
            await requestNotificationPermission();
            alert("Requested permission.");
          }}
          style={{ padding: "0.5rem", background: "#3b82f6", color: "white", borderRadius: "4px", border: "none", cursor: "pointer" }}
        >
          1. Request Permission
        </button>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginTop: "0.5rem" }}>
          <input 
            type="number" 
            id="test-notif-seconds" 
            defaultValue="10" 
            style={{ width: "60px", padding: "0.25rem", borderRadius: "4px", border: "1px solid #475569", background: "#0f172a", color: "white" }} 
          />
          <span style={{ fontSize: "0.875rem" }}>seconds</span>
        </div>
        <button 
          onClick={async () => {
            const { scheduleNotification, defaultPersonality } = await import("@/lib/notifications");
            const seconds = parseInt((document.getElementById("test-notif-seconds") as HTMLInputElement).value || "10", 10);
            const triggerTime = Date.now() + seconds * 1000;
            
            const success = await scheduleNotification(
              defaultPersonality.titleTemplate,
              {
                body: defaultPersonality.bodyTemplate.replace("{blockName}", "Test Block").replace("{minutes}", (seconds/60).toFixed(1)),
                icon: defaultPersonality.icon,
                data: { url: "/test" }
              },
              triggerTime
            );
            
            if (success) {
              alert(`Scheduled for ${new Date(triggerTime).toLocaleTimeString()}! You can now close the app to test offline triggers.`);
            } else {
              alert("Failed to schedule.");
            }
          }}
          style={{ padding: "0.5rem", background: "#10b981", color: "white", borderRadius: "4px", border: "none", cursor: "pointer" }}
        >
          2. Schedule Notification
        </button>
      </div>

      <TestLab userId={user.id} />
    </div>
  );
}
