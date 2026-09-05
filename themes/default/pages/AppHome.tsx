"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getTimelineRange } from "@/lib/local-db/timeline";
import type { TimelineItem, Task, RoutineBlock, EnrichedMetricEntry, Journal } from "@/lib/db/types";
import { GlassSphere } from "../components/glass-sphere";
import { GlassButton } from "../components/glass-button";
import { StackedDeck } from "../components/stacked-deck";
import { RoutineCard } from "../components/routine-card";
import { TasksCard } from "../components/tasks-card";
import { MetricsCard } from "../components/metrics-card";
import { JournalCard } from "../components/journal-card";

import { EntryView } from "../components/entry-view";

export function AppHome({ userId }: { userId?: string }) {
  const [entryModeActive, setEntryModeActive] = useState(false);
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    async function loadData() {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString();
      
      const res = await getTimelineRange(userId || "guest", start, end);
      if (res.data) {
        setTimelineItems(res.data);
      }
    }
    loadData();
    
    // Auto-refresh every minute just to keep "next" logic fresh
    const timer = setInterval(loadData, 60000);
    return () => clearInterval(timer);
  }, [userId]);

  // Extract exactly one of each type
  const nextTask = timelineItems.find(i => i.type === "task" && !(i.data as Task).completed_at)?.data as Task | undefined;
  const nextRoutine = timelineItems.find(i => i.type === "routine_block" && new Date((i.data as RoutineBlock).end_time).getTime() > Date.now())?.data as RoutineBlock | undefined;
  const latestMetric = timelineItems.slice().reverse().find(i => i.type === "metric_entry")?.data as EnrichedMetricEntry | undefined;
  const latestJournal = timelineItems.slice().reverse().find(i => i.type === "journal")?.data as Journal | undefined;

  return (
    <div className="relative flex flex-col justify-between p-5 md:p-6 antialiased select-none flex-1 h-full w-full max-w-lg mx-auto">


      {/* Atmospheric Luminous Aura */}
      <div className="fixed inset-0 pointer-events-none -z-10 flex items-center justify-center">
        <motion.div 
          className="rounded-full"
          animate={{
            scale: entryModeActive ? 1.4 : 1,
            opacity: entryModeActive ? 1 : 0.6,
          }}
          transition={{ type: "spring", stiffness: 200, damping: 24, mass: 0.8 }}
          style={{
            width: "380px",
            height: "380px",
            background: "radial-gradient(circle, rgba(255, 255, 255, 0.16) 0%, rgba(255, 255, 255, 0.05) 40%, rgba(255, 255, 255, 0.01) 60%, transparent 80%)",
          }}
        />
      </div>


      {/* Central Viewport-Centered Core Canvas */}
      <main className="flex-1 flex flex-col items-center justify-center relative w-full z-10 my-auto py-2">
        <div className="relative flex items-center justify-center">
          <GlassSphere 
            isActive={entryModeActive} 
            onClick={() => setEntryModeActive(!entryModeActive)} 
          />
        </div>
      </main>

      {/* Lower Slot (Live Context Deck <-> Entry View with Zero Overlap) */}
      <div className="w-full flex flex-col items-center z-20 pb-8 sm:pb-10 relative min-h-[140px] shrink-0">
        <div className="grid w-full place-items-center">
          {mounted && (
            <>
              <motion.div
                animate={{
                  opacity: !entryModeActive ? 1 : 0,
                  y: !entryModeActive ? 0 : 30,
                  scale: !entryModeActive ? 1 : 0.9,
                  pointerEvents: !entryModeActive ? "auto" : "none",
                }}
                transition={{ type: "spring", stiffness: 200, damping: 24, mass: 0.8 }}
                className="w-full flex justify-center origin-top [grid-area:1/1] isolate"
              >
                <StackedDeck entryModeActive={entryModeActive}>
                  <RoutineCard routine={nextRoutine} />
                  <TasksCard task={nextTask} />
                  <MetricsCard metric={latestMetric} />
                  <JournalCard journal={latestJournal} />
                </StackedDeck>
              </motion.div>

              <AnimatePresence>
                {entryModeActive && (
                  <motion.div
                    key="entry"
                    initial={{ opacity: 0, y: 30, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 30, scale: 0.9 }}
                    transition={{ type: "spring", stiffness: 200, damping: 24, mass: 0.8 }}
                    className="w-full max-w-[25rem] origin-top [grid-area:1/1]"
                  >
                    <EntryView 
                      userId={userId}
                      isActive={entryModeActive} 
                      onClose={() => setEntryModeActive(false)} 
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
