"use client";

import { useCallback, useState } from "react";
import useSWR from "swr";
import type { TimelineItem } from "@/lib/db/types";
import { getTimelineRange } from "@/lib/local-db/timeline";

/**
 * Computes ISO start (00:00:00 LOCAL time) and end (23:59:59.999 LOCAL time)
 * for a day offset from today so that grid and hour coordinates align 100% with local timezone.
 */
export function getDayBounds(dayOffset: number): {
  start: string;
  end: string;
  date: Date;
  startMs: number;
  endMs: number;
} {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + dayOffset, 0, 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + dayOffset, 23, 59, 59, 999);

  return {
    start: d.toISOString(),
    end: end.toISOString(),
    date: d,
    startMs: d.getTime(),
    endMs: end.getTime(),
  };
}

export interface DaySegment {
  dayOffset: number;
  date: Date;
  dateKey: string;
  dayStartMs: number;
  dayEndMs: number;
  isToday: boolean;
  items: TimelineItem[];
}

/**
 * Bidirectional continuous infinite stream hook.
 */
export function useContinuousTimeline(
  userId: string,
  initialPastDays: number = 3,
  initialFutureDays: number = 3
) {
  const [oldestDayOffset, setOldestDayOffset] = useState(-initialPastDays);
  const [newestDayOffset, setNewestDayOffset] = useState(initialFutureDays);
  const [isFetchingEarlier, setIsFetchingEarlier] = useState(false);
  const [isFetchingFuture, setIsFetchingFuture] = useState(false);

  const swrKey = userId
    ? `bidirectional-timeline:${userId}:${oldestDayOffset}:${newestDayOffset}`
    : null;

  const fetcher = useCallback(async (): Promise<TimelineItem[]> => {
    const { start } = getDayBounds(oldestDayOffset);
    const { end } = getDayBounds(newestDayOffset);
    const res = await getTimelineRange(userId, start, end);
    return res.data || [];
  }, [userId, oldestDayOffset, newestDayOffset]);

  const { data, error, isLoading, mutate } = useSWR(swrKey, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 1500,
  });

  const loadEarlierDays = useCallback((count: number = 3) => {
    if (isFetchingEarlier) return;
    setIsFetchingEarlier(true);
    setOldestDayOffset((prev) => prev - count);
    setTimeout(() => setIsFetchingEarlier(false), 300);
  }, [isFetchingEarlier]);

  const loadFutureDays = useCallback((count: number = 3) => {
    if (isFetchingFuture) return;
    setIsFetchingFuture(true);
    setNewestDayOffset((prev) => prev + count);
    setTimeout(() => setIsFetchingFuture(false), 300);
  }, [isFetchingFuture]);

  const daySegments: DaySegment[] = [];
  const allItems = data || [];
  const todayStr = new Date().toDateString();

  for (let offset = oldestDayOffset; offset <= newestDayOffset; offset++) {
    const { date, startMs, endMs } = getDayBounds(offset);
    const isToday = date.toDateString() === todayStr;

    // Filter items belonging to or crossing into this day's local bounds
    const dayItems = allItems.filter((item) => {
      const itemStart = new Date(item.data.start_time).getTime();
      let itemEnd = "end_time" in item.data && item.data.end_time
        ? new Date(item.data.end_time).getTime()
        : itemStart + 30 * 60 * 1000;

      return itemEnd >= startMs && itemStart <= endMs;
    });

    const dateKey = date.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    });

    daySegments.push({
      dayOffset: offset,
      date,
      dateKey: isToday ? "Today" : dateKey,
      dayStartMs: startMs,
      dayEndMs: endMs,
      isToday,
      items: dayItems,
    });
  }

  return {
    daySegments,
    allItems,
    isLoading,
    isFetchingEarlier,
    isFetchingFuture,
    loadEarlierDays,
    loadFutureDays,
    refresh: mutate,
  };
}
