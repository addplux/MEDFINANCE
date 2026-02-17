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

        // 1. Super Admin Bypass (if applicable, or just check if role is 'admin')
        if (req.user.role === 'admin') {
            return next();
        }

        // 2. Check against allowed ENUM roles (Legacy)
        if (allowedRoles.includes(req.user.role)) {
            return next();
        }

        // 3. Dynamic Role Check (Future-proofing)
        // If the user has a dynamic role assigned, we might want to check that too.
        // For now, valid ENUM roles are the primary gate for existing routes.

        return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
    };
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

module.exports = { authMiddleware, authorize, checkPermission };
