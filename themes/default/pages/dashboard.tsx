"use client";

import { useState } from "react";
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
    <div className="relative flex flex-col justify-between p-5 md:p-6 antialiased select-none min-h-[100dvh] w-full max-w-lg mx-auto overflow-hidden">
      {/* Micro-Dot Mesh Grid is handled by global body class in layout, but we can add it here if needed */}
      <div className="bg-dot-mesh fixed inset-0 pointer-events-none -z-10" />

      {/* Header */}
      <header className="w-full flex justify-between items-center z-20">
        <div className="flex flex-col">
          <span className="text-[10px] font-semibold tracking-widest uppercase text-white/40 font-mono">Questine OS</span>
          <span className="text-xs font-medium text-white/75 mt-0.5">Good Afternoon, Alex</span>
        </div>

        <GlassButton variant="profile" aria-label="User Profile">
          <User className="w-4 h-4" />
        </GlassButton>
      </header>

      {/* Main Canvas */}
      <main className="flex-1 flex flex-col items-center justify-between z-10 w-full px-2 py-4 relative my-auto">
        
        {/* Central Omni Core Sphere */}
        <div className="w-full flex flex-col items-center justify-center my-auto py-2">
          <GlassSphere 
            isActive={entryModeActive} 
            onClick={() => setEntryModeActive(!entryModeActive)} 
          />
        </div>

        {/* LOWER AREA */}
        <div className="w-full flex flex-col items-center mt-auto pb-4 relative min-h-[150px]">
          
          {/* Stacked Deck (hidden when entry mode is active) */}
          <div 
            className={`w-full flex flex-col items-center transition-all duration-350 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              entryModeActive ? "opacity-0 translate-y-[-12px] scale-95 pointer-events-none" : "opacity-100 translate-y-0 scale-100"
            }`}
          >
            <StackedDeck>
              <RoutineCard />
              <TasksCard />
              <MetricsCard />
              <JournalCard />
            </StackedDeck>
          </div>

          {/* Entry View */}
          <EntryView 
            isActive={entryModeActive} 
            onClose={() => setEntryModeActive(false)} 
          />

        </div>
      </main>
    </div>
  );
}
