"use client";

import React from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Clock, Activity, BookOpen, TrendingUp } from "lucide-react";
import type { WeekAnalytics } from "@/lib/local-db/analytics";
import styles from "../../theme.module.css";
import { cn } from "@/lib/utils";

interface AnalyticsPanelProps {
  analytics: WeekAnalytics;
  weekLabel: string;
}

export function AnalyticsPanel({ analytics, weekLabel }: AnalyticsPanelProps) {
  const { tasks, routines, metrics, journals } = analytics;

  // SVG Progress Ring calculations
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (tasks.completionRate / 100) * circumference;

  return (
    <div className="flex flex-col h-full w-full gap-4">
      {/* Header / Week Context */}
      <div className="flex items-center justify-between px-1">
        <div className="flex flex-col">
          <span className="text-[10px] font-mono uppercase tracking-widest text-white/40">Performance Overview</span>
          <h2 className="text-sm font-semibold text-white mt-0.5">{weekLabel}</h2>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-white/70 text-[11px] font-mono">
          <Activity className="w-3 h-3 text-emerald-400" />
          <span>Live Synced</span>
        </div>
      </div>

      {/* Scrollable Analytics Body */}
      <div className={cn("flex-1 flex flex-col gap-3.5 pr-1", styles.customGlassScroll)} style={{ maxHeight: "calc(100dvh - 160px)" }}>
        
        {/* KPI Grid */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* Task Completion Card */}
          <div className={cn(styles.glassPanel, "p-3.5 flex items-center justify-between")}>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5 text-white/40 mb-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-[10px] font-mono uppercase tracking-wider">Tasks</span>
              </div>
              <span className="text-lg font-semibold text-white">
                {tasks.completed}<span className="text-xs text-white/40 font-normal">/{tasks.total}</span>
              </span>
              <span className="text-[10px] text-white/50 mt-0.5">{tasks.completionRate}% complete</span>
            </div>

            {/* Circular Progress Ring */}
            <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 70 70">
                <circle
                  cx="35"
                  cy="35"
                  r={radius}
                  className="stroke-white/10"
                  strokeWidth="5"
                  fill="transparent"
                />
                <motion.circle
                  cx="35"
                  cy="35"
                  r={radius}
                  className="stroke-blue-400"
                  strokeWidth="5"
                  strokeDasharray={circumference}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <span className="absolute text-[10px] font-mono font-medium text-white/90">
                {tasks.completionRate}%
              </span>
            </div>
          </div>

          {/* Routine Adherence Card */}
          <div className={cn(styles.glassPanel, "p-3.5 flex flex-col justify-between")}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-white/40">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[10px] font-mono uppercase tracking-wider">Routines</span>
              </div>
              <span className="text-[10px] font-mono text-amber-300/80">{routines.adherenceRate}%</span>
            </div>

            <div className="my-2">
              <div className="text-base font-semibold text-white">
                {Math.round(routines.totalActualMinutes / 60 * 10) / 10}h
                <span className="text-xs text-white/40 font-normal"> / {Math.round(routines.totalPlannedMinutes / 60 * 10) / 10}h plan</span>
              </div>
            </div>

            {/* Adherence Progress Bar */}
            <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-amber-400 to-amber-300 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, routines.adherenceRate)}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
          </div>
        </div>

        {/* Routine Category Breakdown */}
        {routines.categories.length > 0 && (
          <div className={cn(styles.glassPanel, "p-3.5 flex flex-col gap-2.5")}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-widest text-white/40">Routine Distribution</span>
              <span className="text-[10px] text-white/40">{routines.actualCount} blocks tracked</span>
            </div>

            <div className="flex flex-col gap-2">
              {routines.categories.map((cat) => {
                const totalMins = cat.plannedMinutes || cat.actualMinutes || 1;
                const ratio = Math.min(100, Math.round((cat.actualMinutes / totalMins) * 100));
                return (
                  <div key={cat.category} className="flex flex-col gap-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-white/80 font-medium">{cat.category}</span>
                      <span className="text-white/40 font-mono">
                        {Math.round(cat.actualMinutes / 60 * 10) / 10}h / {Math.round(cat.plannedMinutes / 60 * 10) / 10}h
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full bg-white/40 rounded-full transition-all duration-500"
                        style={{ width: `${ratio}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tracked Metrics Trends & Sparklines */}
        <div className={cn(styles.glassPanel, "p-3.5 flex flex-col gap-3")}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-widest text-white/40">Tracked Metrics</span>
            <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
          </div>

          {metrics.length === 0 ? (
            <div className="py-4 text-center text-xs text-white/40">
              No metric entries logged for this period.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {metrics.map((metric) => (
                <div key={metric.metricId} className="flex flex-col gap-1.5 p-2.5 rounded-xl bg-white/[0.03] border border-white/8">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-white/90">{metric.name}</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm font-semibold text-purple-300">{metric.latestValue}</span>
                      {metric.unit && <span className="text-[10px] text-white/40">{metric.unit}</span>}
                    </div>
                  </div>

                  {/* Sparkline Chart */}
                  {metric.values.length > 1 && (
                    <div className="h-7 w-full mt-1">
                      <MetricSparkline values={metric.values.map(v => v.value)} />
                    </div>
                  )}

                  <div className="flex justify-between text-[9px] font-mono text-white/35">
                    <span>Avg: {metric.avgValue} {metric.unit || ""}</span>
                    <span>{metric.entriesCount} logged</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Journal & Notes Activity */}
        <div className={cn(styles.glassPanel, "p-3.5 flex items-center justify-between")}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-medium text-white">Journal Logs</span>
              <span className="text-[10px] text-white/40">{journals.wordCount} words recorded</span>
            </div>
          </div>
          <span className="text-sm font-semibold text-emerald-400">{journals.total} entries</span>
        </div>

      </div>
    </div>
  );
}

/**
 * Lightweight SVG sparkline
 */
function MetricSparkline({ values }: { values: number[] }) {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const width = 200;
  const height = 28;
  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 6) - 3;
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
      <defs>
        <linearGradient id="metricGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c084fc" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#c084fc" stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <polyline
        fill="none"
        stroke="#c084fc"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}
