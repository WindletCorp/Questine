"use client";

import React, { useState, useEffect } from "react";
import { motion, MotionValue, useTransform } from "framer-motion";
import { CheckCircle2, Calendar, ChevronLeft, ChevronRight, Activity, TrendingUp, Flame, Target } from "lucide-react";
import { fetchRangeAnalytics, type WeekAnalytics, type RangeAnalytics } from "@/lib/local-db/analytics";
import { cn } from "@/lib/utils";

interface AnalyticsStripProps {
  analytics: WeekAnalytics;
  y: MotionValue<number>;
  userId: string;
}

export function AnalyticsStrip({ analytics, y, userId }: AnalyticsStripProps) {
  // State for Range selection
  const [selectedRange, setSelectedRange] = useState<"timeline" | "day" | "week" | "month">("timeline");
  const [rangeData, setRangeData] = useState<RangeAnalytics | null>(null);
  const [isLoadingRange, setIsLoadingRange] = useState(false);

  // Fetch range data when selectedRange changes
  useEffect(() => {
    if (selectedRange === "timeline") {
      setRangeData(null);
      return;
    }
    const fetchData = async () => {
      setIsLoadingRange(true);
      const now = new Date();
      let start = new Date();
      if (selectedRange === "day") {
        start.setUTCHours(0, 0, 0, 0);
      } else if (selectedRange === "week") {
        start.setUTCDate(now.getUTCDate() - 7);
      } else if (selectedRange === "month") {
        start.setUTCDate(now.getUTCDate() - 30);
      }
      try {
        const data = await fetchRangeAnalytics(userId, start.toISOString(), now.toISOString());
        setRangeData(data);
      } catch (e) {
        console.error("Failed to fetch range analytics", e);
      } finally {
        setIsLoadingRange(false);
      }
    };
    fetchData();
  }, [selectedRange, userId]);

  // Use range data if available, otherwise fallback to timeline analytics
  const displayData = rangeData || analytics;
  const { tasks, routines, metrics } = displayData;
  const focusScore = rangeData ? rangeData.focusScore : Math.round((tasks.completionRate + routines.adherenceRate) / 2);
  const momentum = rangeData ? rangeData.momentum : 0;

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

  // Transforms for crossfading stages based on split `y` value
  const opStage2 = useTransform(y, [40, 120, 180], [0, 1, 0]);
  const scStage2 = useTransform(y, [40, 120, 180], [0.9, 1, 1.1]);
  const ptrStage2 = useTransform(y, (v) => (v > 60 && v < 160 ? "auto" : "none"));

  const opStage3 = useTransform(y, [160, 240, 360], [0, 1, 0]);
  const scStage3 = useTransform(y, [160, 240, 360], [0.95, 1, 1.05]);
  const ptrStage3 = useTransform(y, (v) => (v >= 160 && v < 360 ? "auto" : "none"));

  const opStage4 = useTransform(y, [320, 450], [0, 1]);
  const scStage4 = useTransform(y, [320, 450], [0.95, 1]);
  const ptrStage4 = useTransform(y, (v) => (v >= 360 ? "auto" : "none"));

  return (
    <div className="w-full h-full flex flex-col justify-start select-none pointer-events-none pb-4 relative">
      <div className="w-full h-full rounded-[28px] border border-white/20 bg-white/[0.06] backdrop-blur-[40px] shadow-[0_30px_90px_rgba(0,0,0,0.8),inset_0_2px_4px_rgba(255,255,255,0.4),inset_0_-2px_4px_rgba(0,0,0,0.3)] p-4 flex flex-col pointer-events-auto relative overflow-hidden">
        
        {/* Stage 2: Inline KPIs (15% Split) */}
        <motion.div 
          className="absolute inset-0 p-4 flex items-center justify-center gap-4"
          style={{ opacity: opStage2, scale: scStage2, pointerEvents: ptrStage2 }}
        >
          {/* Inline Tasks */}
          <div className="flex items-center gap-2 bg-white/[0.04] border border-white/10 rounded-full px-4 py-2">
            <CheckCircle2 className="w-4 h-4 text-blue-400" />
            <span className="text-[11px] font-semibold text-white/90">{tasks.completed}/{tasks.total}</span>
          </div>
          {/* Inline Routines */}
          <div className="flex items-center gap-2 bg-white/[0.04] border border-white/10 rounded-full px-4 py-2">
            <Calendar className="w-4 h-4 text-amber-400" />
            <span className="text-[11px] font-semibold text-white/90">{routines.adherenceRate}%</span>
          </div>
          {/* Inline Metrics */}
          {activeMetric && (
            <div className="flex items-center gap-2 bg-white/[0.04] border border-white/10 rounded-full px-4 py-2">
              <Activity className="w-4 h-4 text-purple-400" />
              <span className="text-[11px] font-semibold text-white/90">{activeMetric.latestValue}</span>
            </div>
          )}
        </motion.div>

        {/* Stage 3: Current 30% View */}
        <motion.div 
          className="absolute inset-0 p-4 flex flex-col gap-3"
          style={{ opacity: opStage3, scale: scStage3, pointerEvents: ptrStage3 }}
        >
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
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
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
                  className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-colors disabled:opacity-30 cursor-pointer pointer-events-auto"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-[11px] font-mono uppercase tracking-widest text-purple-200 font-semibold">
                  {activeMetric ? activeMetric.name : "No Metrics"}
                </span>
                <button 
                  onClick={handleNextMetric}
                  disabled={metrics.length <= 1}
                  className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-colors disabled:opacity-30 cursor-pointer pointer-events-auto"
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
        </motion.div>

        {/* Stage 4: Expanded Analytics View (100% Split) */}
        <motion.div 
          className="absolute inset-0 p-4 pt-6 flex flex-col gap-4 overflow-y-auto overflow-x-hidden [scrollbar-width:none]"
          style={{ opacity: opStage4, scale: scStage4, pointerEvents: ptrStage4 }}
        >
          {/* Header & Range Selector */}
          <div className="flex flex-col gap-3 px-2">
            <h2 className="text-lg font-semibold tracking-tight text-white/90 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-400" />
              Deep Dive Analytics
            </h2>
            <div className="flex p-1 bg-white/[0.04] border border-white/10 rounded-xl w-fit shadow-inner">
              {(["timeline", "day", "week", "month"] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setSelectedRange(range)}
                  className={cn(
                    "px-3 py-1 rounded-lg text-[10px] font-mono uppercase tracking-widest transition-all cursor-pointer",
                    selectedRange === range
                      ? "bg-indigo-500/20 text-indigo-200 border border-indigo-400/30 shadow-[0_2px_8px_rgba(99,102,241,0.2)]"
                      : "text-white/40 hover:text-white/70 hover:bg-white/[0.04]"
                  )}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>
          
          {isLoadingRange ? (
            <div className="flex-1 flex items-center justify-center h-48">
              <div className="w-6 h-6 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Activity Calendar (GitHub style) */}
              <div className="mt-2 flex flex-col gap-2 px-2">
                <span className="text-[11px] font-mono uppercase tracking-widest text-white/50">Activity Heatmap</span>
                <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 flex flex-wrap gap-1.5 shadow-[inset_0_1px_2px_rgba(255,255,255,0.05)]">
                  {rangeData?.activityDays && rangeData.activityDays.length > 0 ? (
                    rangeData.activityDays.map((day) => {
                      const totalActivity = day.taskCount + (day.routineActualMinutes / 15);
                      const intensity = totalActivity === 0 ? 0 : Math.min(4, Math.ceil(totalActivity / 2));
                      return (
                        <div 
                          key={day.date}
                          className={cn(
                            "w-4 h-4 rounded-[4px] transition-all hover:scale-110",
                            intensity === 0 && "bg-white/[0.04]",
                            intensity === 1 && "bg-indigo-500/30 border border-indigo-400/20",
                            intensity === 2 && "bg-indigo-500/50 border border-indigo-400/30",
                            intensity === 3 && "bg-indigo-500/80 border border-indigo-400/50",
                            intensity >= 4 && "bg-indigo-400 border border-indigo-300 shadow-[0_0_10px_rgba(129,140,248,0.5)]"
                          )}
                          title={`${day.date}: ${day.taskCount} tasks, ${Math.round(day.routineActualMinutes)} routine mins`}
                        />
                      );
                    })
                  ) : (
                    <span className="text-xs text-white/40 italic">Select a time range (Day/Week/Month) to view historical activity heatmap.</span>
                  )}
                </div>
              </div>

              {/* Routine Adherence Chart */}
              <div className="mt-2 flex flex-col gap-2 px-2">
                <span className="text-[11px] font-mono uppercase tracking-widest text-white/50">Routine Adherence</span>
                <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 flex flex-col gap-3 shadow-[inset_0_1px_2px_rgba(255,255,255,0.05)]">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-white/70">Actual Time ({Math.round(routines.totalActualMinutes)}m)</span>
                    <span className="text-emerald-400 font-bold">{routines.adherenceRate}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-white/[0.05] relative overflow-hidden">
                    <motion.div 
                      className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full shadow-[0_0_10px_rgba(52,211,153,0.5)]"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (routines.totalActualMinutes / (routines.totalPlannedMinutes || 1)) * 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-mono text-white/40">
                    <span>Target: {Math.round(routines.totalPlannedMinutes)}m</span>
                  </div>
                </div>
              </div>

              {/* Focus & Momentum Grid */}
              <div className="grid grid-cols-2 gap-3 mt-2">
                <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/5 border border-indigo-500/20 rounded-3xl p-5 flex flex-col gap-2 shadow-[inset_0_1px_2px_rgba(255,255,255,0.08)]">
                  <div className="flex items-center gap-2 text-indigo-300">
                    <Target className="w-4 h-4" />
                    <span className="text-[11px] font-mono uppercase tracking-widest">Focus Score</span>
                  </div>
                  <div className="text-3xl font-bold text-white tracking-tight">{focusScore}<span className="text-base text-indigo-300/50 font-normal">%</span></div>
                  <div className="text-xs text-white/50 leading-relaxed mt-1">Based on routine adherence and task velocity.</div>
                </div>
                
                <div className="bg-gradient-to-br from-orange-500/10 to-amber-500/5 border border-orange-500/20 rounded-3xl p-5 flex flex-col gap-2 shadow-[inset_0_1px_2px_rgba(255,255,255,0.08)]">
                  <div className="flex items-center gap-2 text-orange-300">
                    <Flame className="w-4 h-4" />
                    <span className="text-[11px] font-mono uppercase tracking-widest">Momentum</span>
                  </div>
                  <div className="text-3xl font-bold text-white tracking-tight">{momentum > 0 ? "+" : ""}{momentum}<span className="text-base text-orange-300/50 font-normal">%</span></div>
                  <div className="text-xs text-white/50 leading-relaxed mt-1">Consistency compared to your planned baseline.</div>
                </div>
              </div>
              
              {/* Metrics Grid */}
              <div className="mt-4 flex flex-col gap-3 pb-8">
                <h3 className="text-[11px] font-mono uppercase tracking-widest text-white/50 px-2">All Monitored Metrics</h3>
                {metrics.length === 0 ? (
                  <span className="text-xs text-white/40 italic px-2">No metrics tracked in this range.</span>
                ) : metrics.map((m) => (
                  <div key={m.metricId} className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 flex items-center justify-between group hover:bg-white/[0.05] transition-colors cursor-pointer shadow-[inset_0_1px_2px_rgba(255,255,255,0.05)]">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-medium text-white/90">{m.name}</span>
                      <span className="text-[10px] text-white/40">{m.values.length} entries in range</span>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-lg font-bold text-purple-200">{m.latestValue} <span className="text-xs font-normal opacity-50">{m.unit}</span></span>
                      <div className="w-16 h-4">
                        {m.values.length >= 2 ? <MetricSparkline values={m.values.map(v => v.value)} /> : null}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </motion.div>
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
