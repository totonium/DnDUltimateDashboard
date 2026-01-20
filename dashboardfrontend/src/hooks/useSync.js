/**
 * Sync Hook
 * React hook for sync service state and operations
 *
 * @module hooks/useSync
 */

import { useState, useEffect, useCallback } from 'react';
import { syncService } from '../services/sync';

/**
 * useSync - Hook for monitoring and managing data synchronization
 * @returns {object} Sync state and methods
 */
export function useSync() {
  const [status, setStatus] = useState({
    isOnline: true,
    syncInProgress: false,
    lastSyncAt: null,
    pendingChanges: 0
  });

  // Update status on mount and when changes occur
  useEffect(() => {
    const updateStatus = () => {
      const currentStatus = syncService.getStatus();
      setStatus(prev => ({
        ...prev,
        ...currentStatus
      }));
    };

    updateStatus();

    // Listen for online/offline events
    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);

    // Polling for pending changes (in production, could use subscriptions)
    const interval = setInterval(updateStatus, 5000);

    return () => {
      window.removeEventListener('online', updateStatus);
      window.removeEventListener('offline', updateStatus);
      clearInterval(interval);
    };
  }, []);

  // Manual sync trigger
  const triggerSync = useCallback(async () => {
    if (!status.isOnline || status.syncInProgress) return;

    try {
      setStatus(prev => ({ ...prev, syncInProgress: true }));
      await syncService.processSyncQueue();
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setStatus(prev => ({
        ...prev,
        syncInProgress: false,
        lastSyncAt: new Date().toISOString()
      }));
    }
  }, [status.isOnline, status.syncInProgress]);

  // Get sync status for a specific collection
  const getCollectionStatus = useCallback(async (collection) => {
    // Placeholder: In production, get sync status per collection
    return {
      localCount: 0,
      remoteCount: 0,
      synced: true
    };
  }, []);

  return {
    ...status,
    triggerSync,
    getCollectionStatus
  };
}

export default useSync;
