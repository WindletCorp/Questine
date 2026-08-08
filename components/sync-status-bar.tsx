"use client";

import { useEffect } from "react";
import { useSyncStore } from "@/lib/stores/sync-store";
import { SyncScheduler } from "@/lib/sync/scheduler";
import { useNetworkMonitor } from "@/lib/stores/network-store";

export function SyncStatusBar() {
  useNetworkMonitor();
  
  const { status, lastSyncTime, pendingCount, isOnline, refreshPendingCount } = useSyncStore();

  useEffect(() => {
    SyncScheduler.start();
    // Poll pending count occasionally
    const interval = setInterval(refreshPendingCount, 5000);
    return () => {
      SyncScheduler.stop();
      clearInterval(interval);
    };
  }, [refreshPendingCount]);

  const handleSync = () => {
    SyncScheduler.triggerSync();
  };

  return (
    <div 
      className="fixed bottom-4 right-4 bg-gray-900 border border-gray-700 rounded-lg shadow-xl p-3 flex items-center gap-4 text-sm z-50"
      style={{
        position: 'fixed',
        bottom: '1rem',
        right: '1rem',
        backgroundColor: '#111827',
        border: '1px solid #374151',
        borderRadius: '0.5rem',
        padding: '0.75rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        zIndex: 9999,
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      }}
    >
      <div className="flex items-center gap-2" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-red-500'}`} />
        <span className="text-gray-300">{isOnline ? 'Online' : 'Offline'}</span>
      </div>
      
      <div className="text-gray-400 border-l border-gray-700 pl-4">
        {pendingCount > 0 ? (
          <span className="text-amber-400">{pendingCount} pending</span>
        ) : (
          <span>Synced</span>
        )}
      </div>

      {lastSyncTime && (
        <div className="text-xs text-gray-500">
          Last: {new Date(lastSyncTime).toLocaleTimeString()}
        </div>
      )}

      <button
        onClick={handleSync}
        disabled={!isOnline || status === "syncing"}
        style={{
          marginLeft: "0.5rem",
          backgroundColor: status === "syncing" || !isOnline ? "#374151" : "#4f46e5",
          color: status === "syncing" || !isOnline ? "#9ca3af" : "white",
          padding: "0.25rem 0.75rem",
          borderRadius: "0.25rem",
          border: "none",
          cursor: status === "syncing" || !isOnline ? "not-allowed" : "pointer"
        }}
        className="ml-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 disabled:text-gray-500 text-white px-3 py-1 rounded transition-colors"
      >
        {status === "syncing" ? "Syncing..." : "Sync Now"}
      </button>
    </div>
  );
}
