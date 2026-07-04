"use client";

import React from "react";
import { BookOpen, Edit3 } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface JournalLogBubbleProps {
  id?: string;
  content: string;
  timestamp: string;
  className?: string;
}

export function JournalLogBubble({ id, content, timestamp, className }: JournalLogBubbleProps) {
  const date = new Date(timestamp);
  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  const timeStr = `${hours}:${minutes} ${ampm}`;

  return (
    <div 
      className={cn(
        "w-full bg-amber-50 border-4 border-amber-200 rounded-3xl p-6 relative group",
        "shadow-[4px_6px_0_0_#fde68a] hover:-translate-y-1 hover:shadow-[4px_8px_0_0_#fde68a] transition-all duration-200",
        className
      )}
    >
      <div className="flex items-center justify-between mb-4 border-b-2 border-amber-200/50 pb-2">
        <div className="flex items-center gap-2 text-amber-600 font-black tracking-wide uppercase text-sm">
          <BookOpen size={18} strokeWidth={3} />
          <span>Journal Entry</span>
        </div>
        <span className="text-xs font-bold text-amber-500/70">{timeStr}</span>
      </div>
      
      <p className="text-gray-800 font-bold text-lg leading-relaxed whitespace-pre-wrap">
        {content}
      </p>

      {id && (
        <Link 
          href={`/journal/${id}`}
          className="absolute -bottom-4 -right-2 bg-white border-4 border-amber-300 text-amber-500 w-12 h-12 rounded-full flex items-center justify-center shadow-sm hover:scale-110 active:scale-95 transition-transform"
          aria-label="Edit Entry"
        >
          <Edit3 size={20} strokeWidth={3} />
        </Link>
      )}
    </div>
  );
}
