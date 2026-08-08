import { create } from 'zustand';
import { db } from '../local-db';
import type { SyncStatusState } from '../sync/types';

interface SyncStore {
  status: SyncStatusState;
  lastSyncTime: string | null;
  pendingCount: number;
  isOnline: boolean;
  
  setStatus: (status: SyncStatusState) => void;
  setLastSyncTime: (time: string | null) => void;
  setIsOnline: (isOnline: boolean) => void;
  refreshPendingCount: () => Promise<void>;
}

export const useSyncStore = create<SyncStore>((set) => ({
  status: 'idle',
  lastSyncTime: null,
  pendingCount: 0,
  isOnline: true,
  
  setStatus: (status) => set({ status }),
  setLastSyncTime: (time) => set({ lastSyncTime: time }),
  setIsOnline: (isOnline) => set({ isOnline }),
  
  refreshPendingCount: async () => {
    try {
      const count = await db.sync_queue.count();
      set({ pendingCount: count });
    } catch (e) {
      console.error("Failed to count sync queue", e);
    }
  }
}));
