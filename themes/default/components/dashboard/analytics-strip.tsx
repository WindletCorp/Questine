"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Clock, ChevronLeft, ChevronRight, Activity } from "lucide-react";
import type { WeekAnalytics } from "@/lib/local-db/analytics";

interface AnalyticsStripProps {
  analytics: WeekAnalytics;
}

export function AnalyticsStrip({ analytics }: AnalyticsStripProps) {
  const { tasks, routines, metrics } = analytics;

  // Single metric swipe/switch state
  const [activeMetricIndex, setActiveMetricIndex] = useState(0);
  
  const handleNextMetric = () => {
    setActiveMetricIndex((prev) => (prev + 1) % Math.max(1, metrics.length));
  };
  const handlePrevMetric = () => {
    setActiveMetricIndex((prev) => (prev - 1 + metrics.length) % Math.max(1, metrics.length));
  };

  const activeMetric = metrics[activeMetricIndex];

  // Ring calculations
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const taskOffset = circumference - (tasks.completionRate / 100) * circumference;

  return (
    <div className="w-full flex flex-col justify-start select-none pointer-events-none pb-4">
      <div className="w-full rounded-[28px] border border-white/20 bg-white/[0.06] backdrop-blur-[40px] shadow-[0_30px_90px_rgba(0,0,0,0.8),inset_0_2px_4px_rgba(255,255,255,0.4),inset_0_-2px_4px_rgba(0,0,0,0.3)] p-4 flex flex-col gap-3 pointer-events-auto">
        
        {/* Top Row: Task Ring + Routine Arc */}
        <div className="grid grid-cols-2 gap-3">
          {/* Task Card */}
          <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-3 flex items-center justify-between">
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5 text-white/40 mb-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-[10px] font-mono uppercase tracking-wider">Tasks</span>
              </div>
              <span className="text-sm font-semibold text-white">
                {tasks.completed}<span className="text-[10px] text-white/40 font-normal ml-0.5">/{tasks.total}</span>
              </span>
            </div>

            <div className="relative w-11 h-11 flex items-center justify-center shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 44 44">
                <circle cx="22" cy="22" r={radius} className="stroke-white/10" strokeWidth="3" fill="transparent" />
                <motion.circle
                  cx="22" cy="22" r={radius}
                  className="stroke-blue-400"
                  strokeWidth="3"
                  strokeLinecap="round"
                  fill="transparent"
                  initial={{ strokeDashoffset: circumference, strokeDasharray: circumference }}
                  animate={{ strokeDashoffset: taskOffset, strokeDasharray: circumference }}
                  transition={{ type: "spring", stiffness: 60, damping: 15 }}
                />
              </svg>
              <span className="absolute text-[9px] font-mono font-medium text-white/90">
                {tasks.total > 0 ? tasks.completionRate : 0}%
              </span>
            </div>
          </div>

          {/* Routine Card */}
          <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-3 flex flex-col justify-center">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5 text-white/40">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[10px] font-mono uppercase tracking-wider">Routines</span>
              </div>
              <span className="text-[10px] font-mono text-amber-300/80">{routines.adherenceRate}%</span>
            </div>
            
            <div className="flex items-baseline gap-1 mb-2">
              <span className="text-sm font-semibold text-white">
                {Math.round(routines.totalActualMinutes / 60 * 10) / 10}h
              </span>
              <span className="text-[10px] text-white/40">
                / {Math.round(routines.totalPlannedMinutes / 60 * 10) / 10}h
              </span>
            </div>

            <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-amber-400 to-amber-300 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, routines.adherenceRate)}%` }}
                transition={{ type: "spring", stiffness: 60, damping: 15 }}
              />
            </div>
          </div>
        </div>

        {/* Bottom Row: Metric Sparkline */}
        <div className="w-full bg-white/[0.03] border border-white/5 rounded-2xl p-3 flex flex-col">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button 
                onClick={handlePrevMetric}
                disabled={metrics.length <= 1}
                className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-colors disabled:opacity-30 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-[11px] font-mono uppercase tracking-widest text-purple-200 font-semibold">
                {activeMetric ? activeMetric.name : "No Metrics"}
              </span>
              <button 
                onClick={handleNextMetric}
                disabled={metrics.length <= 1}
                className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-colors disabled:opacity-30 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            {activeMetric && (
              <div className="flex items-baseline gap-1">
                <span className="text-sm font-semibold text-white">{activeMetric.latestValue}</span>
                {activeMetric.unit && <span className="text-[10px] text-white/40">{activeMetric.unit}</span>}
              </div>
            )}
          </div>

          {/* Sparkline Area */}
          <div className="h-10 w-full mt-2 flex items-center justify-center">
            {!activeMetric || activeMetric.values.length < 2 ? (
              <span className="text-[10px] text-white/30 italic">Not enough data to trend</span>
            ) : (
              <MetricSparkline values={activeMetric.values.map(v => v.value)} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricSparkline({ values }: { values: number[] }) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const width = 300;
  const height = 32;
  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
      <defs>
        <linearGradient id="metricGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c084fc" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#c084fc" stopOpacity="0.0" />
        </linearGradient>
      </defs>
      
      {/* Path animation using strokeDasharray */}
      <motion.polyline
        fill="none"
        stroke="#c084fc"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
      />
    </svg>
  );
}
