"use client";

import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface GlassSphereProps {
  isActive?: boolean;
  onClick?: () => void;
}

export function GlassSphere({ isActive = false, onClick }: GlassSphereProps) {
  return (
    <div className="glass-sphere-wrapper">
      <button
        type="button"
        onClick={onClick}
        aria-label="Activate Core Entry Mode"
        className={cn(
          "glass-sphere group",
          isActive && "is-active"
        )}
      >
        <Sparkles 
          className={cn(
            "text-white/95 transition-all duration-500",
            isActive 
              ? "w-16 h-16 drop-shadow-[0_0_32px_rgba(255,255,255,1)] scale-110" 
              : "w-14 h-14 drop-shadow-[0_0_24px_rgba(255,255,255,0.9)] group-hover:scale-105 group-hover:drop-shadow-[0_0_30px_rgba(255,255,255,1)]"
          )} 
        />
      </button>
    </div>
  );
}
