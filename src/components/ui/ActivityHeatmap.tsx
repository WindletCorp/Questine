"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface ActivityHeatmapProps {
  activityData: Record<string, number>;
  days?: number;
}

export function ActivityHeatmap({ activityData, days = 28 }: ActivityHeatmapProps) {
  const router = useRouter();

  const gridData = useMemo(() => {
    const today = new Date();
    // Normalize today to UTC midnight to avoid timezone shifts
    const normalizedToday = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
    
    // We want the grid to end on today. So start date is today - (days - 1).
    const startDate = new Date(normalizedToday.getTime() - (days - 1) * 24 * 60 * 60 * 1000);
    
    // Find the day of week of startDate (0 = Sunday, 1 = Monday)
    const flatDays = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      const dateStr = d.toISOString().split('T')[0];
      flatDays.push({
        dateStr,
        count: activityData[dateStr] || 0,
      });
    }

    // Pad the beginning so Sunday is always the top row.
    const startDayOfWeek = startDate.getUTCDay();
    const paddedFlatDays = [];
    for (let i = 0; i < startDayOfWeek; i++) {
      paddedFlatDays.push(null);
    }
    paddedFlatDays.push(...flatDays);

    return paddedFlatDays;
  }, [activityData, days]);

  const getColorClass = (count: number) => {
    if (count === 0) return "bg-gray-100 border-gray-200 text-gray-400";
    if (count <= 2) return "bg-blue-100 border-blue-200 text-blue-500 shadow-sm";
    if (count <= 5) return "bg-blue-300 border-blue-400 text-blue-700 shadow-sm";
    if (count <= 8) return "bg-pink-300 border-pink-400 text-pink-700 shadow-sm";
    return "bg-pink-500 border-pink-600 text-white shadow-md";
  };

  return (
    <div className="w-full bg-white border-4 border-gray-200 rounded-[2rem] p-6 shadow-[0_8px_0_0_#e5e7eb] flex flex-col gap-4">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl font-black text-gray-800">Your History</h2>
        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Past 4 Weeks</span>
      </div>

      <div className="grid grid-cols-7 gap-2 sm:gap-3 w-full max-w-[320px] mx-auto pb-4">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <div key={`header-${i}`} className="text-center text-[10px] font-black text-gray-300">
            {d}
          </div>
        ))}
        {gridData.map((day, dIdx) => {
          if (!day) {
            return <div key={`empty-${dIdx}`} className="aspect-square w-full rounded-lg" />;
          }
          const isToday = day.dateStr === new Date().toISOString().split('T')[0];
          return (
            <button
              key={day.dateStr}
              onClick={() => router.push(`/journal?date=${day.dateStr}`)}
              className={cn(
                "aspect-square w-full rounded-lg border-[3px] transition-all hover:scale-125 hover:z-10 group relative",
                getColorClass(day.count),
                isToday && "ring-2 ring-offset-2 ring-blue-400"
              )}
              aria-label={`${day.count} logs on ${day.dateStr}`}
            >
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center z-50 pointer-events-none w-max">
                <div className="bg-gray-800 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-lg flex flex-col items-center">
                  <span>{new Date(day.dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric'})}</span>
                  <span className="text-gray-300">{day.count} logs</span>
                </div>
                <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-gray-800" />
              </div>
            </button>
          );
        })}
      </div>
      
      <div className="flex items-center justify-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest mt-2">
        <span>Less</span>
        <div className="flex gap-1.5">
          <div className="w-4 h-4 rounded-md bg-gray-100 border-2 border-gray-200" />
          <div className="w-4 h-4 rounded-md bg-blue-100 border-2 border-blue-200" />
          <div className="w-4 h-4 rounded-md bg-blue-300 border-2 border-blue-400" />
          <div className="w-4 h-4 rounded-md bg-pink-300 border-2 border-pink-400" />
          <div className="w-4 h-4 rounded-md bg-pink-500 border-2 border-pink-600" />
        </div>
        <span>More</span>
      </div>
    </div>
  );
}
