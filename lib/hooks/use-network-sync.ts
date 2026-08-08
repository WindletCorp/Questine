"use client";

import { useEffect, useState } from "react";
import { useSyncStore } from "@/lib/stores/use-sync-store";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

// DB functions for queue processing
import { createTask, updateTask, deleteTask } from "@/lib/db/tasks";
import { createRoutineBlock, updateRoutineBlock, deleteRoutineBlock } from "@/lib/db/routine-blocks";
import { createJournal, updateJournal, deleteJournal } from "@/lib/db/journals";

export function useNetworkSync() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  
  const { queue, setSyncing, removeFromQueue } = useSyncStore();

  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      
      const currentQueue = useSyncStore.getState().queue;
      if (currentQueue.length > 0) {
        setSyncing(true);
        const client = createSupabaseBrowserClient();
        
        // Process queue items one by one
        for (const task of currentQueue) {
          try {
            console.log("Syncing offline task", task);
            
            // Execute based on type
            switch (task.type) {
              case "CREATE_TASK":
                await createTask(client, task.payload);
                break;
              case "UPDATE_TASK":
                await updateTask(client, task.payload.id, task.payload.updates);
                break;
              case "DELETE_TASK":
                await deleteTask(client, task.payload.id);
                break;
                
              case "CREATE_ROUTINE_BLOCK":
                await createRoutineBlock(client, task.payload);
                break;
              case "UPDATE_ROUTINE_BLOCK":
                await updateRoutineBlock(client, task.payload.id, task.payload.updates);
                break;
              case "DELETE_ROUTINE_BLOCK":
                await deleteRoutineBlock(client, task.payload.id);
                break;
                
              case "CREATE_JOURNAL":
                await createJournal(client, task.payload);
                break;
              case "UPDATE_JOURNAL":
                await updateJournal(client, task.payload.id, task.payload.updates);
                break;
              case "DELETE_JOURNAL":
                await deleteJournal(client, task.payload.id);
                break;
            }
            
            // On success, remove from queue
            removeFromQueue(task.id);
          } catch (e) {
            console.error("Failed to sync task", task, e);
            // Optionally leave in queue for next retry
          }
        }
        setSyncing(false);
        // Trigger a custom event to notify panels to refresh their real data
        window.dispatchEvent(new Event("queue-synced"));
      }
    };

    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Initial check on mount
    if (navigator.onLine && queue.length > 0) {
      handleOnline();
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return { isOnline };
}

