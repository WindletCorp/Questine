import type { Database } from "./database.types";

export type DbResult<T> =
  | { data: T; error: null }
  | { data: null; error: string };

export function ok<T>(data: T): DbResult<T> {
  return { data, error: null };
}

export function err<T = never>(message: string): DbResult<T> {
  return { data: null, error: message };
}

export type { Database } from "./database.types";

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
