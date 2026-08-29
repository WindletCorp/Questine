import type { TimelineItem, EnrichedMetricEntry, Task, RoutineBlock, Journal } from "../db/types";

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
