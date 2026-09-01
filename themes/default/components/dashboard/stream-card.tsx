"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Clock, BookOpen, Activity, Trash2, ChevronDown, CheckCircle2 } from "lucide-react";
import type { Task, RoutineBlock, Journal, EnrichedMetricEntry, TimelineItem } from "@/lib/db/types";
import { updateLocalTask, deleteLocalTask } from "@/lib/local-db/tasks";
import { deleteLocalRoutineBlock, updateLocalRoutineBlock } from "@/lib/local-db/routine-blocks";
import { deleteLocalJournal } from "@/lib/local-db/journals";
import { deleteLocalEntry } from "@/lib/local-db/metrics";
import styles from "../../theme.module.css";
import { cn, toTitleCase } from "@/lib/utils";

interface StreamCardProps {
  item: TimelineItem;
  onRefresh: () => void;
}

export function StreamCard({ item, onRefresh }: StreamCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatTime = (timeIso: string) => {
    return new Date(timeIso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  if (item.type === "task") {
    const task = item.data;
    const isCompleted = task.completed_at !== null;

    const handleToggle = async (e: React.MouseEvent) => {
      e.stopPropagation();
      await updateLocalTask(task.id, {
        completed_at: isCompleted ? null : new Date().toISOString(),
      });
      onRefresh();
    };

    const handleDelete = async (e: React.MouseEvent) => {
      e.stopPropagation();
      await deleteLocalTask(task.id);
      onRefresh();
    };

    return (
      <motion.div
        layout
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          styles.glassPanel,
          "px-3.5 py-2.5 rounded-2xl flex flex-col gap-2 cursor-pointer transition-all duration-300 border-white/[0.09] hover:border-white/25",
          isCompleted && "opacity-60"
        )}
      >
        <div className="flex items-center justify-between gap-3">
          {/* Checkbox & Task Label */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={handleToggle}
              aria-label={isCompleted ? "Mark incomplete" : "Mark complete"}
              className={cn(
                "w-5 h-5 rounded-full flex items-center justify-center transition-all shrink-0 border cursor-pointer",
                isCompleted
                  ? "bg-blue-500 border-blue-400 text-white"
                  : "bg-white/5 border-white/20 hover:border-white/40 text-transparent"
              )}
            >
              <Check className="w-3 h-3 stroke-[3]" />
            </button>

            <span
              className={cn(
                "text-xs font-medium truncate",
                isCompleted ? "line-through text-white/40" : "text-white/90"
              )}
            >
              {task.label}
            </span>
          </div>

          {/* Time & Expand Indicator */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] font-mono text-white/35">
              {formatTime(task.start_time)}
            </span>
            <ChevronDown
              className={cn(
                "w-3.5 h-3.5 text-white/30 transition-transform duration-200",
                isExpanded && "rotate-180"
              )}
            />
          </div>
        </div>

        {/* Quick Inline Actions when Tapped */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center justify-between pt-2 border-t border-white/5 text-[11px]"
            >
              <span className="text-white/40 font-mono">
                {task.end_time ? `Scheduled until ${formatTime(task.end_time)}` : "Anytime"}
              </span>
              <button
                onClick={handleDelete}
                className="flex items-center gap-1 text-red-400/80 hover:text-red-300 transition-colors p-1"
              >
                <Trash2 className="w-3 h-3" />
                <span>Delete</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }

  if (item.type === "routine_block") {
    const block = item.data;
    const isPlan = block.type === "PLAN";

    const handleDelete = async (e: React.MouseEvent) => {
      e.stopPropagation();
      await deleteLocalRoutineBlock(block.id);
      onRefresh();
    };

    const handleToggleType = async (e: React.MouseEvent) => {
      e.stopPropagation();
      await updateLocalRoutineBlock(block.id, {
        type: isPlan ? "ACTUAL" : "PLAN",
      });
      onRefresh();
    };

    return (
      <motion.div
        layout
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          styles.glassPanel,
          "px-3.5 py-2.5 rounded-2xl flex flex-col gap-2 cursor-pointer transition-all duration-300 border-white/[0.09] hover:border-white/25"
        )}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-2 h-2 rounded-full bg-amber-400/90 shadow-[0_0_8px_rgba(251,191,36,0.6)] shrink-0" />
            <span className="text-xs font-medium text-white/90 truncate">{block.label}</span>
            <span className="text-[9px] font-mono text-white/40 px-1.5 py-0.5 rounded bg-white/5 border border-white/10 hidden sm:inline">
              {block.category}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] font-mono text-white/35">
              {formatTime(block.start_time)} → {formatTime(block.end_time)}
            </span>
            <span
              className={cn(
                "text-[9px] font-mono uppercase px-1.5 py-0.5 rounded border",
                isPlan
                  ? "text-amber-300/80 border-amber-500/20 bg-amber-500/5"
                  : "text-emerald-300/80 border-emerald-500/20 bg-emerald-500/5"
              )}
            >
              {block.type}
            </span>
          </div>
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center justify-between pt-2 border-t border-white/5 text-[11px]"
            >
              <button
                onClick={handleToggleType}
                className="text-white/60 hover:text-white transition-colors"
              >
                Switch to {isPlan ? "ACTUAL (Logged)" : "PLAN (Scheduled)"}
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center gap-1 text-red-400/80 hover:text-red-300 transition-colors p-1"
              >
                <Trash2 className="w-3 h-3" />
                <span>Delete</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }

  if (item.type === "journal") {
    const journal = item.data;

    const handleDelete = async (e: React.MouseEvent) => {
      e.stopPropagation();
      await deleteLocalJournal(journal.id);
      onRefresh();
    };

    return (
      <motion.div
        layout
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          styles.glassPanel,
          "px-3.5 py-2.5 rounded-2xl flex flex-col gap-2 cursor-pointer transition-all duration-300 border-white/[0.09] hover:border-white/25"
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5 min-w-0">
            <BookOpen className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
            <p className={cn("text-xs text-white/80 leading-relaxed", !isExpanded && "line-clamp-1")}>
              {journal.content}
            </p>
          </div>

          <span className="text-[10px] font-mono text-white/35 shrink-0">
            {formatTime(journal.start_time)}
          </span>
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex justify-end pt-2 border-t border-white/5 text-[11px]"
            >
              <button
                onClick={handleDelete}
                className="flex items-center gap-1 text-red-400/80 hover:text-red-300 transition-colors p-1"
              >
                <Trash2 className="w-3 h-3" />
                <span>Delete</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }

  if (item.type === "metric_entry") {
    const entry = item.data;

    const handleDelete = async (e: React.MouseEvent) => {
      e.stopPropagation();
      await deleteLocalEntry(entry.id);
      onRefresh();
    };

    return (
      <motion.div
        layout
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          styles.glassPanel,
          "px-3.5 py-2.5 rounded-2xl flex flex-col gap-2 cursor-pointer transition-all duration-300 border-white/[0.09] hover:border-white/25"
        )}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <Activity className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <span className="text-xs font-medium text-white/90">{toTitleCase(entry.definition.name)}</span>
            <span className="text-xs font-semibold text-purple-300">
              +{entry.value} {entry.definition.unit || ""}
            </span>
          </div>

          <span className="text-[10px] font-mono text-white/35 shrink-0">
            {formatTime(entry.start_time)}
          </span>
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex justify-end pt-2 border-t border-white/5 text-[11px]"
            >
              <button
                onClick={handleDelete}
                className="flex items-center gap-1 text-red-400/80 hover:text-red-300 transition-colors p-1"
              >
                <Trash2 className="w-3 h-3" />
                <span>Delete</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }

  return null;
}
