"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { User, RotateCw } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { useContinuousTimeline } from "@/lib/hooks/use-continuous-timeline";
import { SyncEngine } from "@/lib/sync/engine";
import type { TimelineItem, Task, RoutineBlock, EnrichedMetricEntry, Journal } from "@/lib/db/types";
import { DragSplitView } from "../components/dashboard/drag-split-view";
import { AnalyticsStrip } from "../components/dashboard/analytics-strip";
import { ContextualFab, type FeatureType } from "../components/dashboard/contextual-fab";
import { computeWeekAnalytics } from "@/lib/local-db/analytics";
import { cn } from "@/lib/utils";

const ContinuousCalendarPane = dynamic(
  () => import("../components/dashboard/continuous-calendar-pane").then((mod) => mod.ContinuousCalendarPane),
  {
    loading: () => (
      <div className="w-full h-full flex items-center justify-center border border-white/10 rounded-[28px] bg-white/[0.03] text-white/50 text-sm">
        Loading Timeline...
      </div>
    ),
    ssr: false,
  }
);

const TaskPane = dynamic(() => import("../components/dashboard/panes/task-pane").then((mod) => mod.TaskPane), { ssr: false });
const RoutinePane = dynamic(() => import("../components/dashboard/panes/routine-pane").then((mod) => mod.RoutinePane), { ssr: false });
const MetricPane = dynamic(() => import("../components/dashboard/panes/metric-pane").then((mod) => mod.MetricPane), { ssr: false });
const JournalPane = dynamic(() => import("../components/dashboard/panes/journal-pane").then((mod) => mod.JournalPane), { ssr: false });

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
            mounted ? (
              <ContinuousCalendarPane
                daySegments={daySegments}
                isFetchingEarlier={isFetchingEarlier}
                isFetchingFuture={isFetchingFuture}
                onLoadEarlierDays={loadEarlierDays}
                onLoadFutureDays={loadFutureDays}
                onEditItem={handleEditItem}
                onRefresh={refresh}
              />
            ) : (
              <div className="w-full h-full border border-white/10 rounded-[28px] bg-white/[0.03]" />
            )
          }
        />

        {/* Dedicated Floating VisionOS Glass Tray Overlay */}
        <AnimatePresence>
          {activePane && (
            <>
              {/* Invisible Click-Outside Dismiss Area */}
              <div
                className="absolute inset-0 z-30 pointer-events-auto"
                onClick={() => setActivePane(null)}
              />

              <div className="absolute bottom-3 left-4 right-4 z-40 flex justify-center pointer-events-none">
                {activePane.type === "task" && (
                  <TaskPane
                    task={activePane.data}
                    userId={currentUserId}
                    onClose={() => setActivePane(null)}
                    onSuccess={refresh}
                  />
                )}
                {activePane.type === "routine" && (
                  <RoutinePane
                    routine={activePane.data}
                    userId={currentUserId}
                    onClose={() => setActivePane(null)}
                    onSuccess={refresh}
                  />
                )}
                {activePane.type === "metric" && (
                  <MetricPane
                    entry={activePane.data}
                    userId={currentUserId}
                    onClose={() => setActivePane(null)}
                    onSuccess={refresh}
                  />
                )}
                {activePane.type === "journal" && (
                  <JournalPane
                    journal={activePane.data}
                    userId={currentUserId}
                    onClose={() => setActivePane(null)}
                    onSuccess={refresh}
                  />
                )}
              </div>
            </>
          )}
        </AnimatePresence>
      </main>

      {/* Contextual Floating Action Bar (FAB) */}
      <ContextualFab onOpenCreate={handleOpenCreate} />
    </div>
  );
}
