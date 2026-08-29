"use client";

import { ChevronDown } from "lucide-react";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import styles from "../theme.module.css";

export type AccentColor = "blue" | "amber" | "purple" | "emerald";

const accentStyles: Record<AccentColor, { border: string; glow: string; label: string }> = {
  blue:    { border: "border-blue-400/25",    glow: "0 0 20px rgba(96,165,250,0.10)",   label: "text-blue-300/60" },
  amber:   { border: "border-amber-400/25",   glow: "0 0 20px rgba(251,191,36,0.10)",   label: "text-amber-300/60" },
  purple:  { border: "border-purple-400/25",  glow: "0 0 20px rgba(192,132,252,0.10)",  label: "text-purple-300/60" },
  emerald: { border: "border-emerald-400/25", glow: "0 0 20px rgba(52,211,153,0.10)",   label: "text-emerald-300/60" },
};

export interface DeckCardProps {
  position: 0 | 1 | 2 | 3;
  isExpanded?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  icon?: ReactNode;
  title: string;
  subtitleTop: string;
  subtitleBottom: string;
  headerElement?: ReactNode;
  accentColor?: AccentColor;
  children: ReactNode;
}

export function DeckCard({
  position,
  isExpanded = false,
  onClick,
  icon,
  title,
  subtitleTop,
  subtitleBottom,
  headerElement,
  accentColor,
  children,
}: DeckCardProps) {
  const isFront = position === 0;
  const accent = accentColor ? accentStyles[accentColor] : null;

  return (
    <div 
      className={cn(styles.deckCard, styles.glassPanel, "p-4", styles[`pos${position}` as keyof typeof styles], accent?.border)}
      style={accent ? { boxShadow: `0 20px 50px rgba(0,0,0,0.6), inset 0 1px 1.5px rgba(255,255,255,0.35), inset 0 -1px 1px rgba(0,0,0,0.25), ${accent.glow}` } : undefined}
      onClick={onClick}
    >
      <div className={cn("transition-opacity duration-350 ease-in-out", isFront ? "opacity-100" : "opacity-0 pointer-events-none")}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {headerElement ? (
              headerElement
            ) : (
              <div className="w-9 h-9 rounded-full bg-white/10 border border-white/15 flex items-center justify-center shrink-0">
                {icon}
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className={cn("text-[9px] font-mono uppercase tracking-wider", accent ? accent.label : "text-white/40")}>
                  {title}
                </span>
                <span className="text-[9px] text-white/30">•</span>
                <span className="text-[9px] text-white/50 font-mono">
                  {subtitleTop}
                </span>
              </div>
              <h2 className="text-xs font-semibold text-white truncate mt-0.5">
                {subtitleBottom}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <div
              style={{
                transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.3s ease'
              }}
            >
              <ChevronDown className="w-4 h-4 text-white/40" />
            </div>
          </div>
        </div>

        {/* Expandable Content (CSS Grid Technique) */}
        <div className={cn(styles.expandableGrid, "card-expandable", isExpanded && styles.expandableGridExpanded)}>
          <div className={styles.expandableInner}>
            <div className={cn("mt-3 pt-3 border-t border-white/10", styles.customGlassScroll)}>
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
