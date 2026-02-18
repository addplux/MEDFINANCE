/**
 * MEDFINANCE360 Offline Context
 * Author: Lubuto Chabusha
 * Developed: 2026
 *
 * Provides app-wide online/offline status, pending queue count, and sync state.
 * Automatically triggers sync when connectivity is restored.
 */

import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { getCount } from '../services/offlineQueue';
import { syncPendingRequests } from '../services/syncService';

const OfflineContext = createContext(null);

export const useOffline = () => {
    const context = useContext(OfflineContext);
    if (!context) {
        throw new Error('useOffline must be used within OfflineProvider');
    }
    return context;
};

export const OfflineProvider = ({ children }) => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [pendingCount, setPendingCount] = useState(0);
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSyncResult, setLastSyncResult] = useState(null);

    // Refresh the pending count from IndexedDB
    const refreshPendingCount = useCallback(async () => {
        try {
            const count = await getCount();
            setPendingCount(count);
        } catch (err) {
            console.error('[Offline] Failed to get pending count:', err);
        }
    }, []);

    // Trigger a manual or automatic sync
    const triggerSync = useCallback(async () => {
        if (isSyncing || !navigator.onLine) return;
        setIsSyncing(true);
        try {
            const result = await syncPendingRequests();
            setLastSyncResult(result);
            await refreshPendingCount();
        } catch (err) {
            console.error('[Offline] Sync failed:', err);
        } finally {
            setIsSyncing(false);
        }
    }, [isSyncing, refreshPendingCount]);

    // Listen to online/offline events
    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            // Auto-sync when we come back online
            triggerSync();
        };

        const handleOffline = () => {
            setIsOnline(false);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Listen for SW-triggered sync
        const handleSwSync = () => triggerSync();
        navigator.serviceWorker?.addEventListener('message', (event) => {
            if (event.data?.type === 'TRIGGER_SYNC') handleSwSync();
        });

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [triggerSync]);

    // Listen for queue changes dispatched by apiClient
    useEffect(() => {
        const handleQueueChange = () => refreshPendingCount();
        window.addEventListener('medfinance-queue-changed', handleQueueChange);
        window.addEventListener('medfinance-sync-complete', handleQueueChange);
        return () => {
            window.removeEventListener('medfinance-queue-changed', handleQueueChange);
            window.removeEventListener('medfinance-sync-complete', handleQueueChange);
        };
    }, [refreshPendingCount]);

    // Initial count on mount
    useEffect(() => {
        refreshPendingCount();
    }, [refreshPendingCount]);

    const value = {
        isOnline,
        pendingCount,
        isSyncing,
        lastSyncResult,
        triggerSync,
        refreshPendingCount,
    };

    return (
        <OfflineContext.Provider value={value}>
            {children}
        </OfflineContext.Provider>
    );
};
