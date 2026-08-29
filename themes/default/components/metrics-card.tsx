"use client";

import { useState } from "react";
import { DeckCard } from "./deck-card";
import { BarChart2 } from "lucide-react";
import { GlassButton } from "./glass-button";

interface Metric {
  id: string;
  name: string;
  target: number;
  current: number;
  unit: string;
  step: number;
}

export function MetricsCard({ 
  position = 2, 
  isExpanded = false, 
  onClick 
}: { 
  position?: 0 | 1 | 2 | 3; 
  isExpanded?: boolean; 
  onClick?: (e: React.MouseEvent) => void; 
}) {
  const [metrics, setMetrics] = useState<Metric[]>([
    { id: "m1", name: "Pushups", target: 50, current: 35, unit: "", step: 5 },
    { id: "m2", name: "Water", target: 2.5, current: 1.5, unit: "L", step: 0.25 },
    { id: "m3", name: "Deep Focus", target: 4, current: 2, unit: "sessions", step: 1 }
  ]);

  const updateMetric = (id: string, delta: number) => {
    setMetrics(metrics.map(m => {
      if (m.id === id) {
        const newVal = Math.max(0, m.current + delta);
        return { ...m, current: newVal };
      }
      return m;
    }));
  };

  return (
    <DeckCard
      position={position}
      isExpanded={isExpanded}
      onClick={onClick}
      icon={<BarChart2 className="w-4 h-4 text-white/80" />}
      title="Metrics"
      subtitleTop="Active"
      subtitleBottom="Daily Targets & Tracking"
      accentColor="purple"
    >
      <div className="space-y-2.5 pt-1">
        {metrics.map(metric => {
          const progressPercent = Math.min(100, (metric.current / metric.target) * 100);
          
          return (
            <div key={metric.id} className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-medium text-white/90">{metric.name}</span>
                  <span className="text-[9px] font-mono text-white/40 ml-1.5">
                    / {metric.target} {metric.unit} target
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-white font-semibold">
                    {metric.current} {metric.unit && (metric.unit !== "sessions" ? metric.unit : "")}
                  </span>
                  <div className="flex items-center gap-1">
                    <GlassButton variant="step" onClick={(e: any) => { e.stopPropagation(); updateMetric(metric.id, -metric.step); }}>-</GlassButton>
                    <GlassButton variant="step" onClick={(e: any) => { e.stopPropagation(); updateMetric(metric.id, metric.step); }}>+</GlassButton>
                  </div>
                </div>
              </div>
              <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden">
                <div 
                  className="bg-white/80 h-full rounded-full transition-all duration-300" 
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
            </div>
          );
        })}
        
        <GlassButton variant="pill" className="w-full justify-center py-2 text-[10px] mt-1 border-dashed">
          + Add Metric
        </GlassButton>
      </div>
    </DeckCard>
  );
}
