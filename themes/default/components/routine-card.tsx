"use client";

import { useEffect, useState } from "react";
import { DeckCard } from "./deck-card";
import { Calendar } from "lucide-react";

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
  
  const calculateProgress = () => {
    if (!routine || !routine.end_time) return 0;
    const start = new Date(routine.start_time).getTime();
    const end = new Date(routine.end_time).getTime();
    const now = Date.now();
    
    if (now < start) return 0;
    if (now > end) return 100;
    
    const total = end - start;
    const elapsed = now - start;
    return (elapsed / total) * 100;
  };

  const [progress, setProgress] = useState(calculateProgress); 

  // Live update progress periodically without a heavy visual transition lag
  useEffect(() => {
    if (!routine || !routine.end_time) return;
    setProgress(calculateProgress()); // Ensure it's perfectly in sync on mount
    const interval = setInterval(() => {
      setProgress(calculateProgress());
    }, 10000); 
    return () => clearInterval(interval);
  }, [routine]);

  const formatTime = (iso?: string) => {
    if (!iso) return "";
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <DeckCard
      position={position}
      isExpanded={isExpanded}
      onClick={onClick}
      title="Routine"
      icon={<Calendar className="w-4 h-4 text-white/80" />}
      subtitleTop={routine ? `${formatTime(routine.start_time)} – ${formatTime(routine.end_time)}` : "No Active Routine"}
      subtitleBottom={routine ? routine.label : "Schedule a block"}
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
            {routine.category}
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
