import { db } from "./index";
import type { DbResult } from "../db/types";
import { ok, err } from "../db/types";
import { handleDbError } from "../db/errors";
import type { LocalMetricDefinition, LocalMetricSubscription, LocalMetricEntry } from "./index";
import type { EnrolledMetric } from "../db/metrics";

export async function getLocalAvailableMetrics(userId: string): Promise<DbResult<LocalMetricDefinition[]>> {
  try {
    const metrics = await db.metric_definitions
      .filter(m => m.is_global === true || m.created_by === userId)
      .toArray();
    return ok(metrics);
  } catch (error) {
    return err(handleDbError(error));
  }
}

export async function getLocalUserSubscriptions(userId: string, activeOnly: boolean = true): Promise<DbResult<EnrolledMetric[]>> {
  try {
    let subscriptions = await db.metric_subscriptions
      .where("user_id")
      .equals(userId)
      .toArray();
      
    if (activeOnly) {
      subscriptions = subscriptions.filter(sub => sub.is_active);
    }

    const enrolled: EnrolledMetric[] = [];
    for (const sub of subscriptions) {
      const def = await db.metric_definitions.get(sub.metric_id);
      if (def) {
        // Construct the joined object
        enrolled.push({
          ...sub,
          metric_definition: def,
        });
      }
    }

    return ok(enrolled);
  } catch (error) {
    return err(handleDbError(error));
  }
}

export async function subscribeLocal(
  userId: string,
  metricId: string,
  targetValue?: number
): Promise<DbResult<LocalMetricSubscription>> {
  try {
    const now = new Date().toISOString();
    const subscription: LocalMetricSubscription = {
      user_id: userId,
      metric_id: metricId,
      target_value: targetValue ?? null,
      is_active: true,
      created_at: now,
      updated_at: now,
      sync_status: "pending",
    };

    await db.transaction("rw", db.metric_subscriptions, db.sync_queue, async () => {
      await db.metric_subscriptions.put(subscription);
      await db.sync_queue.add({
        id: crypto.randomUUID(),
        table_name: "metric_subscriptions",
        operation: "UPDATE", // Upsert semantics
        record_id: `${userId}:${metricId}`,
        payload: {
          user_id: userId,
          metric_id: metricId,
          target_value: targetValue ?? null,
          is_active: true,
          updated_at: now,
        },
        created_at: now,
      });
    });

    return ok(subscription);
  } catch (error) {
    return err(handleDbError(error));
  }
}

export async function unsubscribeLocal(
  userId: string,
  metricId: string
): Promise<DbResult<LocalMetricSubscription>> {
  try {
    const now = new Date().toISOString();
    const pk: [string, string] = [userId, metricId];
    
    let subscription = await db.metric_subscriptions.get(pk);
    if (!subscription) {
      return err(handleDbError(new Error("Subscription not found")));
    }
    
    subscription = {
      ...subscription,
      is_active: false,
      updated_at: now,
      sync_status: "pending",
    };

    await db.transaction("rw", db.metric_subscriptions, db.sync_queue, async () => {
      await db.metric_subscriptions.put(subscription!);
      await db.sync_queue.add({
        id: crypto.randomUUID(),
        table_name: "metric_subscriptions",
        operation: "UPDATE",
        record_id: `${userId}:${metricId}`,
        payload: {
          user_id: userId,
          metric_id: metricId,
          is_active: false,
          updated_at: now,
        },
        created_at: now,
      });
    });

    return ok(subscription);
  } catch (error) {
    return err(handleDbError(error));
  }
}

export async function createLocalCustomMetric(
  userId: string,
  name: string,
  type: string = 'boolean',
  polarity: string = 'positive'
): Promise<DbResult<LocalMetricDefinition>> {
  try {
    const now = new Date().toISOString();
    const metricId = crypto.randomUUID();
    const definition: LocalMetricDefinition = {
      id: metricId,
      name,
      type,
      polarity,
      unit: null,
      is_global: false,
      created_by: userId,
      created_at: now,
      updated_at: now,
      sync_status: "pending",
    };

    await db.transaction("rw", db.metric_definitions, db.metric_subscriptions, db.sync_queue, async () => {
      // 1. Insert definition
      await db.metric_definitions.add(definition);
      await db.sync_queue.add({
        id: crypto.randomUUID(),
        table_name: "metric_definitions",
        operation: "INSERT",
        record_id: metricId,
        payload: {
          id: metricId,
          name,
          type,
          polarity,
          is_global: false,
          created_by: userId,
          created_at: now,
          updated_at: now,
        },
        created_at: now,
      });

      // 2. Auto-subscribe
      const subscription: LocalMetricSubscription = {
        user_id: userId,
        metric_id: metricId,
        target_value: null,
        is_active: true,
        created_at: now,
        updated_at: now,
        sync_status: "pending",
      };
      
      await db.metric_subscriptions.put(subscription);
      await db.sync_queue.add({
        id: crypto.randomUUID(),
        table_name: "metric_subscriptions",
        operation: "UPDATE",
        record_id: `${userId}:${metricId}`,
        payload: {
          user_id: userId,
          metric_id: metricId,
          target_value: null,
          is_active: true,
          updated_at: now,
        },
        created_at: now,
      });
    });

    return ok(definition);
  } catch (error) {
    return err(handleDbError(error));
  }
}

export async function logLocalEntry(
  userId: string,
  metricId: string,
  value: number,
  startTime: string,
  endTime?: string
): Promise<DbResult<LocalMetricEntry>> {
  try {
    const now = new Date().toISOString();
    const entryId = crypto.randomUUID();
    const entry: LocalMetricEntry = {
      id: entryId,
      user_id: userId,
      metric_id: metricId,
      value,
      start_time: startTime,
      end_time: endTime ?? startTime,
      created_at: now,
      updated_at: now,
      sync_status: "pending",
    };

    await db.transaction("rw", db.metric_entries, db.sync_queue, async () => {
      await db.metric_entries.add(entry);
      await db.sync_queue.add({
        id: crypto.randomUUID(),
        table_name: "metric_entries",
        operation: "INSERT",
        record_id: entryId,
        payload: {
          id: entryId,
          user_id: userId,
          metric_id: metricId,
          value,
          start_time: startTime,
          end_time: endTime ?? startTime,
          created_at: now,
          updated_at: now,
        },
        created_at: now,
      });
    });

    return ok(entry);
  } catch (error) {
    return err(handleDbError(error));
  }
}

export async function getLocalEntries(
  userId: string,
  metricId?: string,
  timeRange?: { from: string; to: string }
): Promise<DbResult<LocalMetricEntry[]>> {
  try {
    let collection = db.metric_entries.where("user_id").equals(userId);

    const entries = await collection.toArray();
    
    // Dexie filter in memory for complex queries
    let filtered = entries;
    
    if (metricId) {
      filtered = filtered.filter(e => e.metric_id === metricId);
    }
    
    if (timeRange) {
      filtered = filtered.filter(e => e.start_time >= timeRange.from && e.start_time <= timeRange.to);
    }

    filtered.sort((a, b) => b.start_time.localeCompare(a.start_time)); // Descending

    return ok(filtered);
  } catch (error) {
    return err(handleDbError(error));
  }
}
