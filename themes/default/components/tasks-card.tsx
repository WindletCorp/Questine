"use client";

import { useState } from "react";
import { DeckCard } from "./deck-card";
import { CheckSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Task } from "@/lib/db/types";
import { updateLocalTask } from "@/lib/local-db/tasks";

export function TasksCard({ 
  position = 1, 
  isExpanded = false, 
  onClick,
  task
}: { 
  position?: 0 | 1 | 2 | 3; 
  isExpanded?: boolean; 
  onClick?: (e: React.MouseEvent) => void;
  task?: Task;
}) {
  const toggleTask = async () => {
    if (!task) return;
    try {
      await updateLocalTask(task.id, { 
        completed_at: task.completed_at ? null : new Date().toISOString() 
      });
    } catch (e) {
      console.error(e);
    }
  };

  const isCompleted = !!task?.completed_at;

  const formatTime = (iso?: string) => {
    if (!iso) return "";
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <DeckCard
      position={position}
      isExpanded={isExpanded}
      onClick={onClick}
      icon={<CheckSquare className="w-4 h-4 text-white/80" />}
      title="Next Task"
      subtitleTop={task ? formatTime(task.start_time) : ""}
      subtitleBottom={task ? task.category : "No scheduled tasks"}
      accentColor="blue"
    >
      <div className="space-y-1.5 pt-1">
        {task ? (
          <div className="p-2 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between gap-2">
            <label className="flex items-center gap-2 text-xs text-white/90 cursor-pointer min-w-0 flex-1">
              <input 
                type="checkbox" 
                checked={isCompleted} 
                onChange={toggleTask}
                className="accent-white w-3.5 h-3.5 rounded border-white/30 cursor-pointer shrink-0" 
              />
              <span className={cn("truncate text-[11px] transition-all", isCompleted && "line-through opacity-50")}>
                {task.title}
              </span>
            </label>
            <span className="text-[9px] font-mono text-white/40 shrink-0 bg-white/5 px-2 py-0.5 rounded-full">
              {formatTime(task.start_time)}
            </span>
          </div>
        ) : (
          <p className="text-[11px] text-white/60 leading-relaxed italic">
            You're all caught up for today!
          </p>
        )}
      </div>
    </DeckCard>
  );
}
