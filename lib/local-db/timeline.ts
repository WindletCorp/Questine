import { db } from "./index";
import type { LocalTask, LocalRoutineBlock, LocalJournal, LocalMetricEntry } from "./index";
import type { DbResult, TimelineItem, MetricDefinitionSummary } from "../db/types";
import { ok, err } from "../db/types";
import { handleDbError } from "../db/errors";

/**
 * Computes the ISO start-of-week (Monday 00:00:00 UTC) for the given
 * week offset from the current week. offset=0 is this week, offset=-1
 * is last week, etc.
 */
export function getWeekBounds(weekOffset: number = 0): { start: string; end: string } {
  const now = new Date();
  // Get Monday of the current week
  const day = now.getUTCDay(); // 0=Sun, 1=Mon, ...
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + diffToMonday + (weekOffset * 7),
    0, 0, 0, 0
  ));

  const sunday = new Date(monday);
  sunday.setUTCDate(sunday.getUTCDate() + 6);
  sunday.setUTCHours(23, 59, 59, 999);

  return {
    start: monday.toISOString(),
    end: sunday.toISOString(),
  };
}

/**
 * Fetches all timeline-relevant entities for a user within a time range,
 * merges them into a flat sorted array of TimelineItem[].
 *
 * Performance:
 * - Uses a single Dexie read transaction for snapshot consistency
 * - Indexed range scans on start_time (no full-table scans)
 * - Batch metric_definition lookup by unique metric_id set
 */
export async function getTimelineRange(
  userId: string,
  rangeStart: string,
  rangeEnd: string
): Promise<DbResult<TimelineItem[]>> {
  try {
    const items: TimelineItem[] = await db.transaction(
      "r",
      [db.tasks, db.routine_blocks, db.journals, db.metric_entries, db.metric_definitions],
      async () => {
        // 1. Indexed range scan on each table's start_time
        const [tasks, routineBlocks, journals, metricEntries] = await Promise.all([
          db.tasks
            .where("start_time")
            .between(rangeStart, rangeEnd, true, true)
            .filter((t: LocalTask) => t.user_id === userId && !t.deleted_at)
            .toArray(),

          db.routine_blocks
            .where("start_time")
            .between(rangeStart, rangeEnd, true, true)
            .filter((b: LocalRoutineBlock) => b.user_id === userId && !b.deleted_at)
            .toArray(),

          db.journals
            .where("start_time")
            .between(rangeStart, rangeEnd, true, true)
            .filter((j: LocalJournal) => j.user_id === userId && !j.deleted_at)
            .toArray(),

          db.metric_entries
            .where("start_time")
            .between(rangeStart, rangeEnd, true, true)
            .filter((e: LocalMetricEntry) => e.user_id === userId)
            .toArray(),
        ]);

        // 2. Batch-fetch metric definitions for enrichment
        const uniqueMetricIds = [...new Set(metricEntries.map(e => e.metric_id))];
        const definitionMap = new Map<string, MetricDefinitionSummary>();

        if (uniqueMetricIds.length > 0) {
          const definitions = await db.metric_definitions
            .where("id")
            .anyOf(uniqueMetricIds)
            .toArray();

          for (const def of definitions) {
            definitionMap.set(def.id, {
              name: def.name,
              type: def.type,
              unit: def.unit,
              polarity: def.polarity,
            });
          }
        }

        // 3. Map to TimelineItem[]
        const result: TimelineItem[] = [];

        for (const task of tasks) {
          result.push({ type: "task", data: task });
        }
        for (const block of routineBlocks) {
          result.push({ type: "routine_block", data: block });
        }
        for (const journal of journals) {
          result.push({ type: "journal", data: journal });
        }
        for (const entry of metricEntries) {
          const definition = definitionMap.get(entry.metric_id);
          if (definition) {
            result.push({
              type: "metric_entry",
              data: { ...entry, definition },
            });
          }
        }

        return result;
      }
    );

    // 4. Sort ascending by start_time
    items.sort((a, b) => {
      const aTime = getItemStartTime(a);
      const bTime = getItemStartTime(b);
      return aTime.localeCompare(bTime);
    });

    return ok(items);
  } catch (error) {
    return err(handleDbError(error));
  }
}

/**
 * Convenience: fetch a single week's timeline.
 */
export async function getTimelineWeek(
  userId: string,
  weekOffset: number = 0
): Promise<DbResult<TimelineItem[]>> {
  const { start, end } = getWeekBounds(weekOffset);
  return getTimelineRange(userId, start, end);
}

/**
 * Extracts the start_time string from any TimelineItem variant.
 */
function getItemStartTime(item: TimelineItem): string {
  return item.data.start_time;
}
