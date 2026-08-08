import Dexie, { type Table } from "dexie";
import type { Task, RoutineBlock, Journal, UserProfile, UserStats } from "../db/types";

// Extended types for local DB
export type SyncStatus = "synced" | "pending" | "conflict";

export type LocalTask = Task & { sync_status: SyncStatus };
export type LocalRoutineBlock = RoutineBlock & { sync_status: SyncStatus };
export type LocalJournal = Journal & { sync_status: SyncStatus };

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
  
  // Users and Stats are mostly cached for read, but can be updated
  users!: Table<UserProfile, string>;
  user_stats!: Table<UserStats, string>;
  
  // Offline sync queue and metadata
  sync_queue!: Table<SyncQueueEntry, string>;
  meta!: Table<{ key: string; value: any }, string>;

  constructor() {
    super("QuestineDB");
    
    this.version(1).stores({
      tasks: "id, user_id, updated_at, sync_status, due_date",
      routine_blocks: "id, user_id, updated_at, sync_status, start_time",
      journals: "id, user_id, updated_at, sync_status, start_time",
      users: "id",
      user_stats: "user_id",
      sync_queue: "id, table_name, created_at",
      meta: "key"
    });
  }
}

export const db = new QuestineDB();
