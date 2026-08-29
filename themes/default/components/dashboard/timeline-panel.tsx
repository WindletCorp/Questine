"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { ChevronUp, ChevronDown, RotateCw, Calendar } from "lucide-react";
import type { TimelineItem } from "@/lib/db/types";
import { TaskTimelineCard, RoutineTimelineCard, JournalTimelineCard, MetricTimelineCard } from "./timeline-cards";
import { GlassButton } from "../glass-button";
import styles from "../../theme.module.css";
import { cn } from "@/lib/utils";

interface TimelinePanelProps {
  items: TimelineItem[];
  isLoading: boolean;
  onEditItem: (item: TimelineItem) => void;
  onLoadPreviousWeek: () => void;
  onLoadNextWeek: () => void;
  onRefresh: () => void;
  oldestWeekOffset: number;
  newestWeekOffset: number;
}

export function TimelinePanel({
  items,
  isLoading,
  onEditItem,
  onLoadPreviousWeek,
  onLoadNextWeek,
  onRefresh,
  oldestWeekOffset,
  newestWeekOffset,
}: TimelinePanelProps) {
  // Group items by day
  const groupedDays = useMemo(() => {
    const map = new Map<string, TimelineItem[]>();

    for (const item of items) {
      const dateKey = new Date(item.data.start_time).toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
      });

      const dayList = map.get(dateKey) || [];
      dayList.push(item);
      map.set(dateKey, dayList);
    }

    return Array.from(map.entries()).map(([dayLabel, dayItems]) => ({
      dayLabel,
      items: dayItems,
    }));
  }, [items]);

  return (
    <div className="flex flex-col h-full w-full gap-3">
      {/* Header & Controls */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-white/50" />
          <h2 className="text-sm font-semibold text-white">Timeline Stream</h2>
          <span className="text-[10px] font-mono text-white/40 px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
            {items.length} items
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <GlassButton
            variant="pill"
            onClick={onLoadPreviousWeek}
            aria-label="Load older week"
            className="py-1 px-2.5 text-[11px] gap-1"
          >
            <ChevronUp className="w-3 h-3" />
            <span>Older</span>
          </GlassButton>

          <GlassButton
            variant="circle"
            onClick={onRefresh}
            aria-label="Refresh timeline"
            className="w-7 h-7"
          >
            <RotateCw className={cn("w-3 h-3 text-white/70", isLoading && "animate-spin")} />
          </GlassButton>

          {oldestWeekOffset < 0 && (
            <GlassButton
              variant="pill"
              onClick={onLoadNextWeek}
              aria-label="Load newer week"
              className="py-1 px-2.5 text-[11px] gap-1"
            >
              <span>Newer</span>
              <ChevronDown className="w-3 h-3" />
            </GlassButton>
          )}
        </div>
      </div>

      {/* Timeline Stream Scrollable Body */}
      <div
        className={cn("flex-1 flex flex-col gap-5 pr-1", styles.customGlassScroll)}
        style={{ maxHeight: "calc(100dvh - 160px)" }}
      >
        {items.length === 0 && !isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-white/40 gap-2">
            <span className="text-3xl">🌌</span>
            <span className="text-xs font-medium">No timeline activity in this range.</span>
            <span className="text-[10px] text-white/30 max-w-xs">
              Use the + button below to log your first task, routine, journal note, or metric entry.
            </span>
          </div>
        ) : (
          groupedDays.map(({ dayLabel, items: dayItems }) => (
            <div key={dayLabel} className="flex flex-col gap-2">
              {/* Day Header Divider */}
              <div className="flex items-center gap-2 px-1">
                <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
                <span className="text-[10px] font-mono uppercase tracking-widest text-white/50 font-semibold">
                  {dayLabel}
                </span>
                <div className="flex-1 h-[1px] bg-gradient-to-r from-white/10 to-transparent" />
              </div>

              {/* Day Items Stack */}
              <div className="flex flex-col gap-2">
                {dayItems.map((item) => {
                  const key = `${item.type}-${item.data.id}`;
                  switch (item.type) {
                    case "task":
                      return (
                        <TaskTimelineCard
                          key={key}
                          task={item.data}
                          onEdit={onEditItem}
                          onRefresh={onRefresh}
                        />
                      );
                    case "routine_block":
                      return (
                        <RoutineTimelineCard
                          key={key}
                          block={item.data}
                          onEdit={onEditItem}
                        />
                      );
                    case "journal":
                      return (
                        <JournalTimelineCard
                          key={key}
                          journal={item.data}
                          onEdit={onEditItem}
                        />
                      );
                    case "metric_entry":
                      return (
                        <MetricTimelineCard
                          key={key}
                          entry={item.data}
                          onEdit={onEditItem}
                        />
                      );
                  }
                })}
              </div>
            </div>
          ))
        )}

        {/* Load More trigger button at bottom of stream */}
        {items.length > 0 && (
          <div className="flex justify-center pt-2 pb-4">
            <GlassButton
              variant="pill"
              onClick={onLoadPreviousWeek}
              className="text-[11px] py-1.5 px-4 text-white/60 hover:text-white"
            >
              Load Earlier Week
            </GlassButton>
          </div>
        )}
      </div>
    </div>
  );
}
