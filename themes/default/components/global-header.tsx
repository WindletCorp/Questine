"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { LayoutDashboard } from "lucide-react";
import { GlassButton } from "./glass-button";
import { usePathname } from "next/navigation";
import { ProfileMenu } from "./profile-menu";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Good morning";
  if (hour >= 12 && hour < 17) return "Good afternoon";
  if (hour >= 17 && hour < 21) return "Good evening";
  return "Good night";
}

export function GlobalHeader() {
  const [greeting, setGreeting] = useState<string | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    setGreeting(getGreeting());
  }, []);

  return (
    <header className="w-full max-w-5xl mx-auto px-4 md:px-6 pt-4 pb-2 flex justify-between items-center z-50 shrink-0">
      <div className="flex flex-col">
        <span className="text-[10px] font-semibold tracking-widest uppercase text-white/40 font-mono">
          Questine OS
        </span>
        {pathname === "/" && (
          <span className="text-xs font-medium text-white/75 mt-0.5">{greeting ?? "\u00A0"}</span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {pathname === "/" && (
          <Link href="/dashboard" aria-label="Open Full Dashboard">
            <GlassButton variant="pill" className="gap-1.5 py-1 px-3">
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span className="text-[11px] font-medium">Dashboard</span>
            </GlassButton>
          </Link>
        )}
        
        <ProfileMenu />
      </div>
    </header>
  );
}
