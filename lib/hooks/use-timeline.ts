"use client";

import { useCallback, useRef, useState } from "react";
import useSWR from "swr";
import type { TimelineItem } from "@/lib/db/types";
import { getTimelineWeek, getWeekBounds } from "@/lib/local-db/timeline";

type UseTimelineOptions = {
  /** How many weeks to keep in the buffer at once. Oldest weeks get evicted. */
  maxWeeks?: number;
};

type TimelineState = {
  /** All loaded timeline items, sorted ascending by start_time */
  items: TimelineItem[];
  /** Whether any week is currently loading */
  isLoading: boolean;
  /** Error from the most recent fetch, if any */
  error: string | null;
  /** The oldest loaded week offset (e.g. -3 means 3 weeks ago) */
  oldestWeekOffset: number;
  /** The newest loaded week offset (usually 0 = current week) */
  newestWeekOffset: number;
  /** Load the previous (older) week */
  loadPreviousWeek: () => void;
  /** Load the next (newer) week */
  loadNextWeek: () => void;
  /** Refresh all currently loaded weeks */
  refresh: () => void;
};

/**
 * SWR-backed React hook for the unified timeline.
 *
 * Starts by loading the current week (offset=0).
 * `loadPreviousWeek()` / `loadNextWeek()` extend the loaded range.
 * Keeps at most `maxWeeks` in memory (default 4).
 */
export function useTimeline(userId: string, options: UseTimelineOptions = {}): TimelineState {
  const { maxWeeks = 4 } = options;

  // Track which weeks are loaded as [oldest, newest] offsets
  const [oldestWeekOffset, setOldestWeekOffset] = useState(0);
  const [newestWeekOffset, setNewestWeekOffset] = useState(0);

  // Build a stable SWR key from the range of loaded weeks
  const swrKey = userId
    ? `timeline:${userId}:${oldestWeekOffset}:${newestWeekOffset}`
    : null;

  const fetcher = useCallback(async (): Promise<TimelineItem[]> => {
    const allItems: TimelineItem[] = [];

    // Fetch each week in parallel
    const weekOffsets: number[] = [];
    for (let w = oldestWeekOffset; w <= newestWeekOffset; w++) {
      weekOffsets.push(w);
    }

    const results = await Promise.all(
      weekOffsets.map(offset => getTimelineWeek(userId, offset))
    );

    for (const result of results) {
      if (result.data) {
        allItems.push(...result.data);
      }
    }

    // Sort ascending by start_time
    allItems.sort((a, b) => a.data.start_time.localeCompare(b.data.start_time));

    return allItems;
  }, [userId, oldestWeekOffset, newestWeekOffset]);

  const { data, error, isLoading, mutate } = useSWR(swrKey, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 2000,
  });

  const loadPreviousWeek = useCallback(() => {
    setOldestWeekOffset(prev => {
      const next = prev - 1;
      // Evict newest week if we exceed maxWeeks
      setNewestWeekOffset(newest => {
        if (newest - next + 1 > maxWeeks) {
          return newest - 1;
        }
        return newest;
      });
      return next;
    });
  }, [maxWeeks]);

  const loadNextWeek = useCallback(() => {
    setNewestWeekOffset(prev => {
      const next = prev + 1;
      // Evict oldest week if we exceed maxWeeks
      setOldestWeekOffset(oldest => {
        if (next - oldest + 1 > maxWeeks) {
          return oldest + 1;
        }
        return oldest;
      });
      return next;
    });
  }, [maxWeeks]);

  const refresh = useCallback(() => {
    mutate();
  }, [mutate]);

  return {
    items: data ?? [],
    isLoading,
    error: error ? String(error) : null,
    oldestWeekOffset,
    newestWeekOffset,
    loadPreviousWeek,
    loadNextWeek,
    refresh,
  };
}
