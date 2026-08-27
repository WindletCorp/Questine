"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

interface GlassSphereProps {
  isActive?: boolean;
  onClick?: () => void;
}

export function GlassSphere({ isActive = false, onClick }: GlassSphereProps) {
  // Framer Motion variants replacing CSS keyframes
  const variants = {
    standby: {
      scale: [1, 1.05, 1],
      boxShadow: [
        "0 30px 80px rgba(0, 0, 0, 0.8), 0 0 15px rgba(255, 255, 255, 0.06), inset 0 3px 10px rgba(255, 255, 255, 0.7)",
        "0 40px 100px rgba(0, 0, 0, 0.9), 0 0 45px rgba(255, 255, 255, 0.25), inset 0 4px 14px rgba(255, 255, 255, 0.85)",
        "0 30px 80px rgba(0, 0, 0, 0.8), 0 0 15px rgba(255, 255, 255, 0.06), inset 0 3px 10px rgba(255, 255, 255, 0.7)"
      ],
      transition: {
        duration: 3.6 * 2, // cycle duration
        ease: "easeInOut",
        repeat: Infinity,
      }
    },
    active: {
      scale: [1.15, 1.22, 1.15],
      boxShadow: [
        "0 0 100px rgba(255, 255, 255, 0.35), 0 45px 110px rgba(0, 0, 0, 0.9), inset 0 4px 16px rgba(255, 255, 255, 0.95)",
        "0 0 120px rgba(255, 255, 255, 0.45), 0 55px 120px rgba(0, 0, 0, 1), inset 0 6px 20px rgba(255, 255, 255, 1)",
        "0 0 100px rgba(255, 255, 255, 0.35), 0 45px 110px rgba(0, 0, 0, 0.9), inset 0 4px 16px rgba(255, 255, 255, 0.95)"
      ],
      borderColor: "rgba(255, 255, 255, 0.75)",
      backgroundColor: "rgba(255, 255, 255, 0.16)",
      transition: {
        duration: 2.2 * 2,
        ease: "easeInOut",
        repeat: Infinity,
      }
    }
  };

  return (
    <div className="relative w-[210px] h-[210px] flex items-center justify-center shrink-0">
      <motion.button
        onClick={onClick}
        aria-label="Activate Core Entry Mode"
        variants={variants}
        animate={isActive ? "active" : "standby"}
        whileHover={{
          scale: isActive ? 1.25 : 1.1,
          backgroundColor: isActive ? "rgba(255, 255, 255, 0.2)" : "rgba(255, 255, 255, 0.15)",
          borderColor: isActive ? "rgba(255, 255, 255, 0.85)" : "rgba(255, 255, 255, 0.5)",
          boxShadow: "0 40px 100px rgba(0, 0, 0, 0.9), 0 0 50px rgba(255, 255, 255, 0.25), inset 0 4px 14px rgba(255, 255, 255, 0.9)"
        }}
        className="w-full h-full rounded-full flex items-center justify-center relative z-10 cursor-pointer"
        style={{
          background: "rgba(255, 255, 255, 0.08)",
          backdropFilter: "blur(44px) saturate(210%)",
          WebkitBackdropFilter: "blur(44px) saturate(210%)",
          border: "1.5px solid rgba(255, 255, 255, 0.28)",
        }}
      >
        <Sparkles className="w-14 h-14 text-white/95 drop-shadow-[0_0_24px_rgba(255,255,255,0.9)]" />
      </motion.button>
    </div>
  );
}
