"use client";

import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";

interface ChunkyDatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function ChunkyDatePicker({ value, onChange, disabled }: ChunkyDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Parse current value or use today
  const initialDate = value ? new Date(value) : new Date();
  const [viewedDate, setViewedDate] = useState(initialDate);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const year = viewedDate.getFullYear();
  const month = viewedDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewedDate(new Date(year, month - 1, 1));
  };
  
  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewedDate(new Date(year, month + 1, 1));
  };

  const handleSelectDate = (d: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const formattedMonth = String(month + 1).padStart(2, '0');
    const formattedDay = String(d).padStart(2, '0');
    onChange(`${year}-${formattedMonth}-${formattedDay}`);
    setIsOpen(false);
  };

  // Format display value
  const displayVal = value ? new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "Select Date";

  return (
    <div className="relative w-full" ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between bg-white border-4 border-gray-200 rounded-2xl px-4 py-3 text-sm font-black text-gray-700",
          "hover:bg-gray-50 active:translate-y-1 active:border-b-4 transition-all shadow-[0_4px_0_0_#e5e7eb] active:shadow-none",
          disabled && "opacity-50 cursor-not-allowed pointer-events-none"
        )}
      >
        <span className="truncate">{displayVal}</span>
        <CalendarIcon size={18} strokeWidth={3} className={cn("transition-colors text-gray-400", isOpen && "text-amber-500")} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-white border-4 border-gray-200 rounded-3xl shadow-[0_8px_0_0_#e5e7eb] p-4 flex flex-col gap-4 min-w-[280px]">
          <div className="flex items-center justify-between">
            <button type="button" onClick={handlePrevMonth} className="p-2 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 active:translate-y-1 transition-all"><ChevronLeft size={16} strokeWidth={3}/></button>
            <span className="font-black text-gray-800">{monthNames[month]} {year}</span>
            <button type="button" onClick={handleNextMonth} className="p-2 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 active:translate-y-1 transition-all"><ChevronRight size={16} strokeWidth={3}/></button>
          </div>
          
          <div className="grid grid-cols-7 gap-1 text-center">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(d => (
              <div key={d} className="text-[10px] font-bold text-gray-400 uppercase">{d}</div>
            ))}
            {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const d = i + 1;
              const isSelected = value === `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
              
              return (
                <button
                  key={d}
                  type="button"
                  onClick={(e) => handleSelectDate(d, e)}
                  className={cn(
                    "h-8 rounded-xl font-black text-sm flex items-center justify-center transition-all hover:bg-gray-100 hover:scale-110",
                    isSelected ? "bg-amber-100 text-amber-600 border-2 border-amber-300 shadow-[0_2px_0_0_#fcd34d]" : "text-gray-700 bg-transparent"
                  )}
                >
                  {d}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
