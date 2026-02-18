/**
 * MEDFINANCE360 Sync Controller
 * Author: Lubuto Chabusha
 * Developed: 2026
 *
 * Processes batched offline requests that were queued on the client
 * while the device was offline. Each item is replayed against the
 * appropriate route handler.
 */

const express = require('express');

/**
 * POST /api/sync/batch
 *
 * Body: { requests: [{ method, url, data }] }
 *
 * The `url` is the API path relative to /api, e.g. "/patients" or "/billing/opd"
 * We create a mini sub-request and forward it to the Express router.
 */
const processBatch = async (req, res) => {
    const { requests } = req.body;

    if (!Array.isArray(requests) || requests.length === 0) {
        return res.status(400).json({ error: 'requests array is required' });
    }

    const results = [];

    for (const item of requests) {
        try {
            const { method, url, data } = item;

            if (!method || !url) {
                results.push({ url, success: false, error: 'method and url are required' });
                continue;
            }

            // Build a synthetic request to forward internally
            // We use axios to call our own server (localhost) to reuse all existing route logic
            const axios = require('axios');
            const port = process.env.PORT || 5000;
            const baseUrl = `http://localhost:${port}/api`;

            // Strip /api prefix if present (url from client is already relative to /api)
            const cleanUrl = url.startsWith('/api') ? url.slice(4) : url;
            const fullUrl = `${baseUrl}${cleanUrl}`;

            const response = await axios({
                method: method.toLowerCase(),
                url: fullUrl,
                data: data || undefined,
                headers: {
                    'Content-Type': 'application/json',
                    // Forward the auth token from the original request
                    ...(req.headers.authorization
                        ? { Authorization: req.headers.authorization }
                        : {}),
                },
                validateStatus: () => true, // Don't throw on any status
            });

            results.push({
                url,
                method,
                success: response.status >= 200 && response.status < 300,
                status: response.status,
                data: response.data,
            });
        } catch (err) {
            results.push({
                url: item.url,
                method: item.method,
                success: false,
                error: err.message,
            });
        }
    }

    const synced = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    return res.json({
        message: `Batch sync complete: ${synced} synced, ${failed} failed`,
        synced,
        failed,
        total: results.length,
        results,
    });
};

module.exports = { processBatch };
