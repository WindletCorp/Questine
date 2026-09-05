"use client";

import React, { useState } from "react";
import { User, RotateCw } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { useContinuousTimeline } from "@/lib/hooks/use-continuous-timeline";
import { SyncEngine } from "@/lib/sync/engine";
import type { TimelineItem, Task, RoutineBlock, EnrichedMetricEntry, Journal } from "@/lib/db/types";
import { ContinuousCalendarPane } from "../components/dashboard/continuous-calendar-pane";
import { DragSplitView } from "../components/dashboard/drag-split-view";
import { AnalyticsStrip } from "../components/dashboard/analytics-strip";
import { ContextualFab, type FeatureType } from "../components/dashboard/contextual-fab";
import { TaskPane } from "../components/dashboard/panes/task-pane";
import { RoutinePane } from "../components/dashboard/panes/routine-pane";
import { MetricPane } from "../components/dashboard/panes/metric-pane";
import { JournalPane } from "../components/dashboard/panes/journal-pane";
import { computeWeekAnalytics } from "@/lib/local-db/analytics";
import { cn } from "@/lib/utils";

type ActivePaneState =
  | { type: "task"; data?: Task | null }
  | { type: "routine"; data?: RoutineBlock | null }
  | { type: "metric"; data?: EnrichedMetricEntry | null }
  | { type: "journal"; data?: Journal | null }
  | null;

export function Dashboard({ userId }: { userId?: string }) {
  const currentUserId = userId || "guest";
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Active Pane / Editor State
  const [activePane, setActivePane] = useState<ActivePaneState>(null);
  const [isManualSyncing, setIsManualSyncing] = useState(false);

  // Continuous Bidirectional Infinite Stream Hook
  const {
    daySegments,
    isLoading,
    isFetchingEarlier,
    isFetchingFuture,
    loadEarlierDays,
    loadFutureDays,
    refresh,
  } = useContinuousTimeline(currentUserId, 3, 3);

  // FAB Trigger Handler
  const handleOpenCreate = (type: FeatureType) => {
    setActivePane({ type, data: null });
  };

  // Item Edit Handler (from Tooltip [Edit] button)
  const handleEditItem = (item: TimelineItem) => {
    if (item.type === "task") {
      setActivePane({ type: "task", data: item.data as Task });
    } else if (item.type === "routine_block") {
      setActivePane({ type: "routine", data: item.data as RoutineBlock });
    } else if (item.type === "metric_entry") {
      setActivePane({ type: "metric", data: item.data as EnrichedMetricEntry });
    } else if (item.type === "journal") {
      setActivePane({ type: "journal", data: item.data as Journal });
    }
  };

  // Profile Button Click -> Triggers Cloud Sync & Refresh
  const handleProfileSync = async () => {
    if (isManualSyncing) return;
    setIsManualSyncing(true);
    try {
      await SyncEngine.fullSync();
      await refresh();
    } finally {
      setTimeout(() => setIsManualSyncing(false), 500);
    }
  };

  const isSyncing = isManualSyncing || isLoading || isFetchingEarlier || isFetchingFuture;

  // Compute analytics dynamically from the timeline segments currently loaded
  const analytics = React.useMemo(() => {
    // Flatten items from all segments
    const allItems = daySegments.flatMap(segment => segment.items);
    return computeWeekAnalytics(allItems);
  }, [daySegments]);

  return (
    <div className="relative flex flex-col justify-between p-4 md:p-6 antialiased select-none h-[calc(100dvh-72px)] w-full max-w-4xl mx-auto overflow-hidden">

      {/* Bidirectional Continuous Infinite Timeline Viewport with Split-View Analytics */}
      <main className="flex-1 w-full relative z-10 flex flex-col min-h-0 overflow-hidden mb-3">
        <DragSplitView 
          topPanel={(y) => <AnalyticsStrip analytics={analytics} y={y} userId={currentUserId} />}
          bottomPanel={
            <ContinuousCalendarPane
              daySegments={daySegments}
              isFetchingEarlier={isFetchingEarlier}
              isFetchingFuture={isFetchingFuture}
              onLoadEarlierDays={loadEarlierDays}
              onLoadFutureDays={loadFutureDays}
              onEditItem={handleEditItem}
              onRefresh={refresh}
            />
          }
        />

        {/* Dedicated Floating VisionOS Glass Tray Overlay */}
        <div className="absolute inset-0 z-30 pointer-events-none">
          {/* Invisible Click-Outside Dismiss Area */}
          <div
            className={cn(
              "absolute inset-0 transition-opacity duration-300",
              activePane ? "pointer-events-auto" : "pointer-events-none"
            )}
            onClick={() => setActivePane(null)}
          />

          <div className="absolute bottom-3 left-4 right-4 z-40 flex justify-center pointer-events-none">
            <TaskPane
              task={activePane?.type === "task" ? activePane.data : undefined}
              userId={currentUserId}
              onClose={() => setActivePane(null)}
              onSuccess={refresh}
              isVisible={activePane?.type === "task"}
            />
            <RoutinePane
              routine={activePane?.type === "routine" ? activePane.data : undefined}
              userId={currentUserId}
              onClose={() => setActivePane(null)}
              onSuccess={refresh}
              isVisible={activePane?.type === "routine"}
            />
            <MetricPane
              entry={activePane?.type === "metric" ? activePane.data : undefined}
              userId={currentUserId}
              onClose={() => setActivePane(null)}
              onSuccess={refresh}
              isVisible={activePane?.type === "metric"}
            />
            <JournalPane
              journal={activePane?.type === "journal" ? activePane.data : undefined}
              userId={currentUserId}
              onClose={() => setActivePane(null)}
              onSuccess={refresh}
              isVisible={activePane?.type === "journal"}
            />
          </div>
        </div>
      </main>

      {/* Contextual Floating Action Bar (FAB) */}
      <ContextualFab onOpenCreate={handleOpenCreate} />
    </div>
  );
}
