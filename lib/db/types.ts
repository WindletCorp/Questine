// import removed to avoid conflict

export type DbResult<T> =
  | { data: T; error: null }
  | { data: null; error: string };

export function ok<T>(data: T): DbResult<T> {
  return { data, error: null };
}

export function err<T = never>(message: string): DbResult<T> {
  return { data: null, error: message };
}

import type { Database as GeneratedDatabase } from "./database.types";

export type Waypoint = {
  order: number;
  title: string;
  description?: string;
  completed: boolean;
};

export type TaskMetadata = {
  waypoints?: Waypoint[];
  [key: string]: any;
};

// Global Schema Override Pattern
export type Database = Omit<GeneratedDatabase, "public"> & {
  public: Omit<GeneratedDatabase["public"], "Tables"> & {
    Tables: Omit<GeneratedDatabase["public"]["Tables"], "tasks"> & {
      tasks: Omit<GeneratedDatabase["public"]["Tables"]["tasks"], "Row" | "Insert" | "Update"> & {
        Row: Omit<GeneratedDatabase["public"]["Tables"]["tasks"]["Row"], "metadata"> & {
          metadata: TaskMetadata | null;
        };
        Insert: Omit<GeneratedDatabase["public"]["Tables"]["tasks"]["Insert"], "metadata"> & {
          metadata?: TaskMetadata | null;
        };
        Update: Omit<GeneratedDatabase["public"]["Tables"]["tasks"]["Update"], "metadata"> & {
          metadata?: TaskMetadata | null;
        };
      };
    };
  };
};

export type Task = Database["public"]["Tables"]["tasks"]["Row"];
export type TaskInsert = Database["public"]["Tables"]["tasks"]["Insert"];
export type TaskUpdate = Database["public"]["Tables"]["tasks"]["Update"];

export type RoutineBlock =
  Database["public"]["Tables"]["routine_blocks"]["Row"];
export type RoutineBlockInsert =
  Database["public"]["Tables"]["routine_blocks"]["Insert"];
export type RoutineBlockUpdate =
  Database["public"]["Tables"]["routine_blocks"]["Update"];

export type Journal = Database["public"]["Tables"]["journals"]["Row"];
export type JournalInsert = Database["public"]["Tables"]["journals"]["Insert"];
export type JournalUpdate = Database["public"]["Tables"]["journals"]["Update"];

export type UserProfile = Database["public"]["Tables"]["users"]["Row"];
export type UserStats = Database["public"]["Tables"]["user_stats"]["Row"];
