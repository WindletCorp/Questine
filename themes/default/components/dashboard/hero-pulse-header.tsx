"use client";

import React from "react";
import { motion } from "framer-motion";
import { Sparkles, CheckCircle2, Clock, Flame, ChevronRight } from "lucide-react";
import type { WeekAnalytics } from "@/lib/local-db/analytics";
import { GlassButton } from "../glass-button";
import styles from "../../theme.module.css";
import { cn } from "@/lib/utils";

interface HeroPulseHeaderProps {
  analytics: WeekAnalytics;
  onOpenDetails: () => void;
}

export function HeroPulseHeader({ analytics, onOpenDetails }: HeroPulseHeaderProps) {
  const { tasks, routines, metrics, journals } = analytics;

  // Generate dynamic, human executive summary sentence
  const summarySentence = React.useMemo(() => {
    const remainingTasks = tasks.total - tasks.completed;
    const focusHours = Math.round((routines.totalActualMinutes / 60) * 10) / 10;

    if (tasks.total === 0 && routines.actualCount === 0) {
      return "Your canvas is calm. What's your primary intention today?";
    }
    if (remainingTasks === 0 && tasks.total > 0) {
      return `All ${tasks.total} tasks completed with ${focusHours}h of focused routines.`;
    }
    if (focusHours > 0) {
      return `${remainingTasks} task${remainingTasks === 1 ? "" : "s"} left · ${focusHours}h focus logged today.`;
    }
    return `${remainingTasks} task${remainingTasks === 1 ? "" : "s"} remaining for today.`;
  }, [tasks, routines]);

  return (
    <div className="w-full flex flex-col gap-2.5 shrink-0 px-1">
      {/* Calm Status Sentence */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <p className="text-xs md:text-sm font-medium text-white/90 tracking-wide">
            {summarySentence}
          </p>
        </div>

        <button
          onClick={onOpenDetails}
          className="text-[11px] font-mono text-white/40 hover:text-white/80 flex items-center gap-1 transition-colors cursor-pointer"
        >
          <span>Pulse</span>
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      {/* 3 Ultra-Clean Glass Status Pills */}
      <div className="grid grid-cols-3 gap-2">
        {/* Task Velocity Pill */}
        <div
          className={cn(
            styles.glassPanel,
            "py-2 px-3 rounded-xl flex items-center justify-between border-white/10"
          )}
        >
          <div className="flex items-center gap-2 min-w-0">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="text-[9px] font-mono uppercase tracking-wider text-white/40">Tasks</span>
              <span className="text-xs font-semibold text-white/90">
                {tasks.completed}/{tasks.total}
              </span>
            </div>
          </div>
          <span className="text-[10px] font-mono text-white/30 hidden sm:inline">
            {tasks.completionRate}%
          </span>
        </div>

        {/* Focus Hours Pill */}
        <div
          className={cn(
            styles.glassPanel,
            "py-2 px-3 rounded-xl flex items-center justify-between border-white/10"
          )}
        >
          <div className="flex items-center gap-2 min-w-0">
            <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="text-[9px] font-mono uppercase tracking-wider text-white/40">Focus</span>
              <span className="text-xs font-semibold text-white/90">
                {Math.round((routines.totalActualMinutes / 60) * 10) / 10}h
              </span>
            </div>
          </div>
          <span className="text-[10px] font-mono text-amber-300/60 hidden sm:inline">
            {routines.adherenceRate}%
          </span>
        </div>

        {/* Momentum / Metrics Pill */}
        <div
          className={cn(
            styles.glassPanel,
            "py-2 px-3 rounded-xl flex items-center justify-between border-white/10"
          )}
        >
          <div className="flex items-center gap-2 min-w-0">
            <Flame className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="text-[9px] font-mono uppercase tracking-wider text-white/40">Habits</span>
              <span className="text-xs font-semibold text-white/90">
                {metrics.length > 0 ? `${metrics[0].latestValue} ${metrics[0].unit || ""}` : "On Track"}
              </span>
            </div>
          </div>
          <span className="text-[10px] font-mono text-purple-300/60 hidden sm:inline">
            Active
          </span>
        </div>
      </div>
    </div>
  );
}
