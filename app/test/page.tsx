"use client";

import { useState, useEffect, useCallback } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/providers/auth-provider";

// Local DB functions
import { getLocalTasks, createLocalTask, updateLocalTask, deleteLocalTask, addLocalWaypoint, updateLocalWaypoint, removeLocalWaypoint } from "@/lib/local-db/tasks";
import {
  getLocalRoutineBlocks,
  createLocalRoutineBlock,
  updateLocalRoutineBlock,
  deleteLocalRoutineBlock,
} from "@/lib/local-db/routine-blocks";
import {
  getLocalJournals,
  createLocalJournal,
  updateLocalJournal,
  deleteLocalJournal,
} from "@/lib/local-db/journals";
import {
  getLocalUserStats,
} from "@/lib/local-db/users";

import type { Task, RoutineBlock, Journal, UserStats, TaskMetadata, Waypoint } from "@/lib/db/types";

// ─── Helpers ────────────────────────────────────────────────────────────────

function Result({ data }: { data: any }) {
  if (!data) return <pre className="result-box">null</pre>;

  if (data.error) {
    return (
      <div className="result-box error-box">
        <div style={{ color: "#ef4444", fontWeight: "bold", marginBottom: "0.5rem" }}>
          Error: {data.error.code}
        </div>
        <div style={{ marginBottom: "0.5rem" }}>{data.error.message}</div>
        {data.error.details && (
          <details>
            <summary style={{ cursor: "pointer", fontSize: "0.8rem", color: "#94a3b8" }}>Technical Details</summary>
            <pre style={{ fontSize: "0.75rem", marginTop: "0.5rem", overflowX: "auto" }}>
              {JSON.stringify(data.error.details, null, 2)}
            </pre>
          </details>
        )}
      </div>
    );
  }

  return (
    <pre className="result-box">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="section">
      <h2 className="section-title">{title}</h2>
      <div className="section-body">{children}</div>
    </section>
  );
}

function ActionBtn({
  label,
  onClick,
  variant = "primary",
}: {
  label: string;
  onClick: () => void;
  variant?: "primary" | "danger" | "secondary";
}) {
  return (
    <button className={`btn btn-${variant}`} onClick={onClick}>
      {label}
    </button>
  );
}

// ─── Tasks Panel ────────────────────────────────────────────────────────────

function TasksPanel({ userId }: { userId: string }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [result, setResult] = useState<unknown>(null);
  const [label, setLabel] = useState("Buy groceries");
  const [startTime, setStartTime] = useState(new Date(Date.now()).toISOString().slice(0, 16));
  const [endTime, setEndTime] = useState(new Date(Date.now() + 24 * 3600 * 1000).toISOString().slice(0, 16));

  // Query fields
  const [from, setFrom] = useState(new Date(Date.now() - 24 * 3600 * 1000).toISOString().slice(0, 16));
  const [to, setTo] = useState(new Date(Date.now() + 24 * 3600 * 1000).toISOString().slice(0, 16));

  const refresh = useCallback(async () => {
    const result = await getLocalTasks(userId, {
      from: from ? new Date(from).toISOString() : undefined,
      to: to ? new Date(to).toISOString() : undefined,
    });
    setResult(result);
    if (!result.error) setTasks(result.data ?? []);
  }, [userId, from, to]);

  useEffect(() => { 
    refresh();
    const handleSync = () => refresh();
    window.addEventListener("sync-completed", handleSync);
    return () => window.removeEventListener("sync-completed", handleSync);
  }, [refresh]);

  const handleCreate = async () => {
    const result = await createLocalTask({ 
      user_id: userId, 
      label, 
      start_time: startTime ? new Date(startTime).toISOString() : null,
      end_time: endTime ? new Date(endTime).toISOString() : null,
      metadata: null 
    });
    setResult(result);
    refresh();
  };

  const handleComplete = async (id: string) => {
    const result = await updateLocalTask(id, {
      completed_at: new Date().toISOString(),
    });
    setResult(result);
    refresh();
  };

  const handleUncomplete = async (id: string) => {
    const result = await updateLocalTask(id, { completed_at: null });
    setResult(result);
    refresh();
  };

  const handleDelete = async (id: string) => {
    const result = await deleteLocalTask(id);
    setResult(result);
    refresh();
  };

  const handleAddWaypoint = async (id: string, metadata: TaskMetadata | null) => {
    const currentWaypoints = metadata?.waypoints || [];
    const maxOrder = currentWaypoints.reduce((max, w) => Math.max(max, w.order), -1);
    
    const title = prompt("Waypoint title:");
    if (!title) return;

    const r = await addLocalWaypoint(id, {
      order: maxOrder + 1,
      title,
      completed: false
    });
    setResult(r);
    refresh();
  };

  const handleToggleWaypoint = async (taskId: string, w: Waypoint) => {
    const r = await updateLocalWaypoint(taskId, w.order, { completed: !w.completed });
    setResult(r);
    refresh();
  };

  const handleDeleteWaypoint = async (taskId: string, w: Waypoint) => {
    const r = await removeLocalWaypoint(taskId, w.order);
    setResult(r);
    refresh();
  };

  return (
    <Section title="📋 Tasks">
      <div className="form-grid">
        <div className="row">
          <input className="input" type="datetime-local" value={from} onChange={(e) => setFrom(e.target.value)} placeholder="From" title="From" />
          <input className="input" type="datetime-local" value={to} onChange={(e) => setTo(e.target.value)} placeholder="To" title="To" />
          <ActionBtn label="Refresh" onClick={refresh} variant="secondary" />
        </div>
        <div className="row">
          <input
            className="input"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Task label"
          />
          <input className="input" type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} placeholder="Start Time" title="Start Time" />
          <input className="input" type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} placeholder="End Time" title="End Time" />
          <ActionBtn label="Create" onClick={handleCreate} />
        </div>
      </div>
      <div className="item-list">
        {tasks.map((t) => (
          <div key={t.id} className={`item ${t.completed_at ? "item-done" : ""}`}>
            <span className="item-label">
              {t.completed_at ? "✅" : "⬜"} {t.label}
            </span>
            <span className="item-meta">{t.id.slice(0, 8)}…</span>
            
            {t.metadata?.waypoints && t.metadata.waypoints.length > 0 && (
              <div style={{ marginLeft: "1.5rem", marginTop: "0.5rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {t.metadata.waypoints.map((w: Waypoint) => (
                  <div key={w.order} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8rem", color: w.completed ? "#64748b" : "#e2e8f0" }}>
                    <span style={{ cursor: "pointer" }} onClick={() => handleToggleWaypoint(t.id, w)}>
                      {w.completed ? "☑️" : "🔲"}
                    </span>
                    <span style={{ textDecoration: w.completed ? "line-through" : "none", flex: 1 }}>{w.title}</span>
                    <ActionBtn label="×" onClick={() => handleDeleteWaypoint(t.id, w)} variant="danger" />
                  </div>
                ))}
              </div>
            )}

            <div className="item-actions">
              {!t.completed_at ? (
                <ActionBtn label="Complete" onClick={() => handleComplete(t.id)} variant="secondary" />
              ) : (
                <ActionBtn label="Undo" onClick={() => handleUncomplete(t.id)} variant="secondary" />
              )}
              <ActionBtn label="+ Waypoint" onClick={() => handleAddWaypoint(t.id, t.metadata as TaskMetadata | null)} variant="secondary" />
              <ActionBtn label="Delete" onClick={() => handleDelete(t.id)} variant="danger" />
            </div>
          </div>
        ))}
      </div>
      <Result data={result} />
    </Section>
  );
}

// ─── Routine Blocks Panel ───────────────────────────────────────────────────

function RoutineBlocksPanel({ userId }: { userId: string }) {
  const [blocks, setBlocks] = useState<RoutineBlock[]>([]);
  const [result, setResult] = useState<unknown>(null);
  const [form, setForm] = useState({
    label: "Morning workout",
    category: "Health",
    type: "PLAN" as "PLAN" | "ACTUAL",
    start_time: new Date().toISOString().slice(0, 16),
    end_time: new Date(Date.now() + 3600 * 1000).toISOString().slice(0, 16),
  });

  const [startQuery, setStartQuery] = useState(new Date(Date.now() - 24 * 3600 * 1000).toISOString().slice(0, 16));
  const [endQuery, setEndQuery] = useState(new Date(Date.now() + 24 * 3600 * 1000).toISOString().slice(0, 16));

  const refresh = useCallback(async () => {
    const r = await getLocalRoutineBlocks(userId, {
      from: startQuery ? new Date(startQuery).toISOString() : undefined,
      to: endQuery ? new Date(endQuery).toISOString() : undefined,
    });
    setResult(r);
    if (!r.error && r.data) setBlocks(r.data);
  }, [userId, startQuery, endQuery]);

  useEffect(() => { 
    refresh(); 
    const handleSync = () => refresh();
    window.addEventListener("sync-completed", handleSync);
    return () => window.removeEventListener("sync-completed", handleSync);
  }, [refresh]);

  const handleCreate = async () => {
    const payload = {
      ...form,
      start_time: new Date(form.start_time).toISOString(),
      end_time: new Date(form.end_time).toISOString(),
      user_id: userId
    };
    const r = await createLocalRoutineBlock(payload);
    setResult(r);
    refresh();
  };

  const handleUpdateLabel = async (id: string) => {
    const r = await updateLocalRoutineBlock(id, {
      label: prompt("New label:") ?? undefined,
    });
    setResult(r);
    refresh();
  };

  const handleDelete = async (id: string) => {
    const r = await deleteLocalRoutineBlock(id);
    setResult(r);
    refresh();
  };

  return (
    <Section title="🗓 Routine Blocks">
      <div className="form-grid">
        <div className="row">
          <input className="input" type="datetime-local" value={startQuery} onChange={(e) => setStartQuery(e.target.value)} title="Start After" />
          <input className="input" type="datetime-local" value={endQuery} onChange={(e) => setEndQuery(e.target.value)} title="Start Before" />
          <ActionBtn label="Refresh" onClick={refresh} variant="secondary" />
        </div>
        <div className="row">
          <input className="input" placeholder="Label" value={form.label}
            onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))} />
          <input className="input" placeholder="Category" value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} />
          <select className="input" value={form.type}
            onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as "PLAN" | "ACTUAL" }))}>
            <option value="PLAN">PLAN</option>
            <option value="ACTUAL">ACTUAL</option>
          </select>
        </div>
        <div className="row">
          <input className="input" type="datetime-local" value={form.start_time} onChange={(e) => setForm(f => ({ ...f, start_time: e.target.value }))} title="Start Time" />
          <input className="input" type="datetime-local" value={form.end_time} onChange={(e) => setForm(f => ({ ...f, end_time: e.target.value }))} title="End Time" />
          <ActionBtn label="Create" onClick={handleCreate} />
        </div>
      </div>
      <div className="item-list">
        {blocks.map((b) => (
          <div key={b.id} className="item">
            <span className="item-label">
              <span className={`badge badge-${b.type.toLowerCase()}`}>{b.type}</span>
              {" "}{b.label}
            </span>
            <span className="item-meta">{b.category} · {b.id.slice(0, 8)}…</span>
            <div className="item-actions">
              <ActionBtn label="Rename" onClick={() => handleUpdateLabel(b.id)} variant="secondary" />
              <ActionBtn label="Delete" onClick={() => handleDelete(b.id)} variant="danger" />
            </div>
          </div>
        ))}
      </div>
      <Result data={result} />
    </Section>
  );
}

// ─── Journals Panel ─────────────────────────────────────────────────────────

function JournalsPanel({ userId }: { userId: string }) {
  const [journals, setJournals] = useState<Journal[]>([]);
  const [result, setResult] = useState<unknown>(null);
  const [content, setContent] = useState("Today I felt focused and productive.");
  const [startTime, setStartTime] = useState(new Date().toISOString().slice(0,16));
  const [endTime, setEndTime] = useState(new Date(Date.now() + 3600 * 1000).toISOString().slice(0,16));
  
  // Query state
  const [startQuery, setStartQuery] = useState(new Date(Date.now() - 24 * 3600 * 1000).toISOString().slice(0, 16));
  const [endQuery, setEndQuery] = useState(new Date(Date.now() + 24 * 3600 * 1000).toISOString().slice(0, 16));

  const refresh = useCallback(async () => {
    const r = await getLocalJournals(userId, {
      from: startQuery ? new Date(startQuery).toISOString() : undefined,
      to: endQuery ? new Date(endQuery).toISOString() : undefined,
    });
    setResult(r);
    if (!r.error && r.data) setJournals(r.data);
  }, [userId, startQuery, endQuery]);

  useEffect(() => { 
    refresh(); 
    const handleSync = () => refresh();
    window.addEventListener("sync-completed", handleSync);
    return () => window.removeEventListener("sync-completed", handleSync);
  }, [refresh]);

  const handleCreate = async () => {
    const r = await createLocalJournal({ 
      user_id: userId, 
      content, 
      start_time: startTime ? new Date(startTime).toISOString() : null, 
      end_time: endTime ? new Date(endTime).toISOString() : null,
      ai_analysis: null
    });
    setResult(r);
    refresh();
  };

  const handleUpdate = async (id: string, currentContent: string) => {
    const newContent = prompt("New content:", currentContent) ?? currentContent;
    const r = await updateLocalJournal(id, { content: newContent });
    setResult(r);
    refresh();
  };

  const handleDelete = async (id: string) => {
    const r = await deleteLocalJournal(id);
    setResult(r);
    refresh();
  };

  return (
    <Section title="📓 Journals">
      <div className="form-grid">
        <div className="row">
          <input className="input" type="datetime-local" value={startQuery} onChange={(e) => setStartQuery(e.target.value)} title="Start After" />
          <input className="input" type="datetime-local" value={endQuery} onChange={(e) => setEndQuery(e.target.value)} title="Start Before" />
          <ActionBtn label="Refresh" onClick={refresh} variant="secondary" />
        </div>
        <div className="row">
          <input className="input" type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} title="Start Time" />
          <input className="input" type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} title="End Time" />
        </div>
        <textarea className="input textarea" value={content}
          onChange={(e) => setContent(e.target.value)} rows={3} placeholder="Journal content..." />
        <div className="row">
          <ActionBtn label="Create" onClick={handleCreate} />
        </div>
      </div>
      <div className="item-list">
        {journals.map((j) => (
          <div key={j.id} className="item">
            <span className="item-label">
              📅 {j.start_time?.slice(0, 10)} — {j.content.slice(0, 60)}{j.content.length > 60 ? "…" : ""}
            </span>
            <span className="item-meta">{j.id.slice(0, 8)}…</span>
            <div className="item-actions">
              <ActionBtn label="Edit" onClick={() => handleUpdate(j.id, j.content)} variant="secondary" />
              <ActionBtn label="Delete" onClick={() => handleDelete(j.id)} variant="danger" />
            </div>
          </div>
        ))}
      </div>
      <Result data={result} />
    </Section>
  );
}

// ─── User Stats Panel ────────────────────────────────────────────────────────

function UserStatsPanel({ userId }: { userId: string }) {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [result, setResult] = useState<unknown>(null);

  const refresh = useCallback(async () => {
    const r = await getLocalUserStats(userId);
    setResult(r);
    if (!r.error) setStats(r.data);
  }, [userId]);

  useEffect(() => { 
    refresh(); 
    const handleSync = () => refresh();
    window.addEventListener("sync-completed", handleSync);
    return () => window.removeEventListener("sync-completed", handleSync);
  }, [refresh]);

  return (
    <Section title="👤 User Stats">
      {stats && (
        <div className="profile-grid">
          <div className="stat"><span className="stat-label">XP</span><span className="stat-value">{stats.xp}</span></div>
          <div className="stat"><span className="stat-label">Coins</span><span className="stat-value">{stats.coins}</span></div>
          <div className="stat"><span className="stat-label">Streak</span><span className="stat-value">{stats.current_streak}🔥</span></div>
          <div className="stat"><span className="stat-label">Best Streak</span><span className="stat-value">{stats.longest_streak}</span></div>
        </div>
      )}
      <div className="row">
        <ActionBtn label="Refresh" onClick={refresh} variant="secondary" />
      </div>
      <Result data={result} />
    </Section>
  );
}

// ─── Auth Gate ──────────────────────────────────────────────────────────────

import { useSyncStore } from "@/lib/stores/sync-store";

export default function CRUDTestPage() {
  const { user, loading } = useAuth();
  const userId = user?.id;

  if (loading) {
    return (
      <div className="page-center">
        <div className="spinner" />
        <p>Checking auth…</p>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="page-center">
        <div className="auth-card">
          <h1>🔐 Auth Required</h1>
          <p>Not authenticated. Sign in first.</p>
          <p className="hint">This page requires an authenticated session. If you are offline, you must have logged in previously to access this page.</p>
          <div className="mt-6">
            <a href="/login" className="btn btn-primary" style={{ textDecoration: 'none', display: 'inline-block' }}>
              Go to Login Page
            </a>
          </div>
        </div>
      </div>
    );
  }
  return (
    <>
      <style>{styles}</style>
      <div className="page">
        <header className="page-header" style={{ position: "relative" }}>
          <h1 className="page-title">🧪 CRUD Test Lab</h1>
          <p className="page-subtitle">
            Direct DB layer testing · User: <code>{userId.slice(0, 8)}…</code>
          </p>
        </header>
        <div className="panels">
          <TasksPanel userId={userId} />
          <RoutineBlocksPanel userId={userId} />
          <JournalsPanel userId={userId} />
          <UserStatsPanel userId={userId} />
        </div>
      </div>
    </>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .page {
    min-height: 100vh;
    background: #0a0a0f;
    color: #e2e8f0;
    font-family: 'Inter', system-ui, sans-serif;
    padding: 2rem;
  }

  .page-header {
    text-align: center;
    margin-bottom: 2.5rem;
  }

  .page-title {
    font-size: 2rem;
    font-weight: 700;
    background: linear-gradient(135deg, #a78bfa, #60a5fa, #34d399);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-bottom: 0.5rem;
  }

  .page-subtitle {
    color: #64748b;
    font-size: 0.875rem;
  }

  .page-subtitle code {
    background: #1e293b;
    padding: 0.1rem 0.4rem;
    border-radius: 4px;
    font-family: monospace;
    color: #94a3b8;
  }

  .panels {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(420px, 1fr));
    gap: 1.5rem;
    max-width: 1400px;
    margin: 0 auto;
  }

  .section {
    background: linear-gradient(135deg, #0f172a, #111827);
    border: 1px solid #1e293b;
    border-radius: 16px;
    overflow: hidden;
  }

  .section-title {
    font-size: 1rem;
    font-weight: 600;
    color: #cbd5e1;
    padding: 1rem 1.25rem;
    border-bottom: 1px solid #1e293b;
    background: rgba(255,255,255,0.02);
  }

  .section-body {
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .row {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    flex-wrap: wrap;
  }

  .form-grid {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .input {
    flex: 1;
    min-width: 0;
    background: #0f172a;
    border: 1px solid #1e293b;
    border-radius: 8px;
    padding: 0.5rem 0.75rem;
    color: #e2e8f0;
    font-size: 0.875rem;
    outline: none;
    transition: border-color 0.15s;
    width: 100%;
  }

  .input:focus {
    border-color: #6366f1;
    box-shadow: 0 0 0 2px rgba(99,102,241,0.15);
  }

  .input-sm { max-width: 100px; width: auto; flex: none; }

  .textarea { resize: vertical; font-family: inherit; }

  select.input { cursor: pointer; }

  .btn {
    padding: 0.5rem 1rem;
    border-radius: 8px;
    border: none;
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .btn-primary {
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: white;
  }
  .btn-primary:hover { filter: brightness(1.15); transform: translateY(-1px); }

  .btn-secondary {
    background: #1e293b;
    color: #94a3b8;
    border: 1px solid #334155;
  }
  .btn-secondary:hover { background: #263347; color: #cbd5e1; }

  .btn-danger {
    background: rgba(239,68,68,0.1);
    color: #f87171;
    border: 1px solid rgba(239,68,68,0.2);
  }
  .btn-danger:hover { background: rgba(239,68,68,0.2); }

  .item-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    max-height: 240px;
    overflow-y: auto;
  }

  .item {
    background: #0f172a;
    border: 1px solid #1e293b;
    border-radius: 8px;
    padding: 0.6rem 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    transition: border-color 0.15s;
  }
  .item:hover { border-color: #334155; }
  .item-done { opacity: 0.55; }

  .item-label {
    font-size: 0.875rem;
    color: #cbd5e1;
    word-break: break-word;
  }

  .item-meta {
    font-size: 0.7rem;
    color: #475569;
    font-family: monospace;
  }

  .item-actions {
    display: flex;
    gap: 0.4rem;
    flex-wrap: wrap;
  }

  .badge {
    display: inline-block;
    padding: 0.15rem 0.45rem;
    border-radius: 4px;
    font-size: 0.65rem;
    font-weight: 700;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }
  .badge-plan { background: rgba(99,102,241,0.15); color: #818cf8; }
  .badge-actual { background: rgba(52,211,153,0.15); color: #34d399; }

  .profile-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.75rem;
  }

  .stat {
    background: #0f172a;
    border: 1px solid #1e293b;
    border-radius: 10px;
    padding: 0.75rem;
    text-align: center;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .stat-label { font-size: 0.65rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
  .stat-value { font-size: 1.25rem; font-weight: 700; color: #a78bfa; }

  .result-box {
    background: #060b14;
    border: 1px solid #1e293b;
    border-radius: 8px;
    padding: 0.75rem;
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
    font-size: 0.7rem;
    color: #64748b;
    max-height: 160px;
    overflow-y: auto;
    white-space: pre-wrap;
    word-break: break-all;
    line-height: 1.5;
  }
  
  .error-box {
    background: #1f0b0f;
    border: 1px solid #7f1d1d;
    color: #f87171;
    font-family: system-ui;
  }

  .page-center {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    gap: 1rem;
    background: #0a0a0f;
    color: #64748b;
    font-family: system-ui;
  }

  .auth-card {
    background: #0f172a;
    border: 1px solid #1e293b;
    border-radius: 16px;
    padding: 2rem;
    text-align: center;
    max-width: 400px;
  }

  .auth-card h1 { color: #e2e8f0; margin-bottom: 0.75rem; }
  .auth-card p { color: #94a3b8; margin-bottom: 0.5rem; }
  .hint { font-size: 0.8rem; color: #475569 !important; }

  .spinner {
    width: 32px; height: 32px;
    border: 3px solid #1e293b;
    border-top-color: #6366f1;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
`;
