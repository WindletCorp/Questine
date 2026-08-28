"use client";

import { ChevronDown } from "lucide-react";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import styles from "../theme.module.css";

export interface DeckCardProps {
  position: 0 | 1 | 2 | 3;
  isExpanded?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  icon?: ReactNode;
  title: string;
  subtitleTop: string;
  subtitleBottom: string;
  headerElement?: ReactNode;
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
  children,
}: DeckCardProps) {
  const isFront = position === 0;

  return (
    <div 
      className={cn(styles.deckCard, styles.glassPanel, "p-4", styles[`pos${position}` as keyof typeof styles])}
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
                <span className="text-[9px] font-mono uppercase tracking-wider text-white/40">
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
