const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    try {
        // Get token from header
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ error: 'No authentication token, access denied' });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Token is not valid' });
    }
};

// Role-based access control middleware (Legacy ENUM support + Dynamic Roles)
const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Super Admin Bypass — Superintendent and Admin always have full access
        if (req.user.role === 'admin' || req.user.role === 'superintendent') {
            return next();
        }

        // Check against allowed ENUM roles
        if (allowedRoles.includes(req.user.role)) {
            return next();
        }

        return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
    };
};

// Convenience role group constants for route guards
const ROLE_GROUPS = {
    FINANCE: ['accountant', 'superintendent', 'admin'],
    CLINICAL: ['doctor', 'nurse', 'superintendent', 'admin'],
    PHARMACY: ['pharmacist', 'superintendent', 'admin'],
    LAB: ['lab_technician', 'doctor', 'superintendent', 'admin'],
    RADIOLOGY: ['radiographer', 'doctor', 'superintendent', 'admin'],
    CASHIER: ['cashier', 'accountant', 'superintendent', 'admin'],
    ALL_STAFF: ['doctor', 'nurse', 'accountant', 'cashier', 'pharmacist', 'lab_technician', 'radiographer', 'superintendent', 'admin'],
};

// granular permission check middleware
const checkPermission = (resource, action) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            // Admin always has access
            if (req.user.role === 'admin') {
                return next();
            }

            // Fetch user with Role to get permissions
            // We need to fetch it here because req.user from JWT might be stale or lack the full permission object
            // To optimize, we could include permissions in JWT, but for now let's fetch.
            const { User, Role } = require('../models');
            const user = await User.findByPk(req.user.id, {
                include: [{ model: Role, as: 'userRole' }]
            });

            if (!user || !user.userRole) {
                // Fallback: If no dynamic role, deny access to protected resource
                return res.status(403).json({ error: 'Forbidden: No role assigned' });
            }

            const permissions = user.userRole.permissions || {};

            // Check for wildcard access on resource
            const resourcePermissions = permissions[resource] || permissions['*'] || [];

            // Check if action is allowed (or if user has 'manage'/'*' on that resource)
            if (resourcePermissions.includes(action) || resourcePermissions.includes('manage') || resourcePermissions.includes('*')) {
                return next();
            }

            return res.status(403).json({ error: `Forbidden: Missing ${action} permission for ${resource}` });

        } catch (error) {
            console.error('Permission check error:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    };
};

module.exports = { authMiddleware, authorize, checkPermission, ROLE_GROUPS };
