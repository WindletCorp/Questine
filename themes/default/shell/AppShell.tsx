"use client";

import React from 'react';
import type { AppShellProps } from '../../contract';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, CheckSquare, Book, BarChart, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function LoadingState() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
    </div>
  );
}

const TABS = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Tasks', href: '/tasks', icon: CheckSquare },
  { name: 'Journal', href: '/journal', icon: Book },
  { name: 'Metrics', href: '/metrics', icon: BarChart },
  { name: 'Profile', href: '/profile', icon: User },
];

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background text-foreground">
      {/* Contextual Header */}
      <header className="sticky top-0 z-50 flex h-14 items-center border-b border-border bg-background/80 px-4 backdrop-blur-sm sm:ml-64">
        <h1 className="text-lg font-semibold capitalize">
          {pathname === '/' ? 'Dashboard' : pathname.split('/')[1] || 'Dashboard'}
        </h1>
      </header>

      {/* Main Content Area */}
      {/* Added sm:ml-64 to push content next to desktop sidebar */}
      <main className="flex-1 pb-16 overflow-x-hidden sm:ml-64 sm:pb-0">
        <AnimatePresence mode="wait">
          {children}
        </AnimatePresence>
      </main>

      {/* Bottom Tab Bar (Mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t border-border bg-background/80 pb-safe backdrop-blur-sm sm:hidden">
        {TABS.map((tab) => {
          const isActive = pathname.startsWith(tab.href);
          const Icon = tab.icon;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
              aria-label={tab.name}
            >
              <div className="relative flex flex-col items-center">
                <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                {isActive && (
                  <motion.div
                    layoutId="active-tab-mobile"
                    className="absolute -bottom-2 h-1 w-1 rounded-full bg-primary"
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  />
                )}
              </div>
              <span className="text-[10px] font-medium">{tab.name}</span>
            </Link>
          );
        })}
      </nav>
      
      {/* Sidebar (Desktop) */}
      <aside className="hidden sm:flex fixed left-0 top-0 bottom-0 w-64 flex-col border-r border-border bg-background/95 backdrop-blur z-50">
        <div className="h-14 flex items-center px-4 border-b border-border">
          <h2 className="text-xl font-bold">Questine</h2>
        </div>
        <div className="flex flex-col gap-2 p-4">
          {TABS.map((tab) => {
            const isActive = pathname.startsWith(tab.href);
            const Icon = tab.icon;

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`relative flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${
                  isActive ? 'text-primary font-medium' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
                aria-label={tab.name}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-tab-desktop"
                    className="absolute inset-0 rounded-lg bg-muted"
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  />
                )}
                <div className="relative z-10 flex items-center gap-3">
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                  <span>{tab.name}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </aside>
    </div>
  );
}
