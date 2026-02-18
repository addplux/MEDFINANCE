/**
 * MEDFINANCE360 Offline Queue
 * Author: Lubuto Chabusha
 * Developed: 2026
 *
 * Stores pending API mutations in IndexedDB when the device is offline.
 * Each queued item: { id, method, url, data, timestamp, retries }
 */

const DB_NAME = 'medfinance_offline_queue';
const DB_VERSION = 1;
const STORE_NAME = 'pending_requests';

let db = null;

function openDB() {
    if (db) return Promise.resolve(db);

    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const database = event.target.result;
            if (!database.objectStoreNames.contains(STORE_NAME)) {
                const store = database.createObjectStore(STORE_NAME, {
                    keyPath: 'id',
                    autoIncrement: true,
                });
                store.createIndex('timestamp', 'timestamp', { unique: false });
            }
        };

        request.onsuccess = (event) => {
            db = event.target.result;
            resolve(db);
        };

        request.onerror = (event) => {
            reject(event.target.error);
        };
    });
}

/**
 * Add a request to the offline queue.
 * @param {{ method: string, url: string, data: any, headers?: object }} request
 * @returns {Promise<number>} The generated ID
 */
export async function enqueue(request) {
    const database = await openDB();
    return new Promise((resolve, reject) => {
        const tx = database.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const item = {
            method: request.method,
            url: request.url,
            data: request.data,
            headers: request.headers || {},
            timestamp: Date.now(),
            retries: 0,
        };
        const req = store.add(item);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

/**
 * Get all pending requests, ordered by timestamp.
 * @returns {Promise<Array>}
 */
export async function getAll() {
    const database = await openDB();
    return new Promise((resolve, reject) => {
        const tx = database.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const index = store.index('timestamp');
        const req = index.getAll();
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

/**
 * Get count of pending requests.
 * @returns {Promise<number>}
 */
export async function getCount() {
    const database = await openDB();
    return new Promise((resolve, reject) => {
        const tx = database.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.count();
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

/**
 * Remove a request from the queue by ID.
 * @param {number} id
 */
export async function remove(id) {
    const database = await openDB();
    return new Promise((resolve, reject) => {
        const tx = database.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
    });
}

/**
 * Update retry count for a queued item.
 * @param {number} id
 * @param {number} retries
 */
export async function updateRetries(id, retries) {
    const database = await openDB();
    return new Promise((resolve, reject) => {
        const tx = database.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const getReq = store.get(id);
        getReq.onsuccess = () => {
            const item = getReq.result;
            if (item) {
                item.retries = retries;
                const putReq = store.put(item);
                putReq.onsuccess = () => resolve();
                putReq.onerror = () => reject(putReq.error);
            } else {
                resolve();
            }
        };
        getReq.onerror = () => reject(getReq.error);
    });
}

/**
 * Clear all pending requests.
 */
export async function clear() {
    const database = await openDB();
    return new Promise((resolve, reject) => {
        const tx = database.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.clear();
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
    });
}
