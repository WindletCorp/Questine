export type SyncStatusState = "idle" | "syncing" | "error" | "offline";

export interface SyncResult {
  success: boolean;
  pushed: number;
  pulled: number;
  errors: any[];
}
