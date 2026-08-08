import { create } from "zustand";
import { persist } from "zustand/middleware";

export type MutationTask = {
  id: string;
  type: string; // e.g. "CREATE_TASK", "UPDATE_JOURNAL"
  payload: any;
  createdAt: number;
};

interface SyncState {
  queue: MutationTask[];
  isSyncing: boolean;
  addToQueue: (task: MutationTask) => void;
  removeFromQueue: (id: string) => void;
  clearQueue: () => void;
  setSyncing: (syncing: boolean) => void;
}

export const useSyncStore = create<SyncState>()(
  persist(
    (set) => ({
      queue: [],
      isSyncing: false,
      addToQueue: (task) => set((state) => ({ queue: [...state.queue, task] })),
      removeFromQueue: (id) =>
        set((state) => ({ queue: state.queue.filter((t) => t.id !== id) })),
      clearQueue: () => set({ queue: [] }),
      setSyncing: (isSyncing) => set({ isSyncing }),
    }),
    {
      name: "questine-offline-sync-queue",
    }
  )
);
