import type { TimelineItem, EnrichedMetricEntry, Task, RoutineBlock, Journal } from "../db/types";
import { getTimelineRange } from "./timeline";

export interface TaskAnalytics {
  total: number;
  completed: number;
  completionRate: number; // 0 to 100
}

export interface RoutineCategoryStat {
  category: string;
  plannedMinutes: number;
  actualMinutes: number;
}

export interface RoutineAnalytics {
  plannedCount: number;
  actualCount: number;
  totalPlannedMinutes: number;
  totalActualMinutes: number;
  adherenceRate: number; // actualMinutes / plannedMinutes * 100
  categories: RoutineCategoryStat[];
}

export interface MetricStat {
  metricId: string;
  name: string;
  unit: string | null;
  polarity: string | null;
  latestValue: number;
  avgValue: number;
  entriesCount: number;
  values: { time: string; value: number }[];
}

export interface JournalAnalytics {
  total: number;
  wordCount: number;
}

export interface WeekAnalytics {
  tasks: TaskAnalytics;
  routines: RoutineAnalytics;
  metrics: MetricStat[];
  journals: JournalAnalytics;
}

/**
 * Computes high-level aggregated analytics from a flat list of TimelineItem[]
 * for the currently loaded time range.
 */
export function computeWeekAnalytics(items: TimelineItem[]): WeekAnalytics {
  const tasks: Task[] = [];
  const routineBlocks: RoutineBlock[] = [];
  const journals: Journal[] = [];
  const metricEntries: EnrichedMetricEntry[] = [];

  for (const item of items) {
    switch (item.type) {
      case "task":
        tasks.push(item.data);
        break;
      case "routine_block":
        routineBlocks.push(item.data);
        break;
      case "journal":
        journals.push(item.data);
        break;
      case "metric_entry":
        metricEntries.push(item.data);
        break;
    }
  }

  // 1. Task Analytics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed_at !== null).length;
  const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // 2. Routine Analytics
  let totalPlannedMinutes = 0;
  let totalActualMinutes = 0;
  let plannedCount = 0;
  let actualCount = 0;
  const categoryMap = new Map<string, { planned: number; actual: number }>();

  for (const block of routineBlocks) {
    const start = new Date(block.start_time).getTime();
    const end = new Date(block.end_time).getTime();
    const diffMins = Math.max(0, Math.round((end - start) / (1000 * 60)));

    const cat = block.category || "General";
    const current = categoryMap.get(cat) || { planned: 0, actual: 0 };

    if (block.type === "PLAN") {
      plannedCount++;
      totalPlannedMinutes += diffMins;
      current.planned += diffMins;
    } else {
      actualCount++;
      totalActualMinutes += diffMins;
      current.actual += diffMins;
    }
    categoryMap.set(cat, current);
  }

  const routineCategories: RoutineCategoryStat[] = Array.from(categoryMap.entries()).map(([category, stat]) => ({
    category,
    plannedMinutes: stat.planned,
    actualMinutes: stat.actual,
  }));

  const routineAdherence = totalPlannedMinutes > 0 
    ? Math.min(100, Math.round((totalActualMinutes / totalPlannedMinutes) * 100))
    : (totalActualMinutes > 0 ? 100 : 0);

  // 3. Metric Analytics
  const metricMap = new Map<string, { definition: EnrichedMetricEntry["definition"]; values: { time: string; value: number }[] }>();

  for (const entry of metricEntries) {
    const existing = metricMap.get(entry.metric_id) || {
      definition: entry.definition,
      values: [],
    };
    existing.values.push({ time: entry.start_time, value: entry.value });
    metricMap.set(entry.metric_id, existing);
  }

  const metricStats: MetricStat[] = Array.from(metricMap.entries()).map(([metricId, data]) => {
    // Sort ascending by time
    data.values.sort((a, b) => a.time.localeCompare(b.time));
    const sum = data.values.reduce((acc, v) => acc + v.value, 0);
    const avg = data.values.length > 0 ? Math.round((sum / data.values.length) * 10) / 10 : 0;
    const latest = data.values[data.values.length - 1]?.value ?? 0;

    return {
      metricId,
      name: data.definition.name,
      unit: data.definition.unit,
      polarity: data.definition.polarity,
      latestValue: latest,
      avgValue: avg,
      entriesCount: data.values.length,
      values: data.values,
    };
  });

  // 4. Journal Analytics
  const totalJournals = journals.length;
  let wordCount = 0;
  for (const j of journals) {
    wordCount += j.content.trim().split(/\s+/).filter(Boolean).length;
  }

  return {
    tasks: {
      total: totalTasks,
      completed: completedTasks,
      completionRate: taskCompletionRate,
    },
    routines: {
      plannedCount,
      actualCount,
      totalPlannedMinutes,
      totalActualMinutes,
      adherenceRate: routineAdherence,
      categories: routineCategories,
    },
    metrics: metricStats,
    journals: {
      total: totalJournals,
      wordCount,
    },
  };
}

export interface RangeAnalytics extends WeekAnalytics {
  activityDays: {
    date: string;
    taskCount: number;
    routineActualMinutes: number;
    routinePlannedMinutes: number;
  }[];
  focusScore: number;
  momentum: number;
}

export async function fetchRangeAnalytics(userId: string, startDate: string, endDate: string): Promise<RangeAnalytics> {
  const result = await getTimelineRange(userId, startDate, endDate);
  
  if (result.error) {
    console.error("Timeline Range Error:", result.error);
    throw new Error(`Failed to fetch timeline range: ${result.error.message || result.error}`);
  }

  const items = result.data;
  const base = computeWeekAnalytics(items);

  const activityMap = new Map<string, { taskCount: number; routineActualMinutes: number; routinePlannedMinutes: number }>();
  
  const curr = new Date(startDate);
  const end = new Date(endDate);
  while (curr <= end) {
    const dateStr = curr.toISOString().split("T")[0];
    activityMap.set(dateStr, { taskCount: 0, routineActualMinutes: 0, routinePlannedMinutes: 0 });
    curr.setUTCDate(curr.getUTCDate() + 1);
  }

  for (const item of items) {
    const dateStr = item.data.start_time.split("T")[0];
    const dayStat = activityMap.get(dateStr);
    if (!dayStat) continue;

    if (item.type === "task" && (item.data as Task).completed_at) {
      dayStat.taskCount++;
    } else if (item.type === "routine_block") {
      const block = item.data as RoutineBlock;
      const startMs = new Date(block.start_time).getTime();
      const endMs = new Date(block.end_time).getTime();
      const mins = Math.max(0, (endMs - startMs) / 60000);
      if (block.type === "ACTUAL") {
        dayStat.routineActualMinutes += mins;
      } else {
        dayStat.routinePlannedMinutes += mins;
      }
    }
  }

  const activityDays = Array.from(activityMap.entries())
    .map(([date, stats]) => ({ date, ...stats }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const focusScore = Math.round((base.tasks.completionRate + base.routines.adherenceRate) / 2);
  const momentum = base.routines.totalPlannedMinutes > 0 
    ? Math.round(((base.routines.totalActualMinutes - base.routines.totalPlannedMinutes) / base.routines.totalPlannedMinutes) * 100)
    : 0;

  return {
    ...base,
    activityDays,
    focusScore,
    momentum
  };
}
