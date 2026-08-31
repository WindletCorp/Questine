"use client";

import { useEffect, useState } from "react";
import { DeckCard } from "./deck-card";
import styles from "../theme.module.css";

import type { RoutineBlock } from "@/lib/db/types";

export function RoutineCard({ 
  position = 0, 
  isExpanded = false, 
  onClick,
  routine
}: { 
  position?: 0 | 1 | 2 | 3; 
  isExpanded?: boolean; 
  onClick?: (e: React.MouseEvent) => void;
  routine?: RoutineBlock;
}) {
  const [progress, setProgress] = useState(0); 

  // Calculate live progress
  useEffect(() => {
    if (!routine || !routine.end_time) return;
    const interval = setInterval(() => {
      const start = new Date(routine.start_time).getTime();
      const end = new Date(routine.end_time).getTime();
      const now = Date.now();
      
      if (now < start) {
        setProgress(0);
      } else if (now > end) {
        setProgress(100);
      } else {
        const total = end - start;
        const elapsed = now - start;
        setProgress((elapsed / total) * 100);
      }
    }, 10000); // update every 10s
    return () => clearInterval(interval);
  }, [routine]);

  const formatTime = (iso?: string) => {
    if (!iso) return "";
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getDurationString = () => {
    if (!routine?.end_time) return "Ongoing";
    const mins = Math.round((new Date(routine.end_time).getTime() - new Date(routine.start_time).getTime()) / 60000);
    return `${mins}m`;
  };

  const headerElement = (
    <div className="time-ring-badge shrink-0 relative w-[38px] h-[38px] rounded-full bg-white/10 border border-white/20 flex flex-col items-center justify-center shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.35)]">
      {routine && (
        <div 
          className={styles.livelyTimerRing}
        />
      )}
      <span className="text-[10px] font-bold text-white font-mono leading-none z-10">{routine ? getDurationString() : "--"}</span>
    </div>
  );

  return (
    <DeckCard
      position={position}
      isExpanded={isExpanded}
      onClick={onClick}
      title="Routine"
      subtitleTop={routine ? `${formatTime(routine.start_time)} – ${formatTime(routine.end_time)}` : "No Active Routine"}
      subtitleBottom={routine ? routine.category : "Schedule a block"}
      headerElement={headerElement}
      accentColor="amber"
    >
      {routine ? (
        <>
          <div className="flex items-center justify-between px-1 space-y-2">
            <span className="text-[9px] font-mono text-white/40 uppercase tracking-wider">Phase Progress</span>
            <span className="text-[9px] font-mono text-white/60">{Math.round(progress)}% complete</span>
          </div>
          <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden mt-1">
            <div className="bg-white/80 h-full rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
          </div>
          <p className="text-[11px] text-white/60 leading-relaxed pt-2 line-clamp-2">
            {routine.label}
          </p>
        </>
      ) : (
        <p className="text-[11px] text-white/60 leading-relaxed pt-2 italic">
          No routine blocks scheduled for this time. Take a break!
        </p>
      )}
    </DeckCard>
  );
}
