"use client";

import React, { useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Trash2, BookOpen, Activity } from "lucide-react";
import type { TimelineItem, Journal, EnrichedMetricEntry, Task, RoutineBlock } from "@/lib/db/types";
import { updateLocalTask } from "@/lib/local-db/tasks";
import { deleteLocalJournal } from "@/lib/local-db/journals";
import { deleteLocalEntry } from "@/lib/local-db/metrics";
import { cn } from "@/lib/utils";

const HOUR_HEIGHT = 88; // 88px per hour
const TOTAL_HOURS = 24;

export type OverlapMode = "columns" | "ghost_tracks";

interface DayCalendarPaneProps {
  items: TimelineItem[];
  selectedDate: Date;
  overlapMode?: OverlapMode;
  onRefresh: () => void;
}

interface PositionedItem {
  item: TimelineItem;
  top: number;
  height: number;
  colIndex: number;
  totalCols: number;
  isGhostPlan?: boolean;
}

export function DayCalendarPane({
  items,
  selectedDate,
  overlapMode = "columns",
  onRefresh,
}: DayCalendarPaneProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Selected day boundary range (00:00:00 to 23:59:59.999)
  const dayStart = useMemo(() => {
    const d = new Date(selectedDate);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }, [selectedDate]);

  const dayEnd = useMemo(() => {
    const d = new Date(selectedDate);
    d.setHours(23, 59, 59, 999);
    return d.getTime();
  }, [selectedDate]);

  const isToday = selectedDate.toDateString() === new Date().toDateString();

  // Filter & Clip items to day boundaries
  const { positionedBlocks, markerItems } = useMemo(() => {
    const rawBlocks: { item: TimelineItem; startMs: number; endMs: number }[] = [];
    const markers: TimelineItem[] = [];

    for (const item of items) {
      const itemStart = new Date(item.data.start_time).getTime();
      let itemEnd = "end_time" in item.data && item.data.end_time
        ? new Date(item.data.end_time).getTime()
        : itemStart + 30 * 60 * 1000;

      if (itemEnd < itemStart) itemEnd = itemStart + 30 * 60 * 1000;

      // Check if item overlaps today's window at all
      if (itemEnd >= dayStart && itemStart <= dayEnd) {
        if (item.type === "task" || item.type === "routine_block") {
          // Auto-clip to day boundaries
          const clippedStart = Math.max(itemStart, dayStart);
          const clippedEnd = Math.min(itemEnd, dayEnd);
          rawBlocks.push({ item, startMs: clippedStart, endMs: clippedEnd });
        } else {
          // Discrete markers
          if (itemStart >= dayStart && itemStart <= dayEnd) {
            markers.push(item);
          }
        }
      }
    }

    // Sort blocks by start time
    rawBlocks.sort((a, b) => a.startMs - b.startMs || (b.endMs - b.startMs) - (a.endMs - a.startMs));

    let positioned: PositionedItem[] = [];

    if (overlapMode === "columns") {
      // 1. Multi-Column Overlap Clustering
      const clusters: (typeof rawBlocks)[] = [];
      let currentCluster: typeof rawBlocks = [];
      let clusterEnd = 0;

      for (const block of rawBlocks) {
        if (currentCluster.length === 0) {
          currentCluster.push(block);
          clusterEnd = block.endMs;
        } else if (block.startMs < clusterEnd) {
          currentCluster.push(block);
          clusterEnd = Math.max(clusterEnd, block.endMs);
        } else {
          clusters.push(currentCluster);
          currentCluster = [block];
          clusterEnd = block.endMs;
        }
      }
      if (currentCluster.length > 0) clusters.push(currentCluster);

      for (const cluster of clusters) {
        // Assign columns within cluster
        const columns: (typeof rawBlocks)[] = [];

        for (const block of cluster) {
          let placed = false;
          for (let i = 0; i < columns.length; i++) {
            const lastInCol = columns[i][columns[i].length - 1];
            if (lastInCol.endMs <= block.startMs) {
              columns[i].push(block);
              placed = true;
              break;
            }
          }
          if (!placed) {
            columns.push([block]);
          }
        }

        const totalCols = columns.length;
        for (let colIdx = 0; colIdx < columns.length; colIdx++) {
          for (const block of columns[colIdx]) {
            const startMinsFromDay = (block.startMs - dayStart) / (1000 * 60);
            const durationMins = Math.max(25, (block.endMs - block.startMs) / (1000 * 60));

            positioned.push({
              item: block.item,
              top: (startMinsFromDay / 60) * HOUR_HEIGHT,
              height: Math.max(38, (durationMins / 60) * HOUR_HEIGHT - 4),
              colIndex: colIdx,
              totalCols,
              isGhostPlan: false,
            });
          }
        }
      }
    } else {
      // 2. Layered Ghost Tracks Mode
      // PLAN routine blocks sit in background layer (full width), tasks & ACTUAL blocks share columns
      const planBlocks = rawBlocks.filter(b => b.item.type === "routine_block" && b.item.data.type === "PLAN");
      const activeBlocks = rawBlocks.filter(b => !(b.item.type === "routine_block" && b.item.data.type === "PLAN"));

      // Position PLAN blocks as full-width ghost tracks
      for (const block of planBlocks) {
        const startMinsFromDay = (block.startMs - dayStart) / (1000 * 60);
        const durationMins = Math.max(30, (block.endMs - block.startMs) / (1000 * 60));
        positioned.push({
          item: block.item,
          top: (startMinsFromDay / 60) * HOUR_HEIGHT,
          height: Math.max(40, (durationMins / 60) * HOUR_HEIGHT - 4),
          colIndex: 0,
          totalCols: 1,
          isGhostPlan: true,
        });
      }

      // Position active blocks (tasks & ACTUAL) in columns on top
      const activeColumns: (typeof rawBlocks)[] = [];
      for (const block of activeBlocks) {
        let placed = false;
        for (let i = 0; i < activeColumns.length; i++) {
          const lastInCol = activeColumns[i][activeColumns[i].length - 1];
          if (lastInCol.endMs <= block.startMs) {
            activeColumns[i].push(block);
            placed = true;
            break;
          }
        }
        if (!placed) {
          activeColumns.push([block]);
        }
      }

      const totalCols = Math.max(1, activeColumns.length);
      for (let colIdx = 0; colIdx < activeColumns.length; colIdx++) {
        for (const block of activeColumns[colIdx]) {
          const startMinsFromDay = (block.startMs - dayStart) / (1000 * 60);
          const durationMins = Math.max(25, (block.endMs - block.startMs) / (1000 * 60));

          positioned.push({
            item: block.item,
            top: (startMinsFromDay / 60) * HOUR_HEIGHT,
            height: Math.max(38, (durationMins / 60) * HOUR_HEIGHT - 4),
            colIndex: colIdx,
            totalCols,
            isGhostPlan: false,
          });
        }
      }
    }

    return { positionedBlocks: positioned, markerItems: markers };
  }, [items, dayStart, dayEnd, overlapMode]);

  // Current time position indicator
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const currentPosition = (currentMinutes / 60) * HOUR_HEIGHT;

  // Auto-scroll so current time is centered on load (or 9 AM if viewing past/future day)
  useEffect(() => {
    if (containerRef.current) {
      const containerHeight = containerRef.current.clientHeight;
      const targetPos = isToday ? currentPosition : (9 * HOUR_HEIGHT);
      containerRef.current.scrollTop = Math.max(0, targetPos - containerHeight / 2);
    }
  }, [currentPosition, isToday, dayStart]);

  // Generate 24 hour slot markers
  const hours = useMemo(() => {
    return Array.from({ length: TOTAL_HOURS }, (_, i) => {
      const period = i >= 12 ? "PM" : "AM";
      const displayHour = i % 12 === 0 ? 12 : i % 12;
      return {
        hour: i,
        label: `${displayHour} ${period}`,
      };
    });
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-y-auto select-none rounded-[28px] border border-white/20 bg-white/[0.06] backdrop-blur-[40px] shadow-[0_30px_90px_rgba(0,0,0,0.8),inset_0_2px_4px_rgba(255,255,255,0.4),inset_0_-2px_4px_rgba(0,0,0,0.3)] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
    >
      <div className="relative w-full" style={{ height: `${TOTAL_HOURS * HOUR_HEIGHT}px` }}>
        {/* 24-Hour Specular Grid Lines & Time Rail */}
        {hours.map(({ hour, label }) => (
          <div
            key={hour}
            className="absolute left-0 right-0 flex items-start border-t border-white/[0.07]"
            style={{ top: `${hour * HOUR_HEIGHT}px`, height: `${HOUR_HEIGHT}px` }}
          >
            {/* Left Time Label Column with 2 Sub-rails for Journal & Metric */}
            <div className="w-24 pl-3.5 pt-2 flex items-center justify-between pr-2 shrink-0">
              <span className="text-[10px] font-mono tracking-widest uppercase text-white/35 font-medium">
                {label}
              </span>
              <div className="w-1 h-1 rounded-full bg-white/20" />
            </div>

            {/* Right Guideline Space */}
            <div className="flex-1 h-full border-l border-white/[0.07]" />
          </div>
        ))}

        {/* Non-overlapping Journal & Metric Markers in 2 distinct X-axis sub-rails */}
        {markerItems.map((item) => {
          const start = new Date(item.data.start_time).getTime();
          const startMins = Math.max(0, (start - dayStart) / (1000 * 60));
          const top = (startMins / 60) * HOUR_HEIGHT;

          let durationMins = 20;
          if ("end_time" in item.data && item.data.end_time) {
            const end = new Date(item.data.end_time).getTime();
            const diff = (end - start) / (1000 * 60);
            if (diff > 5) durationMins = diff;
          }
          const height = Math.max(24, (durationMins / 60) * HOUR_HEIGHT);

          return (
            <TimePaneMarker
              key={`${item.type}-${item.data.id}`}
              item={item}
              top={top}
              height={height}
              onRefresh={onRefresh}
            />
          );
        })}

        {/* Current Time Luminous Laser Line (Today only) */}
        {isToday && (
          <div
            className="absolute left-0 right-0 z-30 flex items-center pointer-events-none"
            style={{ top: `${currentPosition}px` }}
          >
            <div className="w-24 flex justify-end pr-2">
              <span className="w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,1),0_0_24px_rgba(255,255,255,0.8)] animate-pulse" />
            </div>
            <div className="flex-1 h-[1.5px] bg-gradient-to-r from-white via-white/80 to-transparent shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
          </div>
        )}

        {/* Dynamic Multi-Column / Layered Ghost Blocks Canvas */}
        <div className="absolute left-26 right-4 top-0 bottom-0 pointer-events-auto">
          {positionedBlocks.map((pos) => {
            return (
              <VisionOSCardBlock
                key={`${pos.item.type}-${pos.item.data.id}-${pos.colIndex}`}
                positioned={pos}
                onRefresh={onRefresh}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * Discrete Journal and Metric markers on the left time rail
 */
function TimePaneMarker({
  item,
  top,
  height,
  onRefresh,
}: {
  item: TimelineItem;
  top: number;
  height: number;
  onRefresh: () => void;
}) {
  const [showTooltip, setShowTooltip] = React.useState(false);

  if (item.type === "journal") {
    const journal = item.data as Journal;
    const handleDelete = async (e: React.MouseEvent) => {
      e.stopPropagation();
      await deleteLocalJournal(journal.id);
      onRefresh();
    };

    return (
      <div
        className="absolute left-[54px] z-20 flex flex-col items-center"
        style={{ top: `${top}px`, height: `${height}px` }}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={() => setShowTooltip(!showTooltip)}
      >
        <div
          className="w-4.5 rounded-full bg-emerald-400/20 border border-emerald-300/60 shadow-[0_0_12px_rgba(52,211,153,0.5),inset_0_1px_2px_rgba(255,255,255,0.7)] flex items-center justify-center cursor-pointer transition-transform hover:scale-115"
          style={{ height: `${height}px`, minHeight: "22px" }}
        >
          <BookOpen className="w-2.5 h-2.5 text-emerald-300 drop-shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
        </div>

        <AnimatePresence>
          {showTooltip && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, x: 10 }}
              animate={{ opacity: 1, scale: 1, x: 15 }}
              exit={{ opacity: 0, scale: 0.9, x: 10 }}
              className="absolute left-full top-0 z-40 w-56 p-3 rounded-2xl bg-black/85 backdrop-blur-[32px] border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.8),inset_0_1px_1.5px_rgba(255,255,255,0.4)] flex flex-col gap-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-mono uppercase tracking-wider text-emerald-300/80">
                  Journal Reflection
                </span>
                <button onClick={handleDelete} className="text-white/40 hover:text-red-400 p-0.5 cursor-pointer">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
              <p className="text-xs text-white/90 leading-relaxed line-clamp-3">
                {journal.content}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  if (item.type === "metric_entry") {
    const entry = item.data as EnrichedMetricEntry;
    const handleDelete = async (e: React.MouseEvent) => {
      e.stopPropagation();
      await deleteLocalEntry(entry.id);
      onRefresh();
    };

    return (
      <div
        className="absolute left-[74px] z-20 flex flex-col items-center"
        style={{ top: `${top}px`, height: `${height}px` }}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={() => setShowTooltip(!showTooltip)}
      >
        <div
          className="w-4.5 rounded-full bg-purple-400/20 border border-purple-300/60 shadow-[0_0_12px_rgba(192,132,252,0.5),inset_0_1px_2px_rgba(255,255,255,0.7)] flex items-center justify-center cursor-pointer transition-transform hover:scale-115"
          style={{ height: `${height}px`, minHeight: "22px" }}
        >
          <Activity className="w-2.5 h-2.5 text-purple-300 drop-shadow-[0_0_6px_rgba(192,132,252,0.8)]" />
        </div>

        <AnimatePresence>
          {showTooltip && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, x: 10 }}
              animate={{ opacity: 1, scale: 1, x: 15 }}
              exit={{ opacity: 0, scale: 0.9, x: 10 }}
              className="absolute left-full top-0 z-40 w-48 p-2.5 rounded-2xl bg-black/85 backdrop-blur-[32px] border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.8),inset_0_1px_1.5px_rgba(255,255,255,0.4)] flex items-center justify-between gap-2"
            >
              <div className="flex flex-col">
                <span className="text-[9px] font-mono uppercase tracking-wider text-purple-300/80">
                  {entry.definition.name}
                </span>
                <span className="text-sm font-bold text-white">
                  +{entry.value} {entry.definition.unit || ""}
                </span>
              </div>
              <button onClick={handleDelete} className="text-white/40 hover:text-red-400 p-1 cursor-pointer">
                <Trash2 className="w-3 h-3" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return null;
}

/**
 * VisionOS Card Block with Multi-Column Positioning and Ghost Plan support
 */
function VisionOSCardBlock({
  positioned,
  onRefresh,
}: {
  positioned: PositionedItem;
  onRefresh: () => void;
}) {
  const { item, top, height, colIndex, totalCols, isGhostPlan } = positioned;

  // Dynamic Column Width Calculation
  const widthPercent = 100 / totalCols;
  const leftPercent = colIndex * widthPercent;

  if (item.type === "task") {
    const task = item.data as Task;
    const isCompleted = task.completed_at !== null;

    const handleToggle = async (e: React.MouseEvent) => {
      e.stopPropagation();
      await updateLocalTask(task.id, {
        completed_at: isCompleted ? null : new Date().toISOString(),
      });
      onRefresh();
    };

    return (
      <div
        className={cn(
          "absolute rounded-2xl p-2.5 flex items-start justify-between gap-2 border transition-all duration-300 group select-none overflow-hidden",
          isCompleted
            ? "bg-white/[0.03] border-white/10 text-white/35 opacity-50 z-10"
            : "bg-white/[0.09] backdrop-blur-[32px] border-white/25 text-white/95 shadow-[0_16px_40px_rgba(0,0,0,0.5),inset_0_1px_2px_rgba(255,255,255,0.45),inset_0_-1px_1.5px_rgba(0,0,0,0.3)] hover:border-white/45 hover:bg-white/[0.14] z-20"
        )}
        style={{
          top: `${top}px`,
          height: `${height}px`,
          left: `calc(${leftPercent}% + 4px)`,
          width: `calc(${widthPercent}% - 8px)`,
        }}
      >
        <div className="flex items-start gap-2 min-w-0 pt-0.5">
          <button
            onClick={handleToggle}
            className={cn(
              "w-4 h-4 rounded-full flex items-center justify-center transition-all shrink-0 border cursor-pointer mt-0.5",
              isCompleted
                ? "bg-white text-black border-white shadow-[0_0_10px_rgba(255,255,255,0.8)]"
                : "bg-white/5 border-white/30 hover:border-white/60 text-transparent"
            )}
          >
            <Check className="w-2.5 h-2.5 stroke-[3]" />
          </button>
          <span className={cn("text-xs font-semibold tracking-wide leading-tight truncate", isCompleted && "line-through")}>
            {task.label}
          </span>
        </div>
      </div>
    );
  }

  if (item.type === "routine_block") {
    const block = item.data as RoutineBlock;
    const isPlan = block.type === "PLAN";

    if (isGhostPlan) {
      // Layered Ghost Plan Background Track
      return (
        <div
          className="absolute rounded-2xl p-2.5 flex items-start justify-between gap-2 border border-dashed border-amber-300/20 bg-amber-400/[0.04] text-amber-200/60 select-none overflow-hidden z-0 pointer-events-none"
          style={{
            top: `${top}px`,
            height: `${height}px`,
            left: "4px",
            width: "calc(100% - 8px)",
          }}
        >
          <div className="flex items-start gap-2 min-w-0 pt-0.5">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400/50 mt-1 shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-medium tracking-wide truncate">
                {block.label} (Plan)
              </span>
              <span className="text-[9px] font-mono uppercase tracking-wider opacity-40">
                {block.category}
              </span>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div
        className={cn(
          "absolute rounded-2xl p-2.5 flex items-start justify-between gap-2 border transition-all duration-300 group select-none backdrop-blur-[32px] overflow-hidden z-20",
          isPlan
            ? "bg-amber-400/[0.08] border-amber-300/30 text-amber-100 shadow-[0_16px_40px_rgba(0,0,0,0.5),inset_0_1px_2px_rgba(251,191,36,0.3)] hover:border-amber-300/50 hover:bg-amber-400/[0.12]"
            : "bg-emerald-400/[0.08] border-emerald-300/30 text-emerald-100 shadow-[0_16px_40px_rgba(0,0,0,0.5),inset_0_1px_2px_rgba(52,211,153,0.3)] hover:border-emerald-300/50 hover:bg-emerald-400/[0.12]"
        )}
        style={{
          top: `${top}px`,
          height: `${height}px`,
          left: `calc(${leftPercent}% + 4px)`,
          width: `calc(${widthPercent}% - 8px)`,
        }}
      >
        <div className="flex items-start gap-2 min-w-0 pt-0.5">
          <div
            className={cn(
              "w-2 h-2 rounded-full shrink-0 mt-1 shadow-[0_0_8px_currentColor]",
              isPlan ? "bg-amber-300 text-amber-300" : "bg-emerald-300 text-emerald-300"
            )}
          />
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-semibold tracking-wide leading-tight truncate">
              {block.label}
            </span>
            <span className="text-[9px] font-mono uppercase tracking-wider opacity-60 mt-0.5">
              {block.category}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
