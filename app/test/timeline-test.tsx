"use client";

import { useTimeline } from "@/lib/hooks/use-timeline";
import { getWeekBounds } from "@/lib/local-db/timeline";
import type { TimelineItem } from "@/lib/db/types";

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const TYPE_ICONS: Record<TimelineItem["type"], string> = {
  task: "📋",
  routine_block: "⏰",
  journal: "📓",
  metric_entry: "📊",
};

const TYPE_COLORS: Record<TimelineItem["type"], string> = {
  task: "#3b82f6",
  routine_block: "#f59e0b",
  journal: "#10b981",
  metric_entry: "#8b5cf6",
};

function getItemLabel(item: TimelineItem): string {
  switch (item.type) {
    case "task":
      return item.data.label;
    case "routine_block":
      return `${item.data.label} [${item.data.category}]`;
    case "journal":
      return item.data.content.slice(0, 80) + (item.data.content.length > 80 ? "…" : "");
    case "metric_entry":
      return `${item.data.definition.name}: ${item.data.value}${item.data.definition.unit ? ` ${item.data.definition.unit}` : ""}`;
  }
}

export function TimelineTest({ userId }: { userId: string }) {
  const {
    items,
    isLoading,
    error,
    oldestWeekOffset,
    newestWeekOffset,
    loadPreviousWeek,
    loadNextWeek,
    refresh,
  } = useTimeline(userId);

  const oldestBounds = getWeekBounds(oldestWeekOffset);
  const newestBounds = getWeekBounds(newestWeekOffset);

  return (
    <div
      style={{
        background: "#0f172a",
        border: "1px solid #1e293b",
        borderRadius: "12px",
        padding: "1rem",
        maxWidth: "600px",
        margin: "1rem auto",
        fontFamily: "system-ui",
        color: "#e2e8f0",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <h2 style={{ margin: 0, fontSize: "1.1rem" }}>Timeline Test</h2>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            onClick={loadPreviousWeek}
            aria-label="Load previous week"
            style={{
              padding: "0.25rem 0.75rem",
              background: "#1e293b",
              color: "#94a3b8",
              border: "1px solid #334155",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "0.8rem",
            }}
          >
            ← Older
          </button>
          <button
            onClick={refresh}
            aria-label="Refresh timeline"
            style={{
              padding: "0.25rem 0.75rem",
              background: "#1e293b",
              color: "#94a3b8",
              border: "1px solid #334155",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "0.8rem",
            }}
          >
            ↻
          </button>
          <button
            onClick={loadNextWeek}
            aria-label="Load next week"
            style={{
              padding: "0.25rem 0.75rem",
              background: "#1e293b",
              color: "#94a3b8",
              border: "1px solid #334155",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "0.8rem",
            }}
          >
            Newer →
          </button>
        </div>
      </div>

      {/* Range info */}
      <div style={{ fontSize: "0.75rem", color: "#64748b", marginBottom: "0.75rem" }}>
        {formatTime(oldestBounds.start)} → {formatTime(newestBounds.end)}
        {" · "}
        {items.length} items
        {" · "}
        {Math.abs(newestWeekOffset - oldestWeekOffset) + 1} week(s) loaded
      </div>

      {/* Status */}
      {isLoading && (
        <div style={{ textAlign: "center", padding: "1rem", color: "#64748b" }}>
          Loading…
        </div>
      )}
      {error && (
        <div style={{ padding: "0.5rem", background: "#7f1d1d", borderRadius: "6px", fontSize: "0.8rem", marginBottom: "0.5rem" }}>
          Error: {error}
        </div>
      )}

      {/* Items */}
      {!isLoading && items.length === 0 && (
        <div style={{ textAlign: "center", padding: "2rem", color: "#475569" }}>
          No items in this range. Try creating tasks, journals, or logging metrics.
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", maxHeight: "400px", overflowY: "auto" }}>
        {items.map((item, index) => (
          <div
            key={`${item.type}-${item.data.id}-${index}`}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "0.5rem",
              padding: "0.5rem",
              background: "#1e293b",
              borderRadius: "6px",
              borderLeft: `3px solid ${TYPE_COLORS[item.type]}`,
            }}
          >
            <span style={{ fontSize: "1rem", flexShrink: 0 }}>{TYPE_ICONS[item.type]}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "0.85rem", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {getItemLabel(item)}
              </div>
              <div style={{ fontSize: "0.7rem", color: "#64748b", marginTop: "2px" }}>
                {formatTime(item.data.start_time)}
                {item.data.start_time !== item.data.end_time && ` → ${formatTime(item.data.end_time)}`}
              </div>
            </div>
            <span
              style={{
                fontSize: "0.65rem",
                padding: "2px 6px",
                borderRadius: "4px",
                background: TYPE_COLORS[item.type] + "22",
                color: TYPE_COLORS[item.type],
                flexShrink: 0,
              }}
            >
              {item.type.replace("_", " ")}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
