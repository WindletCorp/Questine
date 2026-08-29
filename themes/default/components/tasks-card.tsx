"use client";

import { useState } from "react";
import { DeckCard } from "./deck-card";
import { CheckSquare } from "lucide-react";
import { cn } from "@/lib/utils";

interface Task {
  id: string;
  title: string;
  time: string;
  completed: boolean;
}

export function TasksCard({ 
  position = 1, 
  isExpanded = false, 
  onClick 
}: { 
  position?: 0 | 1 | 2 | 3; 
  isExpanded?: boolean; 
  onClick?: (e: React.MouseEvent) => void; 
}) {
  const [tasks, setTasks] = useState<Task[]>([
    { id: "t1", title: "Deploy glassmorphic core", time: "09:15 – 09:45", completed: true },
    { id: "t2", title: "Isolate scroll gesture engine", time: "10:00 – 10:45", completed: false }
  ]);

  const toggleTask = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const completedCount = tasks.filter(t => t.completed).length;

  return (
    <DeckCard
      position={position}
      isExpanded={isExpanded}
      onClick={onClick}
      icon={<CheckSquare className="w-4 h-4 text-white/80" />}
      title="Tasks"
      subtitleTop={`${completedCount}/${tasks.length} Completed`}
      subtitleBottom="Scheduled Action Items"
      accentColor="blue"
    >
      <div className="space-y-1.5 pt-1">
        {tasks.map(task => (
          <div key={task.id} className="p-2 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between gap-2">
            <label className="flex items-center gap-2 text-xs text-white/90 cursor-pointer min-w-0 flex-1">
              <input 
                type="checkbox" 
                checked={task.completed} 
                onChange={() => toggleTask(task.id)}
                className="accent-white w-3.5 h-3.5 rounded border-white/30 cursor-pointer shrink-0" 
              />
              <span className={cn("truncate text-[11px] transition-all", task.completed && "line-through opacity-50")}>
                {task.title}
              </span>
            </label>
            <span className="text-[9px] font-mono text-white/40 shrink-0 bg-white/5 px-2 py-0.5 rounded-full">
              {task.time}
            </span>
          </div>
        ))}
      </div>
    </DeckCard>
  );
}
