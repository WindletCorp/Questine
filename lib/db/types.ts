// import removed to avoid conflict

export type ErrorCode = 
  | 'NOT_FOUND' 
  | 'UNAUTHORIZED' 
  | 'VALIDATION_ERROR' 
  | 'INTERNAL_ERROR' 
  | 'NETWORK_ERROR' 
  | 'CONFLICT';

export type AppError = {
  code: ErrorCode;
  message: string;
  details?: unknown;
};

export type DbResult<T> =
  | { data: T; error: null }
  | { data: null; error: AppError };

export function ok<T>(data: T): DbResult<T> {
  return { data, error: null };
}

export function err<T = never>(error: string | AppError): DbResult<T> {
  if (typeof error === 'string') {
    return { data: null, error: { code: 'INTERNAL_ERROR', message: error } };
  }
  return { data: null, error };
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

export type UserProfile = Database["public"]["Tables"]["user_profiles"]["Row"];
export type UserProfileUpdate = Database["public"]["Tables"]["user_profiles"]["Update"];
export type UserProfileInsert = Database["public"]["Tables"]["user_profiles"]["Insert"];

export type UserSettings = Database["public"]["Tables"]["user_settings"]["Row"];
export type UserSettingsUpdate = Database["public"]["Tables"]["user_settings"]["Update"];
export type UserSettingsInsert = Database["public"]["Tables"]["user_settings"]["Insert"];

export type UserStats = Database["public"]["Tables"]["user_stats"]["Row"];

export type MetricDefinition = {
  id: string;
  name: string;
  type: string;
  unit: string | null;
  polarity: string | null;
  is_global: boolean | null;
  created_by: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type UserMetric = {
  id: string;
  user_id: string;
  metric_id: string;
  target_value: number | null;
  created_at: string | null;
};

export type MetricEntry = {
  id: string;
  user_metric_id: string;
  value: number;
  timestamp: string;
  entered_at: string;
};
