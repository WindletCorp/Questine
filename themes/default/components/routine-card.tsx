"use client";

import { useState } from "react";
import { DeckCard } from "./deck-card";
import styles from "../theme.module.css";

export function RoutineCard({ 
  position = 0, 
  isExpanded = false, 
  onClick 
}: { 
  position?: 0 | 1 | 2 | 3; 
  isExpanded?: boolean; 
  onClick?: (e: React.MouseEvent) => void; 
}) {
  const [progress] = useState(37.5); // Mock progress

  const headerElement = (
    <div className="time-ring-badge shrink-0 relative w-[38px] h-[38px] rounded-full bg-white/10 border border-white/20 flex flex-col items-center justify-center shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.35)]">
      <div 
        className={styles.livelyTimerRing}
      />
      <span className="text-[10px] font-bold text-white font-mono leading-none z-10">45m</span>
    </div>
  );

  return (
    <DeckCard
      position={position}
      isExpanded={isExpanded}
      onClick={onClick}
      title="Routine"
      subtitleTop="09:00 AM – 11:00 AM"
      subtitleBottom="Deep Work & Architecture"
      headerElement={headerElement}
    >
      <div className="flex items-center justify-between px-1 space-y-2">
        <span className="text-[9px] font-mono text-white/40 uppercase tracking-wider">Phase Progress</span>
        <span className="text-[9px] font-mono text-white/60">45m of 120m</span>
      </div>
      <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden mt-1">
        <div className="bg-white/80 h-full rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
      </div>
      <p className="text-[11px] text-white/60 leading-relaxed pt-2">
        Next phase begins at 11:00 AM: System Review & Sync.
      </p>
    </DeckCard>
  );
}
