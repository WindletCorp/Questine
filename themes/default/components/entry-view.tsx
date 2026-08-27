"use client";

import { motion } from "framer-motion";
import { Mic, ArrowUp } from "lucide-react";
import { GlassButton } from "./glass-button";

interface EntryViewProps {
  isActive: boolean;
  onClose: () => void;
}

export function EntryView({ isActive, onClose }: EntryViewProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.95 }}
      animate={isActive ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 12, scale: 0.95 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={`absolute top-0 left-0 right-0 z-60 w-full p-4 rounded-[22px] border border-white/16 shadow-[0_20px_50px_rgba(0,0,0,0.6),inset_0_1px_1.5px_rgba(255,255,255,0.35),inset_0_-1px_1px_rgba(0,0,0,0.25)] ${isActive ? "pointer-events-auto" : "pointer-events-none"}`}
      style={{
        background: "rgba(255, 255, 255, 0.07)",
        backdropFilter: "blur(28px) saturate(190%)",
        WebkitBackdropFilter: "blur(28px) saturate(190%)",
      }}
    >
      <div className="flex items-center justify-between w-full mb-3 px-1">
        <div className="flex items-center gap-2">
          <div className="waveform-container">
            <div className="waveform-bar" />
            <div className="waveform-bar" />
            <div className="waveform-bar" />
            <div className="waveform-bar" />
            <div className="waveform-bar" />
          </div>
          <span className="text-[10px] font-mono text-white/50 animate-pulse">Listening...</span>
        </div>
        
        <GlassButton variant="circle" onClick={onClose} className="w-6 h-6 border-transparent bg-transparent shadow-none text-white/40 hover:text-white/80">
          <span className="text-xs">✕</span>
        </GlassButton>
      </div>

      <form className="w-full" onSubmit={(e) => e.preventDefault()}>
        <div 
          className="flex items-center px-3.5 py-2 w-full rounded-full border border-white/20 bg-white/10 shadow-[0_16px_48px_rgba(0,0,0,0.6),inset_0_1px_2px_rgba(255,255,255,0.45)]"
          style={{ backdropFilter: "blur(32px) saturate(200%)" }}
        >
          <Mic className="w-3.5 h-3.5 text-white/50 mr-2 shrink-0" />
          <input 
            type="text" 
            placeholder="Type command, task, or thought..." 
            className="bg-transparent border-none outline-none text-[13px] text-white placeholder:text-white/35 w-full font-medium"
            autoComplete="off"
          />
          <button 
            type="submit" 
            className="ml-2 w-7 h-7 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shrink-0 text-black transition-colors"
            aria-label="Submit Entry"
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>
    </motion.div>
  );
}
