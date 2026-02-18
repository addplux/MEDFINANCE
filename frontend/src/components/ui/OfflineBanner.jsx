/**
 * MEDFINANCE360 Offline Banner
 * Author: Lubuto Chabusha
 * Developed: 2026
 *
 * Displays a banner at the top of the screen when the device is offline
 * or when there are pending records waiting to sync.
 */

import React from 'react';
import { useOffline } from '../../context/OfflineContext';

const OfflineBanner = () => {
    const { isOnline, pendingCount, isSyncing, triggerSync } = useOffline();

    // Nothing to show when online and queue is empty
    if (isOnline && pendingCount === 0 && !isSyncing) return null;

    const getBannerStyle = () => {
        if (!isOnline) return styles.offline;
        if (isSyncing) return styles.syncing;
        if (pendingCount > 0) return styles.pending;
        return styles.offline;
    };

    const getMessage = () => {
        if (isSyncing) {
            return `🔄 Syncing ${pendingCount} record${pendingCount !== 1 ? 's' : ''}...`;
        }
        if (!isOnline && pendingCount > 0) {
            return `📡 You are offline — ${pendingCount} record${pendingCount !== 1 ? 's' : ''} pending sync`;
        }
        if (!isOnline) {
            return '📡 You are offline — data will be saved locally';
        }
        if (pendingCount > 0) {
            return `🔄 Back online — ${pendingCount} record${pendingCount !== 1 ? 's' : ''} pending sync`;
        }
        return '';
    };

    return (
        <div style={{ ...styles.banner, ...getBannerStyle() }}>
            <span style={styles.message}>{getMessage()}</span>
            {isOnline && pendingCount > 0 && !isSyncing && (
                <button style={styles.syncBtn} onClick={triggerSync}>
                    Sync Now
                </button>
            )}
        </div>
    );
};

const styles = {
    banner: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        padding: '8px 16px',
        fontSize: '13px',
        fontWeight: '500',
        textAlign: 'center',
        transition: 'background-color 0.3s ease',
    },
    offline: {
        backgroundColor: '#f59e0b',
        color: '#1c1917',
    },
    syncing: {
        backgroundColor: '#3b82f6',
        color: '#ffffff',
    },
    pending: {
        backgroundColor: '#10b981',
        color: '#ffffff',
    },
    message: {
        letterSpacing: '0.01em',
    },
    syncBtn: {
        background: 'rgba(255,255,255,0.25)',
        border: '1px solid rgba(255,255,255,0.5)',
        borderRadius: '4px',
        color: 'inherit',
        cursor: 'pointer',
        fontSize: '12px',
        fontWeight: '600',
        padding: '2px 10px',
        transition: 'background 0.2s',
    },
};

export default OfflineBanner;
