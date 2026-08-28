"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassSphere } from "../components/glass-sphere";
import { GlassButton } from "../components/glass-button";
import { StackedDeck } from "../components/stacked-deck";
import { RoutineCard } from "../components/routine-card";
import { TasksCard } from "../components/tasks-card";
import { MetricsCard } from "../components/metrics-card";
import { JournalCard } from "../components/journal-card";
import { EntryView } from "../components/entry-view";
import { User } from "lucide-react";

export function Dashboard({ userId }: { userId?: string }) {
  const [entryModeActive, setEntryModeActive] = useState(false);

  return (
    <div className="relative flex flex-col justify-between p-5 md:p-6 antialiased select-none h-[100dvh] w-full max-w-lg mx-auto">
      {/* Background Dot Mesh Grid */}
      <div className="bg-dot-mesh fixed inset-0 pointer-events-none -z-20" />

      {/* Atmospheric Luminous Aura (Full-screen background glow that never gets cropped) */}
      <div 
        className="fixed inset-0 pointer-events-none -z-10 flex items-center justify-center transition-all duration-1000 ease-out"
      >
        <div 
          className="rounded-full transition-all duration-1000 ease-out"
          style={{
            width: entryModeActive ? "520px" : "380px",
            height: entryModeActive ? "520px" : "380px",
            background: entryModeActive 
              ? "radial-gradient(circle, rgba(255, 255, 255, 0.16) 0%, rgba(255, 255, 255, 0.05) 50%, transparent 75%)" 
              : "radial-gradient(circle, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 50%, transparent 75%)",
            filter: "blur(40px)",
            transform: entryModeActive ? "scale(1.15)" : "scale(1)",
          }}
        />
      </div>

      {/* Header Section */}
      <header className="w-full flex justify-between items-center z-30 shrink-0">
        <div className="flex flex-col">
          <span className="text-[10px] font-semibold tracking-widest uppercase text-white/40 font-mono">Questine OS</span>
          <span className="text-xs font-medium text-white/75 mt-0.5">Good Afternoon, Alex</span>
        </div>

        <GlassButton variant="profile" aria-label="User Profile">
          <User className="w-4 h-4" />
        </GlassButton>
      </header>

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
        <AnimatePresence mode="wait">
          {!entryModeActive ? (
            <motion.div
              key="deck"
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 120, damping: 20, mass: 1 }}
              className="w-full flex justify-center origin-top"
            >
              <StackedDeck>
                <RoutineCard />
                <TasksCard />
                <MetricsCard />
                <JournalCard />
              </StackedDeck>
            </motion.div>
          ) : (
            <motion.div
              key="entry"
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 120, damping: 20, mass: 1 }}
              className="w-full max-w-[25rem] origin-top"
            >
              <EntryView 
                isActive={entryModeActive} 
                onClose={() => setEntryModeActive(false)} 
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
