"use client";

import React, { useEffect, useRef, useMemo, useState, useCallback, memo } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Check, BookOpen, Activity, X } from "lucide-react";
import type { TimelineItem, Journal, EnrichedMetricEntry, Task, RoutineBlock } from "@/lib/db/types";
import type { DaySegment } from "@/lib/hooks/use-continuous-timeline";
import { updateLocalTask } from "@/lib/local-db/tasks";
import { createLocalRoutineBlock } from "@/lib/local-db/routine-blocks";
import { logLocalEntry } from "@/lib/local-db/metrics";
import { cn, toTitleCase } from "@/lib/utils";

const HOUR_HEIGHT = 84; // 84px per hour
const DAY_HEIGHT = 24 * HOUR_HEIGHT; // 2016px per day segment

interface ContinuousCalendarPaneProps {
  daySegments: DaySegment[];
  isFetchingEarlier: boolean;
  isFetchingFuture: boolean;
  onLoadEarlierDays: () => void;
  onLoadFutureDays: () => void;
  onEditItem: (item: TimelineItem) => void;
  onRefresh: () => void;
}

interface PositionedItem {
  item: TimelineItem;
  top: number;
  height: number;
  colIndex: number;
  totalCols: number;
}

interface PositionedMarker {
  item: TimelineItem;
  top: number;
  height: number;
  subCol: number;
  type: "journal" | "metric_entry";
}

interface ActiveTooltipState {
  item: TimelineItem;
  clickX: number;
  clickY: number;
}

export function ContinuousCalendarPane({
  daySegments,
  isFetchingEarlier,
  isFetchingFuture,
  onLoadEarlierDays,
  onLoadFutureDays,
  onEditItem,
  onRefresh,
}: ContinuousCalendarPaneProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isInitialScrollDone = useRef(false);

  // Active Tooltip & Focused Expanded Item state
  const [activeTooltip, setActiveTooltip] = useState<ActiveTooltipState | null>(null);
  const [focusedItemId, setFocusedItemId] = useState<string | null>(null);

  // Auto-scroll to Current Time on initial mount
  useEffect(() => {
    if (scrollRef.current && !isInitialScrollDone.current && daySegments.length > 0) {
      const todayIndex = daySegments.findIndex((s) => s.isToday);
      if (todayIndex !== -1) {
        const now = new Date();
        const currentMins = now.getHours() * 60 + now.getMinutes();
        const todayTop = todayIndex * DAY_HEIGHT;
        const currentPos = todayTop + (currentMins / 60) * HOUR_HEIGHT;

        const containerHeight = scrollRef.current.clientHeight;
        scrollRef.current.scrollTop = Math.max(0, currentPos - containerHeight / 2);
        isInitialScrollDone.current = true;
      }
    }
  }, [daySegments]);

  const isScrolling = useRef(false);

  // Seamless Bidirectional Infinite Scroll Detection with rAF Throttling
  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;

    if (activeTooltip) {
      setActiveTooltip(null);
      setFocusedItemId(null);
    }

    if (isScrolling.current) return;
    isScrolling.current = true;

    requestAnimationFrame(() => {
      isScrolling.current = false;
      if (!scrollRef.current) return;

      const scrollTop = scrollRef.current.scrollTop;
      const scrollHeight = scrollRef.current.scrollHeight;
      const clientHeight = scrollRef.current.clientHeight;

      // Scroll UP -> Load earlier past days
      if (scrollTop < 400 && !isFetchingEarlier) {
        const prevScrollHeight = scrollRef.current.scrollHeight;
        onLoadEarlierDays();

        requestAnimationFrame(() => {
          if (scrollRef.current) {
            const newScrollHeight = scrollRef.current.scrollHeight;
            const diff = newScrollHeight - prevScrollHeight;
            if (diff > 0) {
              scrollRef.current.scrollTop = scrollTop + diff;
            }
          }
        });
      }

      // Scroll DOWN -> Load future days
      if (scrollHeight - (scrollTop + clientHeight) < 400 && !isFetchingFuture) {
        onLoadFutureDays();
      }
    });
  }, [isFetchingEarlier, isFetchingFuture, onLoadEarlierDays, onLoadFutureDays, activeTooltip]);

  const handleOpenTooltip = useCallback((item: TimelineItem, e: React.MouseEvent) => {
    setFocusedItemId(item.data.id);
    setActiveTooltip({
      item,
      clickX: e.clientX,
      clickY: e.clientY,
    });
  }, []);

  const handleCloseTooltip = () => {
    setActiveTooltip(null);
    setFocusedItemId(null);
  };

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      className="relative w-full h-full overflow-y-auto select-none rounded-[28px] border border-white/20 bg-white/[0.06] backdrop-blur-md shadow-[0_20px_50px_rgba(0,0,0,0.7),inset_0_2px_4px_rgba(255,255,255,0.4),inset_0_-2px_4px_rgba(0,0,0,0.3)] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
    >
      {/* Continuous Day Segments Stack */}
      <div className="relative w-full">
        {daySegments.map((segment) => (
          <DaySection
            key={segment.dayOffset}
            segment={segment}
            focusedItemId={focusedItemId}
            onOpenTooltip={handleOpenTooltip}
            onRefresh={onRefresh}
          />
        ))}
      </div>

      {/* Global High-Z-Index Action Tooltip (Beside Click Point) */}
      <AnimatePresence>
        {activeTooltip && (
          <TimelineActionTooltip
            activeTooltip={activeTooltip}
            onClose={handleCloseTooltip}
            onEdit={(item) => {
              handleCloseTooltip();
              onEditItem(item);
            }}
            onRefresh={onRefresh}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Individual 24-Hour Day Section with Dynamic Cascade Overlap & Responsive Time Rail
 */
const DaySection = memo(function DaySection({
  segment,
  focusedItemId,
  onOpenTooltip,
  onRefresh,
}: {
  segment: DaySegment;
  focusedItemId: string | null;
  onOpenTooltip: (item: TimelineItem, e: React.MouseEvent) => void;
  onRefresh: () => void;
}) {
  const { dayStartMs, dayEndMs, items, isToday, dateKey } = segment;

  const { positionedBlocks, positionedMarkers } = useMemo(() => {
    const rawBlocks: { item: TimelineItem; startMs: number; endMs: number }[] = [];
    const rawJournals: { item: TimelineItem; startMs: number; endMs: number }[] = [];
    const rawMetrics: { item: TimelineItem; startMs: number; endMs: number }[] = [];

    for (const item of items) {
      const itemStart = new Date(item.data.start_time).getTime();
      let itemEnd = "end_time" in item.data && item.data.end_time
        ? new Date(item.data.end_time).getTime()
        : itemStart + 30 * 60 * 1000;

      if (itemEnd < itemStart) itemEnd = itemStart + 30 * 60 * 1000;

      if (itemEnd >= dayStartMs && itemStart <= dayEndMs) {
        const clippedStart = Math.max(itemStart, dayStartMs);
        const clippedEnd = Math.min(itemEnd, dayEndMs);

        if (item.type === "task" || item.type === "routine_block") {
          rawBlocks.push({ item, startMs: clippedStart, endMs: clippedEnd });
        } else if (item.type === "journal") {
          rawJournals.push({ item, startMs: clippedStart, endMs: clippedEnd });
        } else if (item.type === "metric_entry") {
          rawMetrics.push({ item, startMs: clippedStart, endMs: clippedEnd });
        }
      }
    }

    rawBlocks.sort((a, b) => a.startMs - b.startMs || (b.endMs - b.startMs) - (a.endMs - a.startMs));
    let positioned: PositionedItem[] = [];

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
        if (!placed) columns.push([block]);
      }

      const totalCols = columns.length;
      for (let colIdx = 0; colIdx < columns.length; colIdx++) {
        for (const block of columns[colIdx]) {
          const startMinsFromDay = (block.startMs - dayStartMs) / (1000 * 60);
          const durationMins = Math.max(25, (block.endMs - block.startMs) / (1000 * 60));

          positioned.push({
            item: block.item,
            top: (startMinsFromDay / 60) * HOUR_HEIGHT,
            height: Math.max(38, (durationMins / 60) * HOUR_HEIGHT - 4),
            colIndex: colIdx,
            totalCols,
          });
        }
      }
    }

    const markers: PositionedMarker[] = [];

    // Journals
    rawJournals.sort((a, b) => a.startMs - b.startMs);
    for (let i = 0; i < rawJournals.length; i++) {
      const cur = rawJournals[i];
      const prev = rawJournals[i - 1];
      const isOverlapping = prev && cur.startMs < prev.endMs;
      const startMins = Math.max(0, (cur.startMs - dayStartMs) / (1000 * 60));
      const durationMins = Math.max(20, (cur.endMs - cur.startMs) / (1000 * 60));

      markers.push({
        item: cur.item,
        top: (startMins / 60) * HOUR_HEIGHT,
        height: Math.max(24, (durationMins / 60) * HOUR_HEIGHT),
        subCol: isOverlapping ? 1 : 0,
        type: "journal",
      });
    }

    // Metrics
    rawMetrics.sort((a, b) => a.startMs - b.startMs);
    for (let i = 0; i < rawMetrics.length; i++) {
      const cur = rawMetrics[i];
      const prev = rawMetrics[i - 1];
      const isOverlapping = prev && cur.startMs < prev.endMs;
      const startMins = Math.max(0, (cur.startMs - dayStartMs) / (1000 * 60));
      const durationMins = Math.max(20, (cur.endMs - cur.startMs) / (1000 * 60));

      markers.push({
        item: cur.item,
        top: (startMins / 60) * HOUR_HEIGHT,
        height: Math.max(24, (durationMins / 60) * HOUR_HEIGHT),
        subCol: isOverlapping ? 1 : 0,
        type: "metric_entry",
      });
    }

    return { positionedBlocks: positioned, positionedMarkers: markers };
  }, [items, dayStartMs, dayEndMs]);

  const hours = useMemo(() => {
    return Array.from({ length: 24 }, (_, i) => {
      const period = i >= 12 ? "PM" : "AM";
      const shortPeriod = i >= 12 ? "P" : "A";
      const displayHour = i % 12 === 0 ? 12 : i % 12;
      return { hour: i, label: `${displayHour} ${period}`, shortLabel: `${displayHour}${shortPeriod}` };
    });
  }, []);

  return (
    <div
      className="relative w-full border-b border-white/10"
      style={{
        height: `${DAY_HEIGHT}px`,
        contentVisibility: "auto",
        containIntrinsicSize: `0 ${DAY_HEIGHT}px`,
      }}
    >
      {/* Sticky Day Header */}
      <div className="sticky top-2 z-30 flex items-center justify-between px-3 md:px-4 pointer-events-none">
        <div className="px-2.5 md:px-3 py-1 rounded-full bg-black/70 backdrop-blur-[24px] border border-white/20 shadow-[0_8px_20px_rgba(0,0,0,0.6)] flex items-center gap-1.5 md:gap-2">
          <span className="text-[10px] md:text-[11px] font-semibold text-white tracking-wide">
            {dateKey}
          </span>
          {isToday && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          )}
        </div>
      </div>

      {/* Hour Grid Lines (Responsive 56px on mobile, 112px on desktop) */}
      {hours.map(({ hour, label, shortLabel }) => (
        <div
          key={hour}
          className="absolute left-0 right-0 flex items-start border-t border-white/[0.06]"
          style={{ top: `${hour * HOUR_HEIGHT}px`, height: `${HOUR_HEIGHT}px` }}
        >
          <div className="w-14 md:w-28 pl-2 md:pl-3 pt-2 flex items-center justify-between pr-1.5 md:pr-2 shrink-0">
            <span className="text-[9px] md:text-[10px] font-mono tracking-wider md:tracking-widest uppercase text-white/35 font-medium">
              <span className="md:hidden">{shortLabel}</span>
              <span className="hidden md:inline">{label}</span>
            </span>
            <div className="w-1 h-1 rounded-full bg-white/20" />
          </div>
          <div className="flex-1 h-full border-l border-white/[0.06]" />
        </div>
      ))}

      {/* Discrete Journal & Metric Markers on Responsive Time Rail */}
      {positionedMarkers.map((pos) => {
        const isJournal = pos.type === "journal";
        // Responsive left positioning inside gutter
        const leftMobilePx = isJournal ? (pos.subCol === 0 ? 24 : 32) : (pos.subCol === 0 ? 40 : 48);
        const leftDesktopPx = isJournal ? (pos.subCol === 0 ? 48 : 64) : (pos.subCol === 0 ? 82 : 98);

        return (
          <motion.div
            key={`${pos.item.type}-${pos.item.data.id}-${pos.subCol}`}
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.95 }}
            className="absolute z-20 flex flex-col items-center cursor-pointer group"
            style={{
              top: `${pos.top}px`,
              height: `${pos.height}px`,
              left: `var(--marker-left, ${leftMobilePx}px)`
            }}
            onClick={(e) => {
              e.stopPropagation();
              onOpenTooltip(pos.item, e);
            }}
          >
            {/* Desktop CSS Variable Override */}
            <style jsx>{`
              @media (min-width: 768px) {
                div {
                  --marker-left: ${leftDesktopPx}px;
                }
              }
            `}</style>
            {isJournal ? (
              <div
                className="w-4 md:w-4.5 rounded-full bg-emerald-400/20 border border-emerald-300/60 shadow-[0_0_12px_rgba(52,211,153,0.5),inset_0_1px_2px_rgba(255,255,255,0.7)] flex items-center justify-center transition-all hover:border-emerald-300"
                style={{ height: `${pos.height}px`, minHeight: "20px" }}
              >
                <BookOpen className="w-2 md:w-2.5 h-2 md:h-2.5 text-emerald-300 drop-shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
              </div>
            ) : (
              <div
                className="w-4 md:w-4.5 rounded-full bg-purple-400/20 border border-purple-300/60 shadow-[0_0_12px_rgba(192,132,252,0.5),inset_0_1px_2px_rgba(255,255,255,0.7)] flex items-center justify-center transition-all hover:border-purple-300"
                style={{ height: `${pos.height}px`, minHeight: "20px" }}
              >
                <Activity className="w-2 md:w-2.5 h-2 md:h-2.5 text-purple-300 drop-shadow-[0_0_6px_rgba(192,132,252,0.8)]" />
              </div>
            )}
          </motion.div>
        );
      })}

      {/* Luminous Current Time Line on Today (Client-Side Real-Time Mount) */}
      <CurrentTimeIndicator isToday={isToday} />

      {/* Main Blocks Layer (Tasks & Routines) - Gutter offset: 58px on mobile, 114px on desktop */}
      <div className="absolute left-15 md:left-30 right-2 md:right-4 top-0 bottom-0 pointer-events-auto">
        {positionedBlocks.map((pos) => (
          <VisionOSCardBlock
            key={`${pos.item.type}-${pos.item.data.id}-${pos.colIndex}`}
            positioned={pos}
            isFocused={focusedItemId === pos.item.data.id}
            onOpenTooltip={(e) => onOpenTooltip(pos.item, e)}
            onRefresh={onRefresh}
          />
        ))}
      </div>
    </div>
  );
});

/**
 * Ultra-Premium VisionOS Card Block with Dynamic Cascade Overlap & Tap-to-Elevate
 */
const VisionOSCardBlock = memo(function VisionOSCardBlock({
  positioned,
  isFocused,
  onOpenTooltip,
  onRefresh,
}: {
  positioned: PositionedItem;
  isFocused: boolean;
  onOpenTooltip: (e: React.MouseEvent) => void;
  onRefresh: () => void;
}) {
  const { item, top, height, colIndex, totalCols } = positioned;

  // Dynamic Cascade Overlap geometry
  // Cards take 88% width, stepped by 24px per overlapping index
  const cascadeOffsetPx = colIndex * 24;
  const isMultiCol = totalCols > 1;

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
      <motion.div
        transition={{ type: "spring", stiffness: 450, damping: 30 }}
        whileHover={{ scale: 1.01, filter: "brightness(1.1)" }}
        whileTap={{ scale: 0.985 }}
        onClick={(e) => {
          e.stopPropagation();
          onOpenTooltip(e);
        }}
        className={cn(
          "absolute rounded-2xl p-2.5 flex flex-col justify-start items-start border transition-all duration-300 group select-none backdrop-blur-md overflow-hidden cursor-pointer",
          isCompleted
            ? "bg-gradient-to-br from-emerald-500/[0.14] via-emerald-600/[0.06] to-emerald-700/[0.02] border-emerald-400/30 text-emerald-100 shadow-[0_15px_40px_rgba(0,0,0,0.45),inset_0_1.5px_2px_rgba(52,211,153,0.35)]"
            : "bg-gradient-to-br from-indigo-500/[0.18] via-blue-600/[0.08] to-purple-600/[0.03] border-indigo-400/35 text-indigo-100 shadow-[0_15px_40px_rgba(0,0,0,0.55),inset_0_1.5px_2px_rgba(165,180,252,0.4)] hover:border-indigo-300/60",
          isFocused && "z-40 ring-1 ring-white/60 shadow-[0_25px_60px_rgba(0,0,0,0.85),inset_0_2px_4px_rgba(255,255,255,0.6)]"
        )}
        style={{
          top: `${top}px`,
          height: `${height}px`,
          left: isFocused ? "2px" : isMultiCol ? `${cascadeOffsetPx}px` : "2px",
          width: isFocused ? "calc(100% - 4px)" : isMultiCol ? "calc(88% - 4px)" : "calc(100% - 4px)",
          zIndex: isFocused ? 40 : 10 + colIndex,
        }}
      >
        {/* Top-Aligned Content with Checkbox */}
        <div className="flex items-start gap-2 min-w-0 w-full">
          <button
            onClick={handleToggle}
            className={cn(
              "w-4 h-4 rounded-full flex items-center justify-center transition-all shrink-0 border cursor-pointer mt-0.5",
              isCompleted
                ? "bg-emerald-400 text-black border-emerald-300 shadow-[0_0_10px_rgba(52,211,153,0.8)]"
                : "bg-indigo-400/10 border-indigo-300/50 hover:border-indigo-300 text-transparent hover:bg-indigo-400/20"
            )}
          >
            <Check className="w-2.5 h-2.5 stroke-[3]" />
          </button>
          <div className="flex flex-col min-w-0 flex-1">
            <span className={cn("text-[13px] font-semibold tracking-wide truncate leading-tight", isCompleted ? "line-through text-emerald-200/80" : "text-indigo-50")}>
              {task.label}
            </span>
            <span className="text-[9px] font-mono uppercase tracking-wider opacity-60 mt-0.5">
              {isCompleted ? "Completed Task" : "Active Task"}
            </span>
          </div>
        </div>
      </motion.div>
    );
  }

  if (item.type === "routine_block") {
    const block = item.data as RoutineBlock;
    const isPlan = block.type === "PLAN";

    return (
      <motion.div
        transition={{ type: "spring", stiffness: 450, damping: 30 }}
        whileHover={{ scale: 1.01, filter: "brightness(1.1)" }}
        whileTap={{ scale: 0.985 }}
        onClick={(e) => {
          e.stopPropagation();
          onOpenTooltip(e);
        }}
        className={cn(
          "absolute rounded-2xl p-2.5 flex flex-col justify-start items-start border transition-all duration-300 group select-none backdrop-blur-md overflow-hidden cursor-pointer",
          isPlan
            ? "bg-gradient-to-br from-amber-400/[0.16] via-amber-500/[0.08] to-amber-500/[0.03] border-amber-300/35 text-amber-100 shadow-[0_15px_40px_rgba(0,0,0,0.55),inset_0_1.5px_2px_rgba(251,191,36,0.4)] hover:border-amber-300/60"
            : "bg-gradient-to-br from-emerald-400/[0.16] via-emerald-500/[0.08] to-emerald-500/[0.03] border-emerald-300/35 text-emerald-100 shadow-[0_15px_40px_rgba(0,0,0,0.55),inset_0_1.5px_2px_rgba(52,211,153,0.4)] hover:border-emerald-300/60",
          isFocused && "z-40 ring-1 ring-white/60 shadow-[0_25px_60px_rgba(0,0,0,0.85),inset_0_2px_4px_rgba(255,255,255,0.6)]"
        )}
        style={{
          top: `${top}px`,
          height: `${height}px`,
          left: isFocused ? "2px" : isMultiCol ? `${cascadeOffsetPx}px` : "2px",
          width: isFocused ? "calc(100% - 4px)" : isMultiCol ? "calc(88% - 4px)" : "calc(100% - 4px)",
          zIndex: isFocused ? 40 : 10 + colIndex,
        }}
      >
        {/* Top-Aligned Content */}
        <div className="flex items-start gap-2 min-w-0 w-full">
          <div
            className={cn(
              "w-2 h-2 rounded-full shrink-0 mt-1 shadow-[0_0_8px_currentColor]",
              isPlan ? "bg-amber-300 text-amber-300" : "bg-emerald-300 text-emerald-300"
            )}
          />
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-[13px] font-semibold tracking-wide truncate leading-tight">
              {block.label}
            </span>
            <span className="text-[9px] font-mono uppercase tracking-wider opacity-60 mt-0.5">
              {block.category} • {isPlan ? "Plan" : "Actual"}
            </span>
          </div>
        </div>
      </motion.div>
    );
  }

  return null;
}, (prevProps, nextProps) => {
  return (
    prevProps.isFocused === nextProps.isFocused &&
    prevProps.positioned.item.data.id === nextProps.positioned.item.data.id &&
    prevProps.positioned.item.type === nextProps.positioned.item.type
  );
});

/**
 * Unified VisionOS Quick Action Tooltip with Clean Suggestions
 */
function TimelineActionTooltip({
  activeTooltip,
  onClose,
  onEdit,
  onRefresh,
}: {
  activeTooltip: ActiveTooltipState;
  onClose: () => void;
  onEdit: (item: TimelineItem) => void;
  onRefresh: () => void;
}) {
  const { item, clickX, clickY } = activeTooltip;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || typeof document === "undefined") return null;

  // Position exactly beside where user clicked
  const tooltipWidth = 260;
  const left = Math.min(window.innerWidth - tooltipWidth - 16, Math.max(16, clickX + 14));
  const top = Math.max(16, Math.min(window.innerHeight - 230, clickY - 40));

  // Quick Action Handlers
  const handleExtendTask = async (mins: number) => {
    if (item.type !== "task") return;
    const task = item.data as Task;
    const currentEnd = task.end_time ? new Date(task.end_time).getTime() : new Date(task.start_time).getTime() + 45 * 60 * 1000;
    const newEnd = new Date(currentEnd + mins * 60 * 1000).toISOString();
    await updateLocalTask(task.id, { end_time: newEnd });
    onRefresh();
    onClose();
  };

  const handleDuplicateRoutine = async () => {
    if (item.type !== "routine_block") return;
    const block = item.data as RoutineBlock;
    const startMs = new Date(block.start_time).getTime();
    const endMs = new Date(block.end_time).getTime();
    const duration = endMs - startMs;
    const newStart = new Date(endMs + 15 * 60 * 1000).toISOString();
    const newEnd = new Date(endMs + 15 * 60 * 1000 + duration).toISOString();

    await createLocalRoutineBlock({
      user_id: block.user_id,
      label: `${block.label} (Copy)`,
      category: block.category,
      type: block.type,
      start_time: newStart,
      end_time: newEnd,
    });
    onRefresh();
    onClose();
  };

  const handleQuickLogMetric = async (delta: number) => {
    if (item.type !== "metric_entry") return;
    const entry = item.data as EnrichedMetricEntry;
    const nowIso = new Date().toISOString();
    await logLocalEntry(entry.user_id, entry.metric_id, entry.value + delta, nowIso, nowIso);
    onRefresh();
    onClose();
  };

  const getDetails = () => {
    if (item.type === "task") {
      const task = item.data as Task;
      return {
        badge: "Task",
        badgeColor: "text-blue-200 bg-blue-500/20 border-blue-400/40",
        title: task.label,
        subtitle: task.completed_at ? "Completed" : "In Progress",
      };
    }
    if (item.type === "routine_block") {
      const block = item.data as RoutineBlock;
      return {
        badge: block.type === "PLAN" ? "Planned Routine" : "Actual Routine",
        badgeColor: block.type === "PLAN" ? "text-amber-200 bg-amber-500/20 border-amber-400/40" : "text-emerald-200 bg-emerald-500/20 border-emerald-400/40",
        title: block.label,
        subtitle: block.category,
      };
    }
    if (item.type === "metric_entry") {
      const entry = item.data as EnrichedMetricEntry;
      return {
        badge: "Metric",
        badgeColor: "text-purple-200 bg-purple-500/20 border-purple-400/40",
        title: `+${entry.value} ${entry.definition.unit || ""}`,
        subtitle: toTitleCase(entry.definition.name),
      };
    }
    if (item.type === "journal") {
      const journal = item.data as Journal;
      return {
        badge: "Journal",
        badgeColor: "text-emerald-200 bg-emerald-500/20 border-emerald-400/40",
        title: journal.content,
        subtitle: "Reflection",
      };
    }
    return { badge: "Item", badgeColor: "", title: "", subtitle: "" };
  };

  const details = getDetails();

  return createPortal(
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 99999 }}>
      {/* Click-outside dismiss backdrop */}
      <div className="fixed inset-0 pointer-events-auto" onClick={onClose} />

      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: -2 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: -2 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        style={{
          position: "fixed",
          left: `${left}px`,
          top: `${top}px`,
          width: `${tooltipWidth}px`,
        }}
        className="p-3.5 rounded-[26px] bg-white/[0.08] backdrop-blur-[50px] saturate-[210%] border border-white/25 shadow-[0_35px_90px_rgba(0,0,0,0.85),0_0_30px_rgba(255,255,255,0.1),inset_0_2px_4px_rgba(255,255,255,0.5),inset_0_-2px_4px_rgba(0,0,0,0.35)] flex flex-col gap-2.5 pointer-events-auto text-white"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <span className={cn("px-2 py-0.5 rounded-lg text-[9px] font-mono uppercase tracking-wider font-semibold border", details.badgeColor)}>
            {details.badge}
          </span>
          <button
            onClick={onClose}
            className="w-5 h-5 rounded-full flex items-center justify-center text-white/40 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Content Preview */}
        <div className="flex flex-col gap-0.5">
          <p className="text-xs font-semibold text-white/95 leading-snug line-clamp-3">
            {details.title}
          </p>
          <span className="text-[10px] font-mono text-white/45 uppercase tracking-wider">
            {details.subtitle}
          </span>
        </div>

        {/* Clean VisionOS Interaction Suggestions */}
        <div className="flex flex-col gap-1 pt-1.5 border-t border-white/10">
          <span className="text-[9px] font-mono text-white/35 uppercase tracking-widest">
            Suggestions
          </span>
          <div className="flex flex-wrap gap-1.5">
            {item.type === "task" && (
              <>
                <button
                  onClick={() => handleExtendTask(30)}
                  className="px-2.5 py-1 rounded-xl text-[10px] font-mono font-medium bg-white/[0.06] hover:bg-white/15 border border-white/15 text-white/75 hover:text-white transition-all cursor-pointer active:scale-95"
                >
                  +30m
                </button>
                <button
                  onClick={() => handleExtendTask(60)}
                  className="px-2.5 py-1 rounded-xl text-[10px] font-mono font-medium bg-white/[0.06] hover:bg-white/15 border border-white/15 text-white/75 hover:text-white transition-all cursor-pointer active:scale-95"
                >
                  +1h
                </button>
              </>
            )}

            {item.type === "routine_block" && (
              <button
                onClick={handleDuplicateRoutine}
                className="px-2.5 py-1 rounded-xl text-[10px] font-mono font-medium bg-white/[0.06] hover:bg-white/15 border border-white/15 text-white/75 hover:text-white transition-all cursor-pointer active:scale-95"
              >
                Duplicate
              </button>
            )}

            {item.type === "metric_entry" && (
              <button
                onClick={() => handleQuickLogMetric(1)}
                className="px-2.5 py-1 rounded-xl text-[10px] font-mono font-medium bg-white/[0.06] hover:bg-white/15 border border-white/15 text-white/75 hover:text-white transition-all cursor-pointer active:scale-95"
              >
                Log +1
              </button>
            )}
          </div>
        </div>

        {/* Edit Button */}
        <div className="flex items-center justify-end pt-2 border-t border-white/10">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => onEdit(item)}
            className="px-3.5 py-1.5 rounded-xl bg-white text-black font-semibold text-xs transition-all shadow-[0_0_15px_rgba(255,255,255,0.6)] cursor-pointer hover:bg-white/90"
          >
            Edit
          </motion.button>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}

/**
 * Client-rendered real-time indicator line (Prevents SSR Hydration Mismatch)
 */
function CurrentTimeIndicator({ isToday }: { isToday: boolean }) {
  const [currentPosition, setCurrentPosition] = useState<number | null>(null);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
      setCurrentPosition((currentMinutes / 60) * HOUR_HEIGHT);
    };

    update();
    const interval = setInterval(update, 15000);
    return () => clearInterval(interval);
  }, []);

  if (!isToday || currentPosition === null) return null;

  return (
    <div
      className="absolute left-0 right-0 z-30 flex items-center pointer-events-none transition-all duration-300"
      style={{ top: `${currentPosition}px` }}
    >
      <div className="w-14 md:w-28 flex justify-end pr-1.5 md:pr-2">
        <span className="w-2 md:w-2.5 h-2 md:h-2.5 rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,1),0_0_24px_rgba(255,255,255,0.8)] animate-pulse" />
      </div>
      <div className="flex-1 h-[1.5px] bg-gradient-to-r from-white via-white/80 to-transparent shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
    </div>
  );
}
