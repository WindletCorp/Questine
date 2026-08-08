import { SyncEngine } from "./engine";
import { useSyncStore } from "../stores/sync-store";

const SYNC_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

class Scheduler {
  private intervalId: NodeJS.Timeout | null = null;
  
  start() {
    if (typeof window === "undefined") return;

    // Listen to network changes
    window.addEventListener("online", this.handleOnline);
    window.addEventListener("offline", this.handleOffline);

    // Initial sync on startup
    if (navigator.onLine) {
      this.triggerSync();
    } else {
      useSyncStore.getState().setStatus("offline");
    }

    // Schedule regular syncs
    this.intervalId = setInterval(() => {
      if (navigator.onLine) {
        this.triggerSync();
      }
    }, SYNC_INTERVAL_MS);
  }

  stop() {
    if (typeof window === "undefined") return;
    
    window.removeEventListener("online", this.handleOnline);
    window.removeEventListener("offline", this.handleOffline);
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private handleOnline = () => {
    useSyncStore.getState().setStatus("idle");
    this.triggerSync();
  };

  private handleOffline = () => {
    useSyncStore.getState().setStatus("offline");
  };

  async triggerSync() {
    if (!navigator.onLine) return;
    
    const store = useSyncStore.getState();
    if (store.status === "syncing") return;

    store.setStatus("syncing");
    
    try {
      const result = await SyncEngine.fullSync();
      if (result.success) {
        store.setLastSyncTime(new Date().toISOString());
        store.setStatus("idle");
        
        // Notify UI to refresh data
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("sync-completed"));
        }
      } else {
        console.error("Sync completed with errors:", result.errors);
        store.setStatus("error");
      }
    } catch (error) {
      console.error("Sync failed:", error);
      store.setStatus("error");
    } finally {
      // Re-evaluate pending count
      store.refreshPendingCount();
    }
  }
}

export const SyncScheduler = new Scheduler();
