"use client";

import { useState, useEffect, useCallback } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/providers/auth-provider";

// DB functions
import { getTasks, createTask, updateTask, deleteTask } from "@/lib/db/tasks";
import {
  getRoutineBlocks,
  createRoutineBlock,
  updateRoutineBlock,
  deleteRoutineBlock,
} from "@/lib/db/routine-blocks";
import {
  getJournals,
  createJournal,
  updateJournal,
  deleteJournal,
} from "@/lib/db/journals";
import {
  getUserStats,
} from "@/lib/db/user-stats";

import type { Task, RoutineBlock, Journal, UserStats } from "@/lib/db/types";

// ─── Helpers ────────────────────────────────────────────────────────────────

const client = createSupabaseBrowserClient();

function Result({ data }: { data: unknown }) {
  return (
    <pre className="result-box">
      {data === null ? "null" : JSON.stringify(data, null, 2)}
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
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 24 * 3600 * 1000).toISOString().slice(0, 16));

  // Query fields
  const [updatedAfter, setUpdatedAfter] = useState(new Date(Date.now() - 24 * 3600 * 1000).toISOString().slice(0, 16));
  const [updatedBefore, setUpdatedBefore] = useState(new Date(Date.now() + 24 * 3600 * 1000).toISOString().slice(0, 16));
  const [dueDateAfter, setDueDateAfter] = useState("");
  const [dueDateBefore, setDueDateBefore] = useState("");

  const refresh = useCallback(async () => {
    const r = await getTasks(
      client, 
      userId, 
      updatedAfter ? new Date(updatedAfter).toISOString() : undefined, 
      updatedBefore ? new Date(updatedBefore).toISOString() : undefined,
      dueDateAfter ? new Date(dueDateAfter).toISOString() : undefined,
      dueDateBefore ? new Date(dueDateBefore).toISOString() : undefined
    );
    setResult(r);
    if (!r.error) setTasks(r.data ?? []);
  }, [userId, updatedAfter, updatedBefore, dueDateAfter, dueDateBefore]);

  useEffect(() => { refresh(); }, [refresh]);

  const handleCreate = async () => {
    const r = await createTask(client, { 
      user_id: userId, 
      label, 
      due_date: dueDate ? new Date(dueDate).toISOString() : null,
      metadata: null 
    });
    setResult(r);
    refresh();
  };

  const handleComplete = async (id: string) => {
    const r = await updateTask(client, id, {
      completed_at: new Date().toISOString(),
    });
    setResult(r);
    refresh();
  };

  const handleUncomplete = async (id: string) => {
    const r = await updateTask(client, id, { completed_at: null });
    setResult(r);
    refresh();
  };

  const handleDelete = async (id: string) => {
    const r = await deleteTask(client, id);
    setResult(r);
    refresh();
  };

  return (
    <Section title="📋 Tasks">
      <div className="form-grid">
        <div className="row">
          <input className="input" type="datetime-local" value={updatedAfter} onChange={(e) => setUpdatedAfter(e.target.value)} placeholder="Updated After" title="Updated After" />
          <input className="input" type="datetime-local" value={updatedBefore} onChange={(e) => setUpdatedBefore(e.target.value)} placeholder="Updated Before" title="Updated Before" />
          <ActionBtn label="Refresh" onClick={refresh} variant="secondary" />
        </div>
        <div className="row">
          <input className="input" type="datetime-local" value={dueDateAfter} onChange={(e) => setDueDateAfter(e.target.value)} placeholder="Due After" title="Due After" />
          <input className="input" type="datetime-local" value={dueDateBefore} onChange={(e) => setDueDateBefore(e.target.value)} placeholder="Due Before" title="Due Before" />
        </div>
        <div className="row">
          <input
            className="input"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Task label"
          />
          <input className="input" type="datetime-local" value={dueDate} onChange={(e) => setDueDate(e.target.value)} placeholder="Due Date" title="Due Date" />
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
            <div className="item-actions">
              {!t.completed_at ? (
                <ActionBtn label="Complete" onClick={() => handleComplete(t.id)} variant="secondary" />
              ) : (
                <ActionBtn label="Undo" onClick={() => handleUncomplete(t.id)} variant="secondary" />
              )}
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
    const r = await getRoutineBlocks(
      client, 
      userId, 
      startQuery ? new Date(startQuery).toISOString() : undefined, 
      endQuery ? new Date(endQuery).toISOString() : undefined
    );
    setResult(r);
    if (!r.error && r.data) setBlocks(r.data);
  }, [userId, startQuery, endQuery]);

  useEffect(() => { refresh(); }, [refresh]);

  const handleCreate = async () => {
    const payload = {
      ...form,
      start_time: new Date(form.start_time).toISOString(),
      end_time: new Date(form.end_time).toISOString(),
      user_id: userId
    };
    const r = await createRoutineBlock(client, payload);
    setResult(r);
    refresh();
  };

  const handleUpdateLabel = async (id: string) => {
    const r = await updateRoutineBlock(client, id, {
      label: prompt("New label:") ?? undefined,
    });
    setResult(r);
    refresh();
  };

  const handleDelete = async (id: string) => {
    const r = await deleteRoutineBlock(client, id);
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
    const r = await getJournals(
      client, 
      userId, 
      startQuery ? new Date(startQuery).toISOString() : undefined, 
      endQuery ? new Date(endQuery).toISOString() : undefined
    );
    setResult(r);
    if (!r.error && r.data) setJournals(r.data);
  }, [userId, startQuery, endQuery]);

  useEffect(() => { refresh(); }, [refresh]);

  const handleCreate = async () => {
    const r = await createJournal(client, { 
      user_id: userId, 
      content, 
      start_time: new Date(startTime).toISOString(), 
      end_time: new Date(endTime).toISOString(),
      ai_analysis: null
    });
    setResult(r);
    refresh();
  };

  const handleUpdate = async (id: string, currentContent: string) => {
    const newContent = prompt("New content:", currentContent) ?? currentContent;
    const r = await updateJournal(client, id, { content: newContent });
    setResult(r);
    refresh();
  };

  const handleDelete = async (id: string) => {
    const r = await deleteJournal(client, id);
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
    const r = await getUserStats(client, userId);
    setResult(r);
    if (!r.error) setStats(r.data);
  }, [userId]);

  useEffect(() => { refresh(); }, [refresh]);

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

export default function CRUDTestPage() {
  const { user, loading } = useAuth();
  const userId = user?.id;

  if (loading || !userId) {
    return (
      <div className="page-center">
        <div className="spinner" />
        <p>Checking auth…</p>
      </div>
    );
  }

  return (
    <>
      <style>{styles}</style>
      <div className="page">
        <header className="page-header">
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
