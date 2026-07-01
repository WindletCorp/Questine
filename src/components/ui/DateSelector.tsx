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
  
  const [viewedWeekStart, setViewedWeekStart] = useState<Date>(getWeekStart(selectedDate));
  
  useEffect(() => {
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
      router.push(`?date=${dateStr}`);
    }
  };

  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(viewedWeekStart, i));
  const todayStr = formatDate(new Date());

  return (
    <div className="w-full flex flex-col items-center gap-3">
      <div className="flex items-center justify-between w-full max-w-sm px-4">
        <button 
          onClick={handlePrevWeek}
          className="p-2 rounded-xl bg-white border-2 border-gray-200 shadow-[0_4px_0_0_rgba(229,231,235,1)] hover:bg-gray-50 active:translate-y-1 active:shadow-none transition-all text-gray-500"
        >
          <ChevronLeft size={24} />
        </button>
        
        <h3 className="font-bold text-gray-700">
          {formatMonthYear(viewedWeekStart)}
        </h3>

        <button 
          onClick={handleNextWeek}
          className="p-2 rounded-xl bg-white border-2 border-gray-200 shadow-[0_4px_0_0_rgba(229,231,235,1)] hover:bg-gray-50 active:translate-y-1 active:shadow-none transition-all text-gray-500"
        >
          <ChevronRight size={24} />
        </button>
      </div>

      <div className="flex items-center justify-center gap-2 w-full max-w-sm">
        {weekDays.map(date => {
          const dateStr = formatDate(date);
          const isSelected = dateStr === selectedDate;
          const isToday = dateStr === todayStr;

          return (
            <button
              key={dateStr}
              onClick={() => handleDateClick(dateStr)}
              className={cn(
                "relative flex flex-col items-center justify-center w-12 h-16 rounded-2xl border-2 transition-all active:translate-y-1 active:shadow-none",
                isSelected 
                  ? "bg-blue-100 border-blue-300 shadow-[0_4px_0_0_rgba(147,197,253,1)] text-blue-900" 
                  : "bg-white border-gray-200 shadow-[0_4px_0_0_rgba(229,231,235,1)] text-gray-600 hover:bg-gray-50"
              )}
            >
              <span className={cn("text-xs font-bold mb-1 opacity-70", isSelected && "opacity-100")}>
                {formatDayShort(date)}
              </span>
              <span className="text-lg font-black leading-none">
                {formatDayNumber(date)}
              </span>
              {isToday && !isSelected && (
                <div className="absolute -bottom-1 w-2 h-2 rounded-full bg-blue-400" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
