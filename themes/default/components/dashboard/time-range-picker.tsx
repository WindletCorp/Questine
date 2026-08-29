"use client";

import React, { useMemo, useState } from "react";
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

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export function VisionOSTimeRangePicker({
  startTime,
  endTime,
  onChangeStart,
  onChangeEnd,
}: VisionOSTimeRangePickerProps) {
  // VisionOS Mini Calendar Dropdown state
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calendarViewDate, setCalendarViewDate] = useState(() => {
    const d = new Date(startTime);
    return isNaN(d.getTime()) ? new Date() : d;
  });

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

  // Select Date from VisionOS Calendar Grid
  const handleSelectCalendarDay = (day: number) => {
    const newStart = new Date(startParts.dateObj);
    newStart.setFullYear(calendarViewDate.getFullYear(), calendarViewDate.getMonth(), day);

    const newEnd = new Date(endParts.dateObj);
    newEnd.setFullYear(calendarViewDate.getFullYear(), calendarViewDate.getMonth(), day);

    onChangeStart(formatIso(newStart));
    onChangeEnd(formatIso(newEnd));
    setIsCalendarOpen(false);
  };

  // Quick Day Setters
  const setQuickDay = (dayOffset: number) => {
    const now = new Date();
    const target = new Date(now.getFullYear(), now.getMonth(), now.getDate() + dayOffset);

    const newStart = new Date(startParts.dateObj);
    newStart.setFullYear(target.getFullYear(), target.getMonth(), target.getDate());

    const newEnd = new Date(endParts.dateObj);
    newEnd.setFullYear(target.getFullYear(), target.getMonth(), target.getDate());

    onChangeStart(formatIso(newStart));
    onChangeEnd(formatIso(newEnd));
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

  const isToday = startParts.dateObj.toDateString() === new Date().toDateString();
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const isTomorrow = startParts.dateObj.toDateString() === tomorrowDate.toDateString();

  // Calendar Grid Days Calculation
  const calendarDays = useMemo(() => {
    const year = calendarViewDate.getFullYear();
    const month = calendarViewDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    return { firstDay, totalDays, year, month };
  }, [calendarViewDate]);

  return (
    <div className="flex flex-col gap-3 p-3.5 rounded-2xl bg-white/[0.05] border border-white/18 shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)] relative">
      {/* Date Header with VisionOS Glass Popover Trigger */}
      <div className="flex items-center justify-between text-[11px] font-mono tracking-wider uppercase text-white/60 pb-2 border-b border-white/10">
        {/* Clickable Custom VisionOS Date Trigger */}
        <button
          type="button"
          onClick={() => setIsCalendarOpen((prev) => !prev)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-white transition-all cursor-pointer shadow-sm active:scale-97",
            isCalendarOpen
              ? "bg-white/25 border-white/60 shadow-[0_0_15px_rgba(255,255,255,0.2)]"
              : "bg-white/[0.08] border-white/20 hover:border-white/40 hover:bg-white/[0.14]"
          )}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-white/70 shadow-[0_0_6px_rgba(255,255,255,0.8)]" />
          <span className="font-semibold text-xs font-sans tracking-normal">
            {startParts.dateObj.toLocaleDateString(undefined, {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}
          </span>
        </button>

        {/* Quick Date Chips */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setQuickDay(0)}
            className={cn(
              "px-2.5 py-1 rounded-xl text-[10px] font-semibold border transition-all cursor-pointer active:scale-95",
              isToday
                ? "bg-white text-black border-white shadow-sm"
                : "border-white/10 bg-white/[0.04] text-white/60 hover:text-white hover:bg-white/[0.08]"
            )}
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => setQuickDay(1)}
            className={cn(
              "px-2.5 py-1 rounded-xl text-[10px] font-semibold border transition-all cursor-pointer active:scale-95",
              isTomorrow
                ? "bg-white text-black border-white shadow-sm"
                : "border-white/10 bg-white/[0.04] text-white/60 hover:text-white hover:bg-white/[0.08]"
            )}
          >
            Tomorrow
          </button>
        </div>
      </div>

      {/* VisionOS Native Glass Calendar Grid Popover */}
      <AnimatePresence>
        {isCalendarOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -6 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className="p-3.5 rounded-2xl bg-black/85 backdrop-blur-[50px] saturate-[210%] border border-white/25 shadow-[0_30px_90px_rgba(0,0,0,0.9),inset_0_2px_3px_rgba(255,255,255,0.4)] flex flex-col gap-2.5 z-50 text-white select-none"
          >
            {/* Month & Navigation Header */}
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-semibold tracking-wide text-white/90">
                {MONTH_NAMES[calendarDays.month]} {calendarDays.year}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    const prev = new Date(calendarViewDate);
                    prev.setMonth(prev.getMonth() - 1);
                    setCalendarViewDate(prev);
                  }}
                  className="w-6 h-6 rounded-lg bg-white/[0.06] hover:bg-white/15 flex items-center justify-center text-white/70 hover:text-white transition-all cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const next = new Date(calendarViewDate);
                    next.setMonth(next.getMonth() + 1);
                    setCalendarViewDate(next);
                  }}
                  className="w-6 h-6 rounded-lg bg-white/[0.06] hover:bg-white/15 flex items-center justify-center text-white/70 hover:text-white transition-all cursor-pointer"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Days of Week Header */}
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-mono text-white/35 font-semibold">
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                <div key={d} className="py-0.5">{d}</div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Empty padding days */}
              {Array.from({ length: calendarDays.firstDay }).map((_, i) => (
                <div key={`empty-${i}`} className="w-7 h-7" />
              ))}

              {/* Month Days */}
              {Array.from({ length: calendarDays.totalDays }).map((_, i) => {
                const dayNum = i + 1;
                const isSelected =
                  startParts.day === dayNum &&
                  startParts.month === calendarDays.month &&
                  startParts.year === calendarDays.year;

                return (
                  <button
                    type="button"
                    key={dayNum}
                    onClick={() => handleSelectCalendarDay(dayNum)}
                    className={cn(
                      "w-7 h-7 rounded-xl text-xs font-semibold flex items-center justify-center transition-all cursor-pointer",
                      isSelected
                        ? "bg-white text-black font-bold shadow-[0_0_12px_rgba(255,255,255,0.7)] scale-105"
                        : "text-white/80 hover:bg-white/15 hover:text-white"
                    )}
                  >
                    {dayNum}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Typable VisionOS Time Spinners Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Start Time Dial & Typable Input */}
        <div className="flex flex-col gap-1 p-2.5 rounded-xl bg-white/[0.04] border border-white/12">
          <span className="text-[9px] font-mono uppercase tracking-widest text-white/40 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
            Starts At
          </span>
          <div className="flex items-center justify-between gap-1 pt-1">
            {/* Hours Typable + Chevrons */}
            <div className="flex items-center gap-1">
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => adjustStartTime(1, 0)}
                  className="w-5 h-4 flex items-center justify-center text-white/40 hover:text-white cursor-pointer"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={2}
                  value={start12.h12}
                  onChange={(e) => handleTypeStartHour(e.target.value)}
                  className="w-8 text-center text-base font-bold font-mono text-white bg-transparent border-b border-transparent focus:border-white/60 focus:bg-white/[0.08] rounded outline-none py-0 transition-all"
                />
                <button
                  type="button"
                  onClick={() => adjustStartTime(-1, 0)}
                  className="w-5 h-4 flex items-center justify-center text-white/40 hover:text-white cursor-pointer"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>

              <span className="text-white/40 font-bold mb-1">:</span>

              {/* Minutes Typable + Chevrons */}
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => adjustStartTime(0, 15)}
                  className="w-5 h-4 flex items-center justify-center text-white/40 hover:text-white cursor-pointer"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={2}
                  value={start12.mins}
                  onChange={(e) => handleTypeStartMins(e.target.value)}
                  className="w-8 text-center text-base font-bold font-mono text-white bg-transparent border-b border-transparent focus:border-white/60 focus:bg-white/[0.08] rounded outline-none py-0 transition-all"
                />
                <button
                  type="button"
                  onClick={() => adjustStartTime(0, -15)}
                  className="w-5 h-4 flex items-center justify-center text-white/40 hover:text-white cursor-pointer"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* AM / PM Toggle */}
            <button
              type="button"
              onClick={toggleStartPeriod}
              className="px-2 py-1 rounded-lg bg-white/[0.08] hover:bg-white/15 text-[10px] font-mono font-bold text-white tracking-wider border border-white/15 cursor-pointer transition-all active:scale-95"
            >
              {start12.period}
            </button>
          </div>
        </div>

        {/* End Time Dial & Typable Input */}
        <div className="flex flex-col gap-1 p-2.5 rounded-xl bg-white/[0.04] border border-white/12">
          <span className="text-[9px] font-mono uppercase tracking-widest text-white/40 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
            Ends At
          </span>
          <div className="flex items-center justify-between gap-1 pt-1">
            {/* Hours Typable + Chevrons */}
            <div className="flex items-center gap-1">
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => adjustEndTime(1, 0)}
                  className="w-5 h-4 flex items-center justify-center text-white/40 hover:text-white cursor-pointer"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={2}
                  value={end12.h12}
                  onChange={(e) => handleTypeEndHour(e.target.value)}
                  className="w-8 text-center text-base font-bold font-mono text-white bg-transparent border-b border-transparent focus:border-white/60 focus:bg-white/[0.08] rounded outline-none py-0 transition-all"
                />
                <button
                  type="button"
                  onClick={() => adjustEndTime(-1, 0)}
                  className="w-5 h-4 flex items-center justify-center text-white/40 hover:text-white cursor-pointer"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>

              <span className="text-white/40 font-bold mb-1">:</span>

              {/* Minutes Typable + Chevrons */}
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => adjustEndTime(0, 15)}
                  className="w-5 h-4 flex items-center justify-center text-white/40 hover:text-white cursor-pointer"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={2}
                  value={end12.mins}
                  onChange={(e) => handleTypeEndMins(e.target.value)}
                  className="w-8 text-center text-base font-bold font-mono text-white bg-transparent border-b border-transparent focus:border-white/60 focus:bg-white/[0.08] rounded outline-none py-0 transition-all"
                />
                <button
                  type="button"
                  onClick={() => adjustEndTime(0, -15)}
                  className="w-5 h-4 flex items-center justify-center text-white/40 hover:text-white cursor-pointer"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* AM / PM Toggle */}
            <button
              type="button"
              onClick={toggleEndPeriod}
              className="px-2 py-1 rounded-lg bg-white/[0.08] hover:bg-white/15 text-[10px] font-mono font-bold text-white tracking-wider border border-white/15 cursor-pointer transition-all active:scale-95"
            >
              {end12.period}
            </button>
          </div>
        </div>
      </div>

      {/* Quick Duration Chips */}
      <div className="flex items-center gap-1.5 pt-0.5">
        <span className="text-[9px] font-mono text-white/35 uppercase mr-0.5">Span:</span>
        <div className="flex flex-wrap gap-1 flex-1">
          {DURATIONS.map((dur) => (
            <button
              type="button"
              key={dur.label}
              onClick={() => setDuration(dur.mins)}
              className="px-2.5 py-0.5 rounded-lg text-[10px] font-mono border border-white/10 bg-white/[0.03] text-white/60 hover:text-white hover:border-white/30 hover:bg-white/[0.08] transition-all cursor-pointer active:scale-95"
            >
              +{dur.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
