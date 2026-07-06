'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface DateSelectorProps {
  selectedDate: string; // YYYY-MM-DD
}

const getWeekStart = (dateStr: string) => {
  // Parsing date from 'YYYY-MM-DD' avoiding timezone offset issues
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const dayOfWeek = date.getDay();
  const diff = date.getDate() - dayOfWeek; // Adjust to Sunday
  return new Date(date.setDate(diff));
};

const addDays = (date: Date, days: number) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const formatDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDayShort = (date: Date) => {
  return date.toLocaleDateString('en-US', { weekday: 'narrow' });
};

const formatDayNumber = (date: Date) => {
  return date.getDate().toString();
};

const formatMonthYear = (date: Date) => {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

export function DateSelector({ selectedDate }: DateSelectorProps) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();
  const [pendingDateStr, setPendingDateStr] = useState<string | null>(null);
  
  const [viewedWeekStart, setViewedWeekStart] = useState<Date>(getWeekStart(selectedDate));
  
  useEffect(() => {
    setPendingDateStr(null);
    const selectedWeekStart = getWeekStart(selectedDate);
    if (formatDate(viewedWeekStart) !== formatDate(selectedWeekStart)) {
      setViewedWeekStart(selectedWeekStart);
    }
  }, [selectedDate]);

  const handlePrevWeek = () => {
    setViewedWeekStart(prev => addDays(prev, -7));
  };

  const handleNextWeek = () => {
    setViewedWeekStart(prev => addDays(prev, 7));
  };

  const handleDateClick = (dateStr: string) => {
    if (dateStr !== selectedDate) {
      setPendingDateStr(dateStr);
      startTransition(() => {
        // We use scroll: false to prevent jumping to top on query param change
        router.push(`?date=${dateStr}`, { scroll: false });
      });
    }
  };

  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(viewedWeekStart, i));
  const todayStr = formatDate(new Date());

  return (
    <div className="w-full flex flex-col items-center gap-3">
      <div className="flex items-center justify-between w-full max-w-sm px-4">
        <button 
          onClick={handlePrevWeek}
          disabled={isPending}
          className="p-2 rounded-xl bg-white border-2 border-gray-200 shadow-[0_4px_0_0_rgba(229,231,235,1)] hover:bg-gray-50 active:translate-y-1 active:shadow-none transition-all text-gray-500 disabled:opacity-50"
        >
          <ChevronLeft size={24} />
        </button>
        
        <h3 className="font-bold text-gray-700">
          {formatMonthYear(viewedWeekStart)}
        </h3>

        <button 
          onClick={handleNextWeek}
          disabled={isPending}
          className="p-2 rounded-xl bg-white border-2 border-gray-200 shadow-[0_4px_0_0_rgba(229,231,235,1)] hover:bg-gray-50 active:translate-y-1 active:shadow-none transition-all text-gray-500 disabled:opacity-50"
        >
          <ChevronRight size={24} />
        </button>
      </div>

      <div className="flex items-center justify-center gap-2 w-full max-w-sm">
        {weekDays.map(date => {
          const dateStr = formatDate(date);
          const isSelected = dateStr === selectedDate;
          const isToday = dateStr === todayStr;
          const isThisPending = isPending && pendingDateStr === dateStr;

          return (
            <button
              key={dateStr}
              onClick={() => handleDateClick(dateStr)}
              disabled={isPending}
              className={cn(
                "relative flex flex-col items-center justify-center w-12 h-16 rounded-2xl border-2 transition-all active:translate-y-1 active:shadow-none",
                isSelected 
                  ? "bg-blue-100 border-blue-300 shadow-[0_4px_0_0_rgba(147,197,253,1)] text-blue-900" 
                  : "bg-white border-gray-200 shadow-[0_4px_0_0_rgba(229,231,235,1)] text-gray-600 hover:bg-gray-50",
                isPending && !isThisPending && "opacity-50"
              )}
            >
              <span className={cn("text-xs font-bold mb-1 opacity-70", isSelected && "opacity-100")}>
                {formatDayShort(date)}
              </span>
              
              {isThisPending ? (
                <div className="flex items-center gap-0.5 mt-0.5">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '-0.3s' }}></div>
                  <div className="w-1.5 h-1.5 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '-0.15s' }}></div>
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce"></div>
                </div>
              ) : (
                <span className="text-lg font-black leading-none">
                  {formatDayNumber(date)}
                </span>
              )}
              
              {isToday && !isSelected && !isThisPending && (
                <div className="absolute -bottom-1 w-2 h-2 rounded-full bg-blue-400" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
