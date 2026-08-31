"use client";

import React, { useState, useMemo } from "react";
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface VisionOSTimeRangePickerProps {
  startTime: string; // YYYY-MM-DDTHH:mm
  endTime: string;   // YYYY-MM-DDTHH:mm
  onChangeStart: (time: string) => void;
  onChangeEnd: (time: string) => void;
}

const DURATIONS = [
  { label: "15m", mins: 15 },
  { label: "30m", mins: 30 },
  { label: "45m", mins: 45 },
  { label: "1h", mins: 60 },
  { label: "2h", mins: 120 },
] as const;

const MONTH_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

export function VisionOSTimeRangePicker({
  startTime,
  endTime,
  onChangeStart,
  onChangeEnd,
}: VisionOSTimeRangePickerProps) {
  // Independent Calendar popover state ("start" | "end" | null)
  const [openCalendar, setOpenCalendar] = useState<"start" | "end" | null>(null);
  const [calendarViewDate, setCalendarViewDate] = useState<Date>(() => new Date());

  // Parse Dates
  const parseParts = (iso: string) => {
    const d = new Date(iso);
    if (isNaN(d.getTime())) {
      const now = new Date();
      return { year: now.getFullYear(), month: now.getMonth(), day: now.getDate(), hours: now.getHours(), mins: now.getMinutes(), dateObj: now };
    }
    return { year: d.getFullYear(), month: d.getMonth(), day: d.getDate(), hours: d.getHours(), mins: d.getMinutes(), dateObj: d };
  };

  const startParts = parseParts(startTime);
  const endParts = parseParts(endTime);

  const pad = (n: number) => String(n).padStart(2, "0");

  const formatIso = (d: Date) => {
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  // Open calendar for specific target
  const handleOpenCalendar = (target: "start" | "end") => {
    if (openCalendar === target) {
      setOpenCalendar(null);
    } else {
      const targetDate = target === "start" ? startParts.dateObj : endParts.dateObj;
      setCalendarViewDate(new Date(targetDate));
      setOpenCalendar(target);
    }
  };

  // Select Date from Compact VisionOS Calendar
  const handleSelectDay = (day: number) => {
    if (openCalendar === "start") {
      const newStart = new Date(startParts.dateObj);
      newStart.setFullYear(calendarViewDate.getFullYear(), calendarViewDate.getMonth(), day);
      onChangeStart(formatIso(newStart));
    } else if (openCalendar === "end") {
      const newEnd = new Date(endParts.dateObj);
      newEnd.setFullYear(calendarViewDate.getFullYear(), calendarViewDate.getMonth(), day);
      onChangeEnd(formatIso(newEnd));
    }
    setOpenCalendar(null);
  };

  // Direct Typed Input for Start Hours (1-12)
  const handleTypeStartHour = (val: string) => {
    const num = parseInt(val, 10);
    if (isNaN(num)) return;
    const isPM = startParts.hours >= 12;
    let new24 = num % 12;
    if (isPM) new24 += 12;
    if (num === 12 && !isPM) new24 = 0;

    const d = new Date(startParts.dateObj);
    d.setHours(new24);
    onChangeStart(formatIso(d));
  };

  // Direct Typed Input for Start Minutes (0-59)
  const handleTypeStartMins = (val: string) => {
    const num = parseInt(val, 10);
    if (isNaN(num)) return;
    const clamped = Math.min(59, Math.max(0, num));
    const d = new Date(startParts.dateObj);
    d.setMinutes(clamped);
    onChangeStart(formatIso(d));
  };

  // Direct Typed Input for End Hours (1-12)
  const handleTypeEndHour = (val: string) => {
    const num = parseInt(val, 10);
    if (isNaN(num)) return;
    const isPM = endParts.hours >= 12;
    let new24 = num % 12;
    if (isPM) new24 += 12;
    if (num === 12 && !isPM) new24 = 0;

    const d = new Date(endParts.dateObj);
    d.setHours(new24);
    onChangeEnd(formatIso(d));
  };

  // Direct Typed Input for End Minutes (0-59)
  const handleTypeEndMins = (val: string) => {
    const num = parseInt(val, 10);
    if (isNaN(num)) return;
    const clamped = Math.min(59, Math.max(0, num));
    const d = new Date(endParts.dateObj);
    d.setMinutes(clamped);
    onChangeEnd(formatIso(d));
  };

  // Chevron Adjust Start Time
  const adjustStartTime = (deltaHours: number, deltaMins: number) => {
    const d = new Date(startParts.dateObj);
    d.setHours(d.getHours() + deltaHours);
    d.setMinutes(d.getMinutes() + deltaMins);
    onChangeStart(formatIso(d));
  };

  // Chevron Adjust End Time
  const adjustEndTime = (deltaHours: number, deltaMins: number) => {
    const d = new Date(endParts.dateObj);
    d.setHours(d.getHours() + deltaHours);
    d.setMinutes(d.getMinutes() + deltaMins);
    onChangeEnd(formatIso(d));
  };

  // Toggle AM/PM
  const toggleStartPeriod = () => {
    adjustStartTime(12, 0);
  };
  const toggleEndPeriod = () => {
    adjustEndTime(12, 0);
  };

  // Quick Duration Chip
  const setDuration = (mins: number) => {
    const newEnd = new Date(startParts.dateObj.getTime() + mins * 60 * 1000);
    onChangeEnd(formatIso(newEnd));
  };

  // 12h display
  const format12h = (hours: number, mins: number) => {
    const period = hours >= 12 ? "PM" : "AM";
    const h12 = hours % 12 === 0 ? 12 : hours % 12;
    return { h12: pad(h12), mins: pad(mins), period };
  };

  const start12 = format12h(startParts.hours, startParts.mins);
  const end12 = format12h(endParts.hours, endParts.mins);

  // Calendar Grid Days Calculation
  const calendarDays = useMemo(() => {
    const year = calendarViewDate.getFullYear();
    const month = calendarViewDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    return { firstDay, totalDays, year, month };
  }, [calendarViewDate]);

  const activeTargetParts = openCalendar === "start" ? startParts : endParts;

  return (
    <div className="flex flex-col gap-2.5 p-3 rounded-2xl bg-white/[0.05] border border-white/18 shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)] relative">
      {/* 2-Column Time Window Grid (Independent Starts & Ends with Dates) */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* START BOX (Date Pill + Time Dial) */}
        <div className="flex flex-col gap-1.5 p-2.5 rounded-xl bg-white/[0.04] border border-white/12">
          {/* Header with Date Chip */}
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-mono uppercase tracking-widest text-white/40">
              Starts
            </span>
            <button
              type="button"
              onClick={() => handleOpenCalendar("start")}
              className={cn(
                "px-2 py-0.5 rounded-lg text-[10px] font-mono border transition-all cursor-pointer active:scale-95",
                openCalendar === "start"
                  ? "bg-white text-black font-semibold border-white shadow-sm"
                  : "border-white/12 bg-white/[0.06] text-white/80 hover:text-white hover:border-white/30"
              )}
            >
              {startParts.dateObj.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
            </button>
          </div>

          {/* Time Dial & Typable Input */}
          <div className="flex items-center justify-between gap-1 pt-0.5">
            {/* Hours */}
            <div className="flex items-center gap-0.5">
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => adjustStartTime(1, 0)}
                  className="w-4 h-3.5 flex items-center justify-center text-white/40 hover:text-white cursor-pointer"
                >
                  <ChevronUp className="w-3 h-3" />
                </button>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={2}
                  value={start12.h12}
                  onChange={(e) => handleTypeStartHour(e.target.value)}
                  className="w-6 text-center text-sm font-bold font-mono text-white bg-transparent border-b border-transparent focus:border-white/60 focus:bg-white/[0.08] rounded outline-none py-0"
                />
                <button
                  type="button"
                  onClick={() => adjustStartTime(-1, 0)}
                  className="w-4 h-3.5 flex items-center justify-center text-white/40 hover:text-white cursor-pointer"
                >
                  <ChevronDown className="w-3 h-3" />
                </button>
              </div>

              <span className="text-white/40 font-bold text-xs">:</span>

              {/* Minutes */}
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => adjustStartTime(0, 15)}
                  className="w-4 h-3.5 flex items-center justify-center text-white/40 hover:text-white cursor-pointer"
                >
                  <ChevronUp className="w-3 h-3" />
                </button>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={2}
                  value={start12.mins}
                  onChange={(e) => handleTypeStartMins(e.target.value)}
                  className="w-6 text-center text-sm font-bold font-mono text-white bg-transparent border-b border-transparent focus:border-white/60 focus:bg-white/[0.08] rounded outline-none py-0"
                />
                <button
                  type="button"
                  onClick={() => adjustStartTime(0, -15)}
                  className="w-4 h-3.5 flex items-center justify-center text-white/40 hover:text-white cursor-pointer"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* AM / PM Toggle */}
            <button
              type="button"
              onClick={toggleStartPeriod}
              className="px-1.5 py-0.5 rounded-lg bg-white/[0.08] hover:bg-white/15 text-[9px] font-mono font-bold text-white tracking-wider border border-white/15 cursor-pointer active:scale-95"
            >
              {start12.period}
            </button>
          </div>
        </div>

        {/* END BOX (Date Pill + Time Dial) */}
        <div className="flex flex-col gap-1.5 p-2.5 rounded-xl bg-white/[0.04] border border-white/12">
          {/* Header with Date Chip */}
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-mono uppercase tracking-widest text-white/40">
              Ends
            </span>
            <button
              type="button"
              onClick={() => handleOpenCalendar("end")}
              className={cn(
                "px-2 py-0.5 rounded-lg text-[10px] font-mono border transition-all cursor-pointer active:scale-95",
                openCalendar === "end"
                  ? "bg-white text-black font-semibold border-white shadow-sm"
                  : "border-white/12 bg-white/[0.06] text-white/80 hover:text-white hover:border-white/30"
              )}
            >
              {endParts.dateObj.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
            </button>
          </div>

          {/* Time Dial & Typable Input */}
          <div className="flex items-center justify-between gap-1 pt-0.5">
            {/* Hours */}
            <div className="flex items-center gap-0.5">
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => adjustEndTime(1, 0)}
                  className="w-4 h-3.5 flex items-center justify-center text-white/40 hover:text-white cursor-pointer"
                >
                  <ChevronUp className="w-3 h-3" />
                </button>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={2}
                  value={end12.h12}
                  onChange={(e) => handleTypeEndHour(e.target.value)}
                  className="w-6 text-center text-sm font-bold font-mono text-white bg-transparent border-b border-transparent focus:border-white/60 focus:bg-white/[0.08] rounded outline-none py-0"
                />
                <button
                  type="button"
                  onClick={() => adjustEndTime(-1, 0)}
                  className="w-4 h-3.5 flex items-center justify-center text-white/40 hover:text-white cursor-pointer"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>

              <span className="text-white/40 font-bold text-xs">:</span>

              {/* Minutes */}
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => adjustEndTime(0, 15)}
                  className="w-4 h-3.5 flex items-center justify-center text-white/40 hover:text-white cursor-pointer"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={2}
                  value={end12.mins}
                  onChange={(e) => handleTypeEndMins(e.target.value)}
                  className="w-6 text-center text-sm font-bold font-mono text-white bg-transparent border-b border-transparent focus:border-white/60 focus:bg-white/[0.08] rounded outline-none py-0"
                />
                <button
                  type="button"
                  onClick={() => adjustEndTime(0, -15)}
                  className="w-4 h-3.5 flex items-center justify-center text-white/40 hover:text-white cursor-pointer"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* AM / PM Toggle */}
            <button
              type="button"
              onClick={toggleEndPeriod}
              className="px-1.5 py-0.5 rounded-lg bg-white/[0.08] hover:bg-white/15 text-[9px] font-mono font-bold text-white tracking-wider border border-white/15 cursor-pointer active:scale-95"
            >
              {end12.period}
            </button>
          </div>
        </div>
      </div>

      {/* Ultra-Compact VisionOS Glass Calendar Popover */}
      {openCalendar && (
        <>
          <div 
            className="fixed inset-0 z-40 bg-black/20" 
            onClick={() => setOpenCalendar(null)}
          />
          <div
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[240px] z-50 p-4 rounded-[28px] bg-white/[0.12] backdrop-blur-[50px] saturate-[210%] border border-white/30 shadow-[0_40px_100px_rgba(0,0,0,0.9),0_0_40px_rgba(255,255,255,0.15),inset_0_2px_4px_rgba(255,255,255,0.6),inset_0_-2px_4px_rgba(0,0,0,0.4)] flex flex-col gap-2.5 text-white select-none"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-mono font-semibold text-white/90">
                {MONTH_SHORT[calendarDays.month]} {calendarDays.year} ({openCalendar === "start" ? "Start" : "End"})
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    const prev = new Date(calendarViewDate);
                    prev.setMonth(prev.getMonth() - 1);
                    setCalendarViewDate(prev);
                  }}
                  className="w-5 h-5 rounded-md bg-white/[0.06] hover:bg-white/15 flex items-center justify-center text-white/70 hover:text-white cursor-pointer"
                >
                  <ChevronLeft className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const next = new Date(calendarViewDate);
                    next.setMonth(next.getMonth() + 1);
                    setCalendarViewDate(next);
                  }}
                  className="w-5 h-5 rounded-md bg-white/[0.06] hover:bg-white/15 flex items-center justify-center text-white/70 hover:text-white cursor-pointer"
                >
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Weekdays */}
            <div className="grid grid-cols-7 gap-1 text-center text-[9px] font-mono text-white/35 font-medium">
              {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                <div key={`${d}-${i}`}>{d}</div>
              ))}
            </div>

            {/* Compact Days Grid */}
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: calendarDays.firstDay }).map((_, i) => (
                <div key={`pad-${i}`} className="w-5 h-5" />
              ))}

              {Array.from({ length: calendarDays.totalDays }).map((_, i) => {
                const dayNum = i + 1;
                const isSelected =
                  activeTargetParts.day === dayNum &&
                  activeTargetParts.month === calendarDays.month &&
                  activeTargetParts.year === calendarDays.year;

                return (
                  <button
                    type="button"
                    key={dayNum}
                    onClick={() => handleSelectDay(dayNum)}
                    className={cn(
                      "w-5 h-5 rounded-lg text-[10px] font-mono font-medium flex items-center justify-center transition-all cursor-pointer",
                      isSelected
                        ? "bg-white text-black font-bold shadow-sm scale-105"
                        : "text-white/75 hover:bg-white/15 hover:text-white"
                    )}
                  >
                    {dayNum}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Quick Duration Chips */}
      <div className="flex items-center gap-1.5 pt-0.5 border-t border-white/10">
        <span className="text-[9px] font-mono text-white/35 uppercase mr-0.5">Span:</span>
        <div className="flex flex-wrap gap-1 flex-1">
          {DURATIONS.map((dur) => (
            <button
              type="button"
              key={dur.label}
              onClick={() => setDuration(dur.mins)}
              className="px-2 py-0.5 rounded-lg text-[9px] font-mono border border-white/10 bg-white/[0.03] text-white/60 hover:text-white hover:border-white/30 hover:bg-white/[0.08] transition-all cursor-pointer active:scale-95"
            >
              +{dur.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
