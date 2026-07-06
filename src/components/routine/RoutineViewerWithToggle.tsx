"use client";

import React, { useState } from "react";
import { RoutineViewer, RoutineBlock } from "./RoutineViewer";
import { cn } from "@/lib/utils";

interface Props {
  blocks: RoutineBlock[];
  viewDateStr: string;
  initialScrollTime?: string;
  defaultMode?: "plan" | "actual" | "overlay";
}

export function RoutineViewerWithToggle({ blocks, viewDateStr, initialScrollTime, defaultMode = "plan" }: Props) {
  const [mode, setMode] = useState<"plan" | "actual" | "overlay">(defaultMode);

  const hasPlan = blocks.some(b => b.type === "plan");
  const hasActual = blocks.some(b => b.type === "actual");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-center mb-4 mt-2 gap-3">
        <button
          onClick={() => setMode("plan")}
          disabled={!hasPlan}
          className={cn(
            "px-6 py-3 rounded-2xl font-black text-sm uppercase tracking-wider transition-all",
            mode === "plan" 
              ? "bg-blue-400 text-white shadow-[0_4px_0_0_#3b82f6] border-2 border-blue-400 transform -translate-y-1" 
              : "bg-white text-gray-400 border-2 border-gray-200 hover:bg-gray-50",
            !hasPlan && "opacity-50 cursor-not-allowed"
          )}
        >
          Plan
        </button>
        <button
          onClick={() => setMode("actual")}
          disabled={!hasActual}
          className={cn(
            "px-6 py-3 rounded-2xl font-black text-sm uppercase tracking-wider transition-all",
            mode === "actual" 
              ? "bg-pink-400 text-white shadow-[0_4px_0_0_#ec4899] border-2 border-pink-400 transform -translate-y-1" 
              : "bg-white text-gray-400 border-2 border-gray-200 hover:bg-gray-50",
            !hasActual && "opacity-50 cursor-not-allowed"
          )}
        >
          Actual
        </button>
        <button
          onClick={() => setMode("overlay")}
          disabled={!hasPlan || !hasActual}
          className={cn(
            "px-6 py-3 rounded-2xl font-black text-sm uppercase tracking-wider transition-all",
            mode === "overlay" 
              ? "bg-purple-400 text-white shadow-[0_4px_0_0_#a855f7] border-2 border-purple-400 transform -translate-y-1" 
              : "bg-white text-gray-400 border-2 border-gray-200 hover:bg-gray-50",
            (!hasPlan || !hasActual) && "opacity-50 cursor-not-allowed hover:translate-y-0 shadow-none"
          )}
        >
          Overlay
        </button>
      </div>
      <RoutineViewer
        blocks={blocks}
        viewDateStr={viewDateStr}
        viewMode={mode}
        readOnly={true}
        initialScrollTime={initialScrollTime}
      />
    </div>
  );
}
