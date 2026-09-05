"use client";

import React from "react";
import { CheckSquare, Calendar, Activity, BookOpen, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export type FeatureType = "task" | "routine" | "metric" | "journal";

interface ContextualFabProps {
  onOpenCreate: (type: FeatureType) => void;
}

export function ContextualFab({ onOpenCreate }: ContextualFabProps) {
  return (
    <div className="relative z-30 w-full flex justify-center items-center pointer-events-auto shrink-0 pb-1 px-2">
      <div className="flex items-center gap-1 sm:gap-1.5 p-1 sm:p-1.5 max-w-full overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden rounded-full bg-white/[0.08] backdrop-blur-[36px] border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.7),inset_0_1.5px_2px_rgba(255,255,255,0.45)]">
        {/* Task Trigger */}
        <button
          onClick={() => onOpenCreate("task")}
          className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-full text-[11px] sm:text-xs font-semibold text-white/80 hover:text-white bg-white/[0.04] hover:bg-blue-500/20 hover:border-blue-400/50 border border-white/10 transition-all cursor-pointer group shrink-0"
        >
          <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-blue-400/20 group-hover:bg-blue-400 flex items-center justify-center transition-colors">
            <CheckSquare className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-blue-300 group-hover:text-black" />
          </div>
          <span>Task</span>
        </button>

        {/* Routine Trigger */}
        <button
          onClick={() => onOpenCreate("routine")}
          className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-full text-[11px] sm:text-xs font-semibold text-white/80 hover:text-white bg-white/[0.04] hover:bg-amber-500/20 hover:border-amber-400/50 border border-white/10 transition-all cursor-pointer group shrink-0"
        >
          <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-amber-400/20 group-hover:bg-amber-400 flex items-center justify-center transition-colors">
            <Calendar className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-300 group-hover:text-black" />
          </div>
          <span>Routine</span>
        </button>

        {/* Metric Trigger */}
        <button
          onClick={() => onOpenCreate("metric")}
          className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-full text-[11px] sm:text-xs font-semibold text-white/80 hover:text-white bg-white/[0.04] hover:bg-purple-500/20 hover:border-purple-400/50 border border-white/10 transition-all cursor-pointer group shrink-0"
        >
          <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-purple-400/20 group-hover:bg-purple-400 flex items-center justify-center transition-colors">
            <Activity className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-purple-300 group-hover:text-black" />
          </div>
          <span>Metric</span>
        </button>

        {/* Journal Trigger */}
        <button
          onClick={() => onOpenCreate("journal")}
          className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-full text-[11px] sm:text-xs font-semibold text-white/80 hover:text-white bg-white/[0.04] hover:bg-emerald-500/20 hover:border-emerald-400/50 border border-white/10 transition-all cursor-pointer group shrink-0"
        >
          <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-emerald-400/20 group-hover:bg-emerald-400 flex items-center justify-center transition-colors">
            <BookOpen className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-emerald-300 group-hover:text-black" />
          </div>
          <span>Journal</span>
        </button>
      </div>
    </div>
  );
}
