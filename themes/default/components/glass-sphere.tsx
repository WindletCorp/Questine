"use client";

import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import styles from "../theme.module.css";

interface GlassSphereProps {
  isActive?: boolean;
  onClick?: () => void;
}

export function GlassSphere({ isActive = false, onClick }: GlassSphereProps) {
  return (
    <div className={styles.glassSphereWrapper}>
      <motion.div
        animate={{ scale: isActive ? 1.18 : 1 }}
        transition={{ type: "spring", stiffness: 100, damping: 20, mass: 1.2 }}
        className="w-full h-full flex items-center justify-center"
      >
        <button
          type="button"
          onClick={onClick}
          aria-label="Activate Core Entry Mode"
          className={cn(
            styles.glassSphere,
            "group overflow-hidden",
            isActive && styles.glassSphereActive
          )}
        >
          {/* Specular Top Reflection / Lens Glare */}
          <div
            className="absolute top-2.5 left-6 right-6 h-1/3 rounded-full pointer-events-none transition-opacity duration-700"
            style={{
              background: "radial-gradient(ellipse at 50% 0%, rgba(255, 255, 255, 0.45) 0%, rgba(255, 255, 255, 0.12) 45%, transparent 75%)",
              filter: "blur(2px)",
              opacity: isActive ? 0.9 : 0.65,
            }}
          />

          {/* Ambient Ring Highlight */}
          <div
            className="absolute inset-2 rounded-full border border-white/10 pointer-events-none transition-all duration-700"
            style={{
              boxShadow: isActive ? "inset 0 0 20px rgba(255,255,255,0.25)" : "inset 0 0 10px rgba(255,255,255,0.08)"
            }}
          />

          <Sparkles
            className={cn(
              "text-white/95 transition-all duration-700 relative z-10",
              isActive
                ? "w-16 h-16 sm:w-18 sm:h-18 drop-shadow-[0_0_36px_rgba(255,255,255,1)] scale-110"
                : "w-14 h-14 sm:w-16 sm:h-16 drop-shadow-[0_0_24px_rgba(255,255,255,0.9)] group-hover:scale-108 group-hover:drop-shadow-[0_0_32px_rgba(255,255,255,1)]"
            )}
          />
        </button>
      </motion.div>
    </div>
  );
}
