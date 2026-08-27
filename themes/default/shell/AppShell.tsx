"use client";

import React from 'react';
import type { AppShellProps } from '../../contract';
import { AnimatePresence } from 'framer-motion';

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
      {children}
    </div>
  );
}
