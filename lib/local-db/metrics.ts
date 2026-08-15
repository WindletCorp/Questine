import { db, type LocalMetricDefinition, type LocalUserMetric, type LocalMetricEntry, type SyncQueueEntry } from "./index";
import { ok, err, type DbResult } from "../db/types";
import { handleDbError } from "../db/errors";

export async function getLocalGlobalMetrics(): Promise<DbResult<LocalMetricDefinition[]>> {
  try {
    const globalMetrics = await db.metric_definitions.filter(m => m.is_global === true).toArray();
    return ok(globalMetrics);
  } catch (error) {
    return err(handleDbError(error));
  }
}

export async function getLocalUserMetrics(userId: string): Promise<DbResult<(LocalUserMetric & { definition?: LocalMetricDefinition })[]>> {
  try {
    const userMetrics = await db.user_metrics.where("user_id").equals(userId).toArray();
    
    // Populate definitions manually
    const populated = await Promise.all(userMetrics.map(async (um) => {
      const def = await db.metric_definitions.get(um.metric_id);
      return { ...um, definition: def };
    }));

    return ok(populated);
  } catch (error) {
    return err(handleDbError(error));
  }
}

export async function enrollLocalMetric(userId: string, metricId: string, targetValue?: number): Promise<DbResult<LocalUserMetric>> {
  try {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const localUserMetric: LocalUserMetric = {
      id,
      user_id: userId,
      metric_id: metricId,
      target_value: targetValue ?? null,
      created_at: now,
      sync_status: "pending"
    };

    const queueEntry: SyncQueueEntry = {
      id: crypto.randomUUID(),
      table_name: "user_metrics",
      operation: "INSERT",
      record_id: id,
      payload: localUserMetric,
      created_at: now
    };

    await db.transaction("rw", db.user_metrics, db.sync_queue, async () => {
      await db.user_metrics.add(localUserMetric);
      await db.sync_queue.add(queueEntry);
    });

    return ok(localUserMetric);
  } catch (error) {
    return err(handleDbError(error));
  }
}

export async function createLocalCustomMetric(userId: string, name: string, type: string, polarity: string): Promise<DbResult<LocalMetricDefinition>> {
  try {
    const metricId = crypto.randomUUID();
    const now = new Date().toISOString();

    const localMetric: LocalMetricDefinition = {
      id: metricId,
      name,
      type,
      unit: null,
      polarity,
      is_global: false,
      created_by: userId,
      created_at: now,
      updated_at: now,
      sync_status: "pending"
    };

    const queueEntry: SyncQueueEntry = {
      id: crypto.randomUUID(),
      table_name: "metric_definitions",
      operation: "INSERT",
      record_id: metricId,
      payload: localMetric,
      created_at: now
    };

    await db.transaction("rw", db.metric_definitions, db.sync_queue, async () => {
      await db.metric_definitions.add(localMetric);
      await db.sync_queue.add(queueEntry);
    });

    // Auto enroll
    await enrollLocalMetric(userId, metricId);

    return ok(localMetric);
  } catch (error) {
    return err(handleDbError(error));
  }
}

export async function createLocalMetricEntry(userMetricId: string, value: number, timestamp: string): Promise<DbResult<LocalMetricEntry>> {
  try {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const localEntry: LocalMetricEntry = {
      id,
      user_metric_id: userMetricId,
      value,
      timestamp,
      entered_at: now,
      sync_status: "pending"
    };

    const queueEntry: SyncQueueEntry = {
      id: crypto.randomUUID(),
      table_name: "metric_entries",
      operation: "INSERT",
      record_id: id,
      payload: localEntry,
      created_at: now
    };

    await db.transaction("rw", db.metric_entries, db.sync_queue, async () => {
      await db.metric_entries.add(localEntry);
      await db.sync_queue.add(queueEntry);
    });

    return ok(localEntry);
  } catch (error) {
    return err(handleDbError(error));
  }
}

export async function getLocalMetricEntries(userMetricId: string): Promise<DbResult<LocalMetricEntry[]>> {
  try {
    const entries = await db.metric_entries.where("user_metric_id").equals(userMetricId).toArray();
    entries.sort((a, b) => (b.timestamp || "").localeCompare(a.timestamp || ""));
    return ok(entries);
  } catch (error) {
    return err(handleDbError(error));
  }
}
