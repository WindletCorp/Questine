import Dexie, { type Table } from "dexie";
import type { Task, RoutineBlock, Journal, UserProfile, UserSettings, UserStats, MetricDefinition, UserMetric, MetricEntry } from "../db/types";

// Extended types for local DB
export type SyncStatus = "synced" | "pending" | "conflict";

export type LocalTask = Task & { sync_status: SyncStatus };
export type LocalRoutineBlock = RoutineBlock & { sync_status: SyncStatus };
export type LocalJournal = Journal & { sync_status: SyncStatus };
export type LocalMetricDefinition = MetricDefinition & { sync_status: SyncStatus };
export type LocalUserMetric = UserMetric & { sync_status: SyncStatus };
export type LocalMetricEntry = MetricEntry & { sync_status: SyncStatus };

// Sync Queue Entry for offline mutations
export type SyncOperation = "INSERT" | "UPDATE" | "DELETE";

export interface SyncQueueEntry {
  id: string; // uuid
  table_name: string;
  operation: SyncOperation;
  record_id: string; // The ID of the record in the target table
  payload: any; // The data payload for INSERT/UPDATE
  created_at: string;
}

export class QuestineDB extends Dexie {
  tasks!: Table<LocalTask, string>;
  routine_blocks!: Table<LocalRoutineBlock, string>;
  journals!: Table<LocalJournal, string>;
  
  user_profiles!: Table<UserProfile, string>;
  user_settings!: Table<UserSettings, string>;
  user_stats!: Table<UserStats, string>;
  
  metric_definitions!: Table<LocalMetricDefinition, string>;
  user_metrics!: Table<LocalUserMetric, string>;
  metric_entries!: Table<LocalMetricEntry, string>;
  
  // Offline sync queue and metadata
  sync_queue!: Table<SyncQueueEntry, string>;
  meta!: Table<{ key: string; value: any }, string>;

  constructor() {
    super("QuestineDB");
    
    this.version(4).stores({
      tasks: "id, user_id, updated_at, sync_status, start_time, end_time",
      routine_blocks: "id, user_id, updated_at, sync_status, start_time",
      journals: "id, user_id, updated_at, sync_status, start_time",
      user_profiles: "user_id",
      user_settings: "user_id",
      user_stats: "user_id",
      metric_definitions: "id, created_by, is_global, sync_status",
      user_metrics: "id, user_id, metric_id, sync_status",
      metric_entries: "id, user_metric_id, timestamp, sync_status",
      sync_queue: "id, table_name, created_at",
      meta: "key"
    });
  }
}

export const db = new QuestineDB();
