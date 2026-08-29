"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { ChevronUp, RotateCw } from "lucide-react";
import type { TimelineItem } from "@/lib/db/types";
import { StreamCard } from "./stream-card";
import { GlassButton } from "../glass-button";
import styles from "../../theme.module.css";
import { cn } from "@/lib/utils";

interface UnifiedFeedProps {
  items: TimelineItem[];
  isLoading: boolean;
  onRefresh: () => void;
  onLoadPreviousWeek: () => void;
}

export function UnifiedFeed({
  items,
  isLoading,
  onRefresh,
  onLoadPreviousWeek,
}: UnifiedFeedProps) {
  // Group by human-friendly day titles
  const groupedDays = useMemo(() => {
    const todayStr = new Date().toDateString();
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();

    const map = new Map<string, TimelineItem[]>();

    for (const item of items) {
      const itemDate = new Date(item.data.start_time).toDateString();
      let label = new Date(item.data.start_time).toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
      });

      if (itemDate === todayStr) label = "Today";
      else if (itemDate === yesterday) label = "Yesterday";

      const list = map.get(label) || [];
      list.push(item);
      map.set(label, list);
    }

    return Array.from(map.entries()).map(([dayLabel, dayItems]) => ({
      dayLabel,
      items: dayItems,
    }));
  }, [items]);

  return (
    <div
      className={cn("flex-1 flex flex-col gap-4 pr-1 overflow-y-auto", styles.customGlassScroll)}
      style={{ maxHeight: "calc(100dvh - 190px)" }}
    >
      {items.length === 0 && !isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-center text-white/40 gap-2">
          <span className="text-2xl">✨</span>
          <span className="text-xs font-medium text-white/70">Clear workspace</span>
          <span className="text-[11px] text-white/35 max-w-xs">
            Type anything in the bar below to effortlessly log focus, tasks, metrics, or reflections.
          </span>
        </div>
      ) : (
        groupedDays.map(({ dayLabel, items: dayItems }) => (
          <div key={dayLabel} className="flex flex-col gap-2">
            {/* Minimalist Day Header */}
            <div className="flex items-center gap-2 px-1 pt-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-white/40 font-semibold">
                {dayLabel}
              </span>
              <div className="flex-1 h-[1px] bg-white/5" />
            </div>

            {/* Stream Rows */}
            <div className="flex flex-col gap-1.5">
              {dayItems.map((item) => (
                <StreamCard
                  key={`${item.type}-${item.data.id}`}
                  item={item}
                  onRefresh={onRefresh}
                />
              ))}
            </div>
          </div>
        ))
      )}

      {/* Discreet pagination */}
      {items.length > 0 && (
        <div className="flex justify-center pt-2 pb-6">
          <GlassButton
            variant="pill"
            onClick={onLoadPreviousWeek}
            className="text-[10px] py-1 px-3 text-white/50 hover:text-white"
          >
            Earlier Activity
          </GlassButton>
        </div>
      )}
    </div>
  );
}
