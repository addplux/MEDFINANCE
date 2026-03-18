const rateLimit = require('express-rate-limit');

/**
 * Login limiter — strict: 5 attempts per 15 minutes per IP
 * Locks out brute-force password attacks.
 */
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        error: 'Too many login attempts. Please wait 15 minutes before trying again.'
    },
    skipSuccessfulRequests: true // Only counts failed/non-2xx responses
});

/**
 * Register limiter — moderate: 10 registrations per hour per IP
 * Prevents mass account creation spam.
 */
const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        error: 'Too many registration attempts. Please wait an hour before trying again.'
    }
});

/**
 * General API limiter — relaxed: 500 requests per 10 minutes per IP
 * Baseline protection against automated scraping / DoS.
 */
const generalApiLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 500,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        error: 'Too many requests. Please slow down.'
    },
    skip: (req) => {
        // Skip rate limiting for health checks and load balancer pings
        return req.path === '/health' || req.path === '/';
    }
});

module.exports = { loginLimiter, registerLimiter, generalApiLimiter };
