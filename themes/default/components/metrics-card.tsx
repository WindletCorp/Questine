"use client";

import { useState } from "react";
import { DeckCard } from "./deck-card";
import { BarChart2 } from "lucide-react";
import { GlassButton } from "./glass-button";
import type { EnrichedMetricEntry } from "@/lib/db/types";

export function MetricsCard({ 
  position = 2, 
  isExpanded = false, 
  onClick,
  metric
}: { 
  position?: 0 | 1 | 2 | 3; 
  isExpanded?: boolean; 
  onClick?: (e: React.MouseEvent) => void;
  metric?: EnrichedMetricEntry;
}) {
  return (
    <DeckCard
      position={position}
      isExpanded={isExpanded}
      onClick={onClick}
      icon={<BarChart2 className="w-4 h-4 text-white/80" />}
      title="Latest Metric"
      subtitleTop={metric ? metric.definition.name : "No Data"}
      subtitleBottom={metric ? "Today's Log" : "Track something"}
      accentColor="purple"
    >
      <div className="space-y-2.5 pt-1">
        {metric ? (
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-medium text-white/90">{metric.definition.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-white font-semibold">
                  {metric.value} {metric.definition.unit || ""}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-[11px] text-white/60 leading-relaxed italic">
            You haven't logged any metrics today.
          </p>
        )}
      </div>
    </DeckCard>
  );
}
