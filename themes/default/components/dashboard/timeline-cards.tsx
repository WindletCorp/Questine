"use client";

import React from "react";
import { Check, Clock, Edit2, BookOpen, Activity, Trash2 } from "lucide-react";
import type { Task, RoutineBlock, Journal } from "@/lib/db/types";
import type { EnrichedMetricEntry, TimelineItem } from "@/lib/db/types";
import { updateLocalTask } from "@/lib/local-db/tasks";
import { cn } from "@/lib/utils";
import styles from "../../theme.module.css";

interface CardBaseProps {
  onEdit: (item: TimelineItem) => void;
  onRefresh?: () => void;
}

export function TaskTimelineCard({ task, onEdit, onRefresh }: { task: Task } & CardBaseProps) {
  const isCompleted = task.completed_at !== null;

  const handleToggleComplete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const newCompletedAt = isCompleted ? null : new Date().toISOString();
    await updateLocalTask(task.id, { completed_at: newCompletedAt });
    if (onRefresh) onRefresh();
  };

  return (
    <div
      onClick={() => onEdit({ type: "task", data: task })}
      className={cn(
        styles.glassPanel,
        "p-3.5 flex items-center justify-between gap-3 cursor-pointer group hover:border-white/30 transition-all"
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        {/* Interactive Checkbox */}
        <button
          onClick={handleToggleComplete}
          aria-label={isCompleted ? "Mark incomplete" : "Mark complete"}
          className={cn(
            "w-5 h-5 rounded-md flex items-center justify-center transition-all shrink-0 border",
            isCompleted
              ? "bg-blue-500 border-blue-400 text-white"
              : "bg-white/5 border-white/20 hover:border-white/40 text-transparent"
          )}
        >
          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
        </button>

        <div className="flex flex-col min-w-0">
          <span
            className={cn(
              "text-xs font-medium truncate transition-all",
              isCompleted ? "line-through text-white/40" : "text-white"
            )}
          >
            {task.label}
          </span>
          <div className="flex items-center gap-1.5 text-[10px] text-white/40 font-mono mt-0.5">
            <span>{formatTimeRange(task.start_time, task.end_time)}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <span className="text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400">
          Task
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit({ type: "task", data: task });
          }}
          className="opacity-0 group-hover:opacity-100 p-1 text-white/40 hover:text-white transition-opacity"
          aria-label="Edit task"
        >
          <Edit2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

export function RoutineTimelineCard({ block, onEdit }: { block: RoutineBlock } & CardBaseProps) {
  const isPlan = block.type === "PLAN";

  return (
    <div
      onClick={() => onEdit({ type: "routine_block", data: block })}
      className={cn(
        styles.glassPanel,
        "p-3.5 flex items-center justify-between gap-3 cursor-pointer group hover:border-white/30 transition-all"
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
          <Clock className="w-3.5 h-3.5 text-amber-400" />
        </div>

        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-white truncate">{block.label}</span>
            <span className="text-[9px] font-mono text-white/40 px-1.5 py-0.2 rounded bg-white/5 border border-white/10">
              {block.category}
            </span>
          </div>
          <span className="text-[10px] text-white/40 font-mono mt-0.5">
            {formatTimeRange(block.start_time, block.end_time)}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <span
          className={cn(
            "text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full border",
            isPlan
              ? "bg-amber-500/10 border-amber-500/20 text-amber-300"
              : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
          )}
        >
          {block.type}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit({ type: "routine_block", data: block });
          }}
          className="opacity-0 group-hover:opacity-100 p-1 text-white/40 hover:text-white transition-opacity"
          aria-label="Edit routine block"
        >
          <Edit2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

export function JournalTimelineCard({ journal, onEdit }: { journal: Journal } & CardBaseProps) {
  return (
    <div
      onClick={() => onEdit({ type: "journal", data: journal })}
      className={cn(
        styles.glassPanel,
        "p-3.5 flex items-start justify-between gap-3 cursor-pointer group hover:border-white/30 transition-all"
      )}
    >
      <div className="flex items-start gap-3 min-w-0">
        <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
          <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
        </div>

        <div className="flex flex-col min-w-0">
          <p className="text-xs text-white/90 font-medium line-clamp-2 leading-relaxed">
            {journal.content}
          </p>
          <span className="text-[10px] text-white/40 font-mono mt-1">
            {new Date(journal.start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <span className="text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
          Journal
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit({ type: "journal", data: journal });
          }}
          className="opacity-0 group-hover:opacity-100 p-1 text-white/40 hover:text-white transition-opacity"
          aria-label="Edit journal"
        >
          <Edit2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

export function MetricTimelineCard({ entry, onEdit }: { entry: EnrichedMetricEntry } & CardBaseProps) {
  return (
    <div
      onClick={() => onEdit({ type: "metric_entry", data: entry })}
      className={cn(
        styles.glassPanel,
        "p-3.5 flex items-center justify-between gap-3 cursor-pointer group hover:border-white/30 transition-all"
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
          <Activity className="w-3.5 h-3.5 text-purple-400" />
        </div>

        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-white truncate">{entry.definition.name}</span>
            <span className="text-xs font-semibold text-purple-300">
              {entry.value} {entry.definition.unit || ""}
            </span>
          </div>
          <span className="text-[10px] text-white/40 font-mono mt-0.5">
            {new Date(entry.start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <span className="text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400">
          Metric
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit({ type: "metric_entry", data: entry });
          }}
          className="opacity-0 group-hover:opacity-100 p-1 text-white/40 hover:text-white transition-opacity"
          aria-label="Edit metric entry"
        >
          <Edit2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

function formatTimeRange(start: string, end: string): string {
  const s = new Date(start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const e = new Date(end).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return s === e ? s : `${s} → ${e}`;
}
