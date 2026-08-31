"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToastStore } from '@/lib/stores/toast-store';
import { X, AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

const icons = {
  info: <Info className="w-3.5 h-3.5 text-blue-400" />,
  success: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />,
  warning: <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />,
  error: <AlertCircle className="w-3.5 h-3.5 text-red-400" />,
};

const borders = {
  info: 'border-blue-500/20',
  success: 'border-emerald-500/20',
  warning: 'border-amber-500/20',
  error: 'border-red-500/30',
};

const glows = {
  info: 'shadow-[0_0_15px_rgba(59,130,246,0.1),inset_0_1px_1.5px_rgba(255,255,255,0.35),0_20px_50px_rgba(0,0,0,0.4)]',
  success: 'shadow-[0_0_15px_rgba(16,185,129,0.1),inset_0_1px_1.5px_rgba(255,255,255,0.35),0_20px_50px_rgba(0,0,0,0.4)]',
  warning: 'shadow-[0_0_15px_rgba(245,158,11,0.1),inset_0_1px_1.5px_rgba(255,255,255,0.35),0_20px_50px_rgba(0,0,0,0.4)]',
  error: 'shadow-[0_0_25px_rgba(239,68,68,0.15),inset_0_1px_1.5px_rgba(255,255,255,0.35),0_20px_50px_rgba(0,0,0,0.4)]',
};

export function Toaster() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed top-16 right-4 md:right-6 z-[100] flex flex-col gap-2 w-full max-w-[280px] pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            layout
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className={cn(
              "pointer-events-auto flex items-start gap-2.5 p-3 rounded-2xl relative overflow-hidden",
              borders[toast.type || 'info'],
              glows[toast.type || 'info']
            )}
            style={{
              background: "rgba(255, 255, 255, 0.08)",
              backdropFilter: "blur(32px) saturate(200%)",
              WebkitBackdropFilter: "blur(32px) saturate(200%)",
            }}
          >
            <div className="shrink-0 mt-0.5">
              {icons[toast.type || 'info']}
            </div>
            
            <div className="flex-1 flex flex-col gap-0.5">
              {toast.title && (
                <span className="text-[11px] font-semibold text-white/90">
                  {toast.title}
                </span>
              )}
              <span className="text-[10px] text-white/70 leading-relaxed">
                {toast.message}
              </span>
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
