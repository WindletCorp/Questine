"use client";

import React, { useState } from "react";
import { User, RotateCw } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { useContinuousTimeline } from "@/lib/hooks/use-continuous-timeline";
import { SyncEngine } from "@/lib/sync/engine";
import type { TimelineItem, Task, RoutineBlock, EnrichedMetricEntry, Journal } from "@/lib/db/types";
import { ContinuousCalendarPane } from "../components/dashboard/continuous-calendar-pane";
import { ContextualFab, type FeatureType } from "../components/dashboard/contextual-fab";
import { TaskPane } from "../components/dashboard/panes/task-pane";
import { RoutinePane } from "../components/dashboard/panes/routine-pane";
import { MetricPane } from "../components/dashboard/panes/metric-pane";
import { JournalPane } from "../components/dashboard/panes/journal-pane";
import { cn } from "@/lib/utils";

type ActivePaneState =
  | { type: "task"; data?: Task | null }
  | { type: "routine"; data?: RoutineBlock | null }
  | { type: "metric"; data?: EnrichedMetricEntry | null }
  | { type: "journal"; data?: Journal | null }
  | null;

export function Dashboard({ userId }: { userId?: string }) {
  const currentUserId = userId || "guest";

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

  return (
    <div className="relative flex flex-col justify-between p-4 md:p-6 antialiased select-none h-[100dvh] w-full max-w-4xl mx-auto overflow-hidden">
      {/* Background Dot Mesh Grid */}
      <div className="bg-dot-mesh fixed inset-0 pointer-events-none -z-20" />

      {/* Atmospheric Luminous Aura */}
      <div className="fixed inset-0 pointer-events-none -z-10 flex items-center justify-center">
        <div
          className="rounded-full transition-all duration-1000 ease-out"
          style={{
            width: "540px",
            height: "540px",
            background: "radial-gradient(circle, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.03) 50%, transparent 75%)",
            filter: "blur(50px)",
          }}
        />
      </div>

      {/* Top Header */}
      <header className="w-full flex justify-between items-center z-30 shrink-0 pb-3 gap-2">
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-semibold tracking-widest uppercase text-white/40 font-mono">
            Questine OS
          </span>
        </div>

        {/* Profile Button with Corner Sync Indicator */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleProfileSync}
            aria-label="User Profile & Cloud Sync"
            title="Click to sync with cloud"
            className="group relative w-9 h-9 rounded-full bg-white/[0.08] backdrop-blur-[36px] border border-white/20 hover:border-white/40 hover:bg-white/[0.14] transition-all cursor-pointer flex items-center justify-center text-white/80 hover:text-white shadow-[0_8px_20px_rgba(0,0,0,0.4),inset_0_1px_1.5px_rgba(255,255,255,0.4)]"
          >
            <User className="w-4 h-4" />

            {/* Corner Refresh Icon Badge */}
            <div className="absolute -top-1 -right-1 w-4.5 h-4.5 rounded-full bg-black/75 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-md">
              <RotateCw
                className={cn(
                  "w-2.5 h-2.5 text-white/70 group-hover:text-white transition-all",
                  isSyncing && "animate-spin text-white"
                )}
              />
            </div>

            {/* VisionOS Specular Luminous Sync Aura */}
            {isSyncing && (
              <div className="absolute inset-0 rounded-full border border-white/70 animate-ping shadow-[0_0_15px_rgba(255,255,255,0.8)] pointer-events-none" />
            )}
          </button>
        </div>
      </header>

      {/* Bidirectional Continuous Infinite Timeline Viewport */}
      <main className="flex-1 w-full relative z-10 flex flex-col min-h-0 overflow-hidden py-1 mb-3">
        <ContinuousCalendarPane
          daySegments={daySegments}
          isFetchingEarlier={isFetchingEarlier}
          isFetchingFuture={isFetchingFuture}
          onLoadEarlierDays={loadEarlierDays}
          onLoadFutureDays={loadFutureDays}
          onEditItem={handleEditItem}
          onRefresh={refresh}
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
