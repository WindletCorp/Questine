"use client";

import React from 'react';
import type { AppShellProps } from '../../contract';
import { AnimatePresence } from 'framer-motion';
import { Toaster } from '../components/toaster';
import { GlobalHeader } from '../components/global-header';

export function LoadingState() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
    </div>
  );
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-background text-foreground overflow-hidden relative w-full">
      {/* Global Background Dot Mesh Grid */}
      <div className="bg-dot-mesh fixed inset-0 pointer-events-none -z-20" />

      {/* Global Atmospheric Luminous Aura (Base) */}
      <div className="fixed inset-0 pointer-events-none -z-10 flex items-center justify-center">
        <div
          className="rounded-full transition-all duration-1000 ease-out"
          style={{
            width: "540px",
            height: "540px",
            background: "radial-gradient(circle, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.05) 35%, rgba(255, 255, 255, 0.01) 60%, transparent 80%)",
          }}
        />
      </div>

      <GlobalHeader />
      <Toaster />
      {children}
    </div>
  );
}
