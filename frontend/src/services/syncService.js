/**
 * MEDFINANCE360 Sync Service
 * Author: Lubuto Chabusha
 * Developed: 2026
 *
 * Replays queued offline requests against the live API when connectivity
 * is restored. Uses the backend batch endpoint for efficiency.
 * Called automatically by OfflineContext on reconnect.
 */

import { getAll, remove, updateRetries } from './offlineQueue';

const MAX_RETRIES = 3;
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Sync all pending offline requests.
 * Returns a summary: { synced, failed, total }
 */
export async function syncPendingRequests() {
    const pending = await getAll();
    if (pending.length === 0) return { synced: 0, failed: 0, total: 0 };

    const token = localStorage.getItem('token');
    const authHeader = token ? { Authorization: `Bearer ${token}` } : {};

    // Try the batch endpoint first (most efficient)
    try {
        const batchPayload = pending.map((item) => ({
            method: item.method,
            url: item.url,
            data: item.data,
        }));

        const response = await fetch(`${API_BASE}/sync/batch`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...authHeader,
            },
            body: JSON.stringify({ requests: batchPayload }),
        });

        if (response.ok) {
            const result = await response.json();

            // Remove items that synced successfully, keep failed ones
            for (let i = 0; i < pending.length; i++) {
                const itemResult = result.results?.[i];
                if (itemResult?.success) {
                    await remove(pending[i].id);
                } else {
                    const newRetries = (pending[i].retries || 0) + 1;
                    if (newRetries >= MAX_RETRIES) {
                        await remove(pending[i].id);
                    } else {
                        await updateRetries(pending[i].id, newRetries);
                    }
                }
            }

            window.dispatchEvent(
                new CustomEvent('medfinance-sync-complete', {
                    detail: { synced: result.synced, failed: result.failed, total: result.total },
                })
            );

            return { synced: result.synced, failed: result.failed, total: result.total };
        }
    } catch (batchErr) {
        console.warn('[Sync] Batch endpoint unavailable, falling back to individual requests:', batchErr.message);
    }

    // Fallback: replay each request individually
    let synced = 0;
    let failed = 0;

    for (const item of pending) {
        const url = item.url.startsWith('http')
            ? item.url
            : `${API_BASE}${item.url}`;

        try {
            const response = await fetch(url, {
                method: item.method,
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeader,
                    ...(item.headers || {}),
                },
                body: item.data ? JSON.stringify(item.data) : undefined,
            });

            if (response.ok || response.status === 201 || response.status === 204) {
                await remove(item.id);
                synced++;
            } else if (response.status >= 400 && response.status < 500) {
                // Client error — won't succeed on retry, remove it
                await remove(item.id);
                failed++;
            } else {
                const newRetries = (item.retries || 0) + 1;
                if (newRetries >= MAX_RETRIES) {
                    await remove(item.id);
                } else {
                    await updateRetries(item.id, newRetries);
                }
                failed++;
            }
        } catch (err) {
            // Network still unavailable
            console.warn(`[Sync] Network error for item ${item.id}:`, err.message);
            failed++;
        }
    }

    window.dispatchEvent(
        new CustomEvent('medfinance-sync-complete', {
            detail: { synced, failed, total: pending.length },
        })
    );

    return { synced, failed, total: pending.length };
}
