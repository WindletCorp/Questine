"use client";

import React, { useState } from "react";
import { User, RotateCw, RefreshCw, Settings2 } from "lucide-react";
import { GlassButton } from "./glass-button";
import { SyncEngine } from "@/lib/sync/engine";
import { motion, AnimatePresence } from "framer-motion";
import styles from "../theme.module.css";
import { cn } from "@/lib/utils";

export function ProfileMenu() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleProfileSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      await SyncEngine.fullSync();
    } finally {
      setTimeout(() => setIsSyncing(false), 500);
    }
  };

  const handleMenuAction = (action: "sync" | "settings") => {
    setIsMenuOpen(false);
    if (action === "sync") {
      handleProfileSync();
    } else if (action === "settings") {
      // Handle settings
    }
  };

  return (
    <div className="relative">
      <GlassButton 
        variant="profile" 
        aria-label="User Profile Menu" 
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="relative group"
      >
        <User className="w-4 h-4 stroke-[1.5] text-white/80 group-hover:text-white transition-colors" />
        
        {/* Corner Refresh Icon Badge (Only show when syncing) */}
        {isSyncing && (
          <div className="absolute -top-1 -right-1 w-[18px] h-[18px] rounded-full bg-black/75 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-md">
            <RotateCw className="w-2.5 h-2.5 text-white/70 animate-spin stroke-[1.5]" />
          </div>
        )}

        {/* VisionOS Specular Luminous Sync Aura - Subtle Radiating Gradient */}
        {isSyncing && (
          <div className="absolute inset-[-4px] rounded-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.15)_0%,transparent_100%)] animate-ping pointer-events-none" />
        )}
      </GlassButton>

      {/* Profile Context Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsMenuOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -5 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -5 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className={cn(
                styles.glassPanel,
                "absolute top-[calc(100%+8px)] right-0 z-50 w-44 p-1.5 flex flex-col origin-top-right rounded-[20px]"
              )}
            >
              <button
                onClick={() => handleMenuAction("sync")}
                className="flex items-center gap-3 px-3 py-2.5 w-full rounded-[14px] hover:bg-white/10 text-white/80 hover:text-white transition-all text-[11px] font-medium"
              >
                <RefreshCw className="w-3.5 h-3.5 stroke-[1.5]" />
                <span>Sync Data</span>
              </button>
              <button
                onClick={() => handleMenuAction("settings")}
                className="flex items-center gap-3 px-3 py-2.5 w-full rounded-[14px] hover:bg-white/10 text-white/80 hover:text-white transition-all text-[11px] font-medium"
              >
                <Settings2 className="w-3.5 h-3.5 stroke-[1.5]" />
                <span>Preferences</span>
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
