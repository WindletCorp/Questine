"use client";

import { DeckCard } from "./deck-card";
import { BookOpen, PenTool } from "lucide-react";
import { GlassButton } from "./glass-button";
import type { Journal } from "@/lib/db/types";

export function JournalCard({ 
  position = 3, 
  isExpanded = false, 
  onClick,
  journal
}: { 
  position?: 0 | 1 | 2 | 3; 
  isExpanded?: boolean; 
  onClick?: (e: React.MouseEvent) => void;
  journal?: Journal;
}) {
  
  const formatTime = (iso?: string) => {
    if (!iso) return "";
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <DeckCard
      position={position}
      isExpanded={isExpanded}
      onClick={onClick}
      icon={<BookOpen className="w-4 h-4 text-white/80" />}
      title="Latest Journal"
      subtitleTop={journal ? formatTime(journal.created_at || journal.start_time) : "Today"}
      subtitleBottom={journal ? "Daily reflection" : "Nothing written yet"}
      accentColor="emerald"
    >
      <div className="flex flex-col gap-2 pt-1">
        {journal ? (
           <p className="text-[11px] text-white/60 italic leading-relaxed">
             Heading structure coming soon...
           </p>
        ) : (
          <>
            <p className="text-[11px] text-white/60 italic leading-relaxed">
              "What was your most focused session today?"
            </p>
            <GlassButton variant="pill" className="w-full justify-center text-[10px] py-2 mt-1">
              <PenTool className="w-3 h-3 shrink-0" />
              <span>Log Reflection</span>
            </GlassButton>
          </>
        )}
      </div>
    </DeckCard>
  );
}
