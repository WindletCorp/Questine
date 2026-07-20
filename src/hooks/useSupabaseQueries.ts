"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { Database } from "@/types/database"; // assuming this exists

// Helper to get today's date strings
function getTodayStrings(dateStr?: string) {
  const todayDateObj = dateStr ? new Date(dateStr) : new Date();
  const year = todayDateObj.getFullYear();
  const month = String(todayDateObj.getMonth() + 1).padStart(2, '0');
  const day = String(todayDateObj.getDate()).padStart(2, '0');
  const today = `${year}-${month}-${day}`;
  const startOfDay = new Date(`${today}T00:00:00.000Z`).toISOString();
  const endOfDay = new Date(new Date(startOfDay).getTime() + 24 * 60 * 60 * 1000).toISOString();
  return { today, startOfDay, endOfDay };
}

export function useTodayTimelineBlocks(dateStr?: string) {
  const supabase = createClient();
  const { startOfDay, endOfDay, today } = getTodayStrings(dateStr);

  return useQuery({
    queryKey: ['timeline_blocks', today],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("timeline_blocks")
        .select("*")
        .eq("user_id", user.id)
        .gte("start_time", startOfDay)
        .lt("start_time", endOfDay)
        .order("start_time", { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });
}

export function useTodayMetricLogs(dateStr?: string) {
  const supabase = createClient();
  const { startOfDay, endOfDay, today } = getTodayStrings(dateStr);

  return useQuery({
    queryKey: ['metric_logs', today],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("metric_logs")
        .select("*, metric_definitions(name, unit)")
        .eq("user_id", user.id)
        .gte("recorded_at", startOfDay)
        .lt("recorded_at", endOfDay)
        .order("recorded_at", { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });
}

export function useTodayTasks(dateStr?: string) {
  const supabase = createClient();
  const { today } = getTodayStrings(dateStr);

  return useQuery({
    queryKey: ['tasks', today],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { startOfDay, endOfDay } = getTodayStrings(dateStr);

      const [res1, res2] = await Promise.all([
        supabase.from("tasks").select("*").eq("user_id", user.id).eq("target_date", today),
        supabase.from("tasks").select("*").eq("user_id", user.id).eq("status", "completed").gte("completed_at", startOfDay).lt("completed_at", endOfDay)
      ]);

      if (res1.error) throw res1.error;
      if (res2.error) throw res2.error;

      return [...(res1.data || []), ...(res2.data || [])];
    },
  });
}

export function useHistoricalActivity(days: number = 28) {
  const supabase = createClient();
  
  return useQuery({
    queryKey: ['historical_activity', days],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const todayDateObj = new Date();
      const year = todayDateObj.getFullYear();
      const month = String(todayDateObj.getMonth() + 1).padStart(2, '0');
      const day = String(todayDateObj.getDate()).padStart(2, '0');
      const normalizedToday = new Date(Date.UTC(year, parseInt(month) - 1, parseInt(day)));
      const historyStart = new Date(normalizedToday.getTime() - (days - 1) * 24 * 60 * 60 * 1000).toISOString();

      const [ { data: pastBlocks }, { data: pastTasks }, { data: pastMetrics } ] = await Promise.all([
        supabase.from("timeline_blocks").select("start_time").eq("user_id", user.id).eq("type", "actual").gte("start_time", historyStart),
        supabase.from("tasks").select("completed_at").eq("user_id", user.id).eq("status", "done").gte("completed_at", historyStart),
        supabase.from("metric_logs").select("recorded_at").eq("user_id", user.id).gte("recorded_at", historyStart),
      ]);

      const countsByDate: Record<string, number> = {};
      
      pastBlocks?.forEach(b => {
        const d = b.start_time.split("T")[0];
        countsByDate[d] = (countsByDate[d] || 0) + 1;
      });
      pastTasks?.forEach(t => {
        if (!t.completed_at) return;
        const d = t.completed_at.split("T")[0];
        countsByDate[d] = (countsByDate[d] || 0) + 1;
      });
      pastMetrics?.forEach(m => {
        const d = m.recorded_at.split("T")[0];
        countsByDate[d] = (countsByDate[d] || 0) + 1;
      });

      return countsByDate;
    },
  });
}
