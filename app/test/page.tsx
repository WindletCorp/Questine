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
  return <TestLab userId={user.id} />;
}
